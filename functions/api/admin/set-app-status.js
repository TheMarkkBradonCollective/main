import { getSession, json, sameOrigin } from '../../_lib/auth.js';

const OWNER = 'TheMarkkBradonCollective';
const REPO = 'main';
const FILE = 'apk-catalog.json';
const ALLOWED = new Set(['available', 'request-to-download', 'coming-soon', 'web-only']);

function decodeContent(encoded) {
  const binary = atob(encoded.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeContent(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function github(path, token, options = {}) {
  return fetch('https://api.github.com' + path, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'MBC-Store-Founder-Dashboard',
      ...(options.headers || {}),
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOrigin(request)) return json({ ok: false, error: 'Bad origin' }, 403);
  const session = await getSession(context);
  if (!session) return json({ ok: false, error: 'Signed out' }, 401);
  if (session.role !== 'founder') return json({ ok: false, error: 'Founder access required' }, 403);
  if (!env.GITHUB_TOKEN) return json({ ok: false, error: 'Founder dashboard saving is not configured yet. Add the GITHUB_TOKEN Pages secret.' }, 503);

  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const status = typeof body?.status === 'string' ? body.status : '';
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) || !ALLOWED.has(status)) {
    return json({ ok: false, error: 'Invalid app or availability status.' }, 400);
  }

  const apiPath = '/repos/' + OWNER + '/' + REPO + '/contents/' + FILE;
  const read = await github(apiPath + '?ref=main', env.GITHUB_TOKEN);
  if (!read.ok) return json({ ok: false, error: 'Could not read the GitHub app catalog.' }, 502);
  const file = await read.json();
  let catalog;
  try { catalog = JSON.parse(decodeContent(file.content || '')); }
  catch (_) { return json({ ok: false, error: 'The GitHub app catalog could not be parsed.' }, 502); }

  const app = (catalog.apps || []).find((item) => item.slug === slug);
  if (!app) return json({ ok: false, error: 'App not found in the catalog.' }, 404);
  app.android = app.android || {};
  if (status === 'available' && !app.android.downloadUrl) {
    return json({ ok: false, error: 'This app has no APK URL. Add its APK release before making it available.' }, 400);
  }
  app.android.status = status;

  const update = await github(apiPath, env.GITHUB_TOKEN, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Founder: set ' + slug + ' availability to ' + status,
      content: encodeContent(JSON.stringify(catalog, null, 2) + '\n'),
      sha: file.sha,
      branch: 'main',
    }),
  });
  if (update.status === 409 || update.status === 422) {
    return json({ ok: false, error: 'The catalog changed while you were saving. Refresh the dashboard and try again.' }, 409);
  }
  if (!update.ok) return json({ ok: false, error: 'GitHub could not save the catalog change.' }, 502);
  return json({ ok: true, slug, status, commit: (await update.json()).commit?.sha || null });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
}

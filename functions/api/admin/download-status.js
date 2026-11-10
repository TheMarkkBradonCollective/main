import { getSession, json } from '../../_lib/auth.js';

// Read-only: HEAD-checks up to 20 catalog download links per request.
const MAX = 20;

export async function onRequestGet(context) {
  const s = await getSession(context);
  if (!s) return json({ ok: false, error: 'Signed out' }, 401);
  const url = new URL(context.request.url);
  const slugs = (url.searchParams.get('slugs') || '').split(',').filter(Boolean).slice(0, MAX);
  const catRes = await fetch(new URL('/apk-catalog.json', url.origin), { cf: { cacheTtl: 0 } });
  if (!catRes.ok) return json({ ok: false, error: 'Catalog unavailable' }, 502);
  const catalog = await catRes.json();
  const bySlug = new Map((catalog.apps || []).map((a) => [a.slug, a]));
  const results = await Promise.all(slugs.map(async (slug) => {
    const link = bySlug.get(slug)?.android?.downloadUrl;
    if (!link || !/^https:\/\//.test(link)) return { slug, status: null };
    try {
      const r = await fetch(link, { method: 'HEAD', redirect: 'follow' });
      return { slug, status: r.status, size: Number(r.headers.get('Content-Length')) || null };
    } catch (_) {
      return { slug, status: 0 };
    }
  }));
  return json({ ok: true, results });
}

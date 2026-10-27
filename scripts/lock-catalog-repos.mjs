#!/usr/bin/env node
/**
 * Lock catalog app source repos (private) while APKs stay public on this site.
 *
 * Run mirror-all-apks first so downloads use apks/{slug}/ on main, not raw GitHub URLs:
 *   npm run mirror-all-apks
 *   npm run lock-catalog-repos
 *   npm run sync-apk-catalog
 *
 * Requires a token with admin on each repo (owner classic PAT or gh auth as TheMarkkBradonCollective).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'My-Projects.json');
const owner = 'TheMarkkBradonCollective';

function getToken() {
  return (
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    (() => {
      try {
        return execSync('gh auth token', { encoding: 'utf8' }).trim();
      } catch {
        return null;
      }
    })()
  );
}

function parseGithubRepo(githubUrl) {
  if (!githubUrl) return null;
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== 'github.com') return null;
    const [, repoOwner, repo] = url.pathname.split('/');
    if (!repoOwner || !repo) return null;
    return { owner: repoOwner, repo: repo.replace(/\.git$/, '') };
  } catch {
    return null;
  }
}

async function githubRequest(token, method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const token = getToken();
  if (!token) {
    console.error('Set GITHUB_TOKEN (classic PAT with repo scope + admin on each repo).');
    console.error('Or: gh auth login as TheMarkkBradonCollective → https://github.com/login/device');
    process.exit(1);
  }

  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const targets = catalog
    .filter((app) => app.github)
    .map((app) => {
      const info = parseGithubRepo(app.github);
      return { app, ...info };
    })
    .filter((item) => item.repo && item.repo !== 'main');

  if (!targets.length) {
    console.log('No catalog repos to lock.');
    return;
  }

  console.log(`Locking ${targets.length} catalog source repos under ${owner}…`);
  console.log('APK downloads stay public via apks/ on the main site.\n');

  const locked = [];
  const skipped = [];
  const failed = [];

  for (const { app, repo } of targets) {
    const current = await githubRequest(token, 'GET', `/repos/${owner}/${repo}`);
    if (!current.ok) {
      const msg = current.data?.message || current.status;
      if (current.status === 404) {
        console.log(`? ${repo} — not visible to token (already private or no access)`);
        locked.push(app.slug);
        skipped.push({ repo, reason: msg });
      } else {
        console.log(`✗ ${repo} — cannot read (${msg})`);
        failed.push({ repo, reason: msg });
      }
      continue;
    }

    if (current.data.private === true) {
      console.log(`✓ ${repo} — already private`);
      locked.push(app.slug);
      continue;
    }

    const patch = await githubRequest(token, 'PATCH', `/repos/${owner}/${repo}`, {
      visibility: 'private',
      private: true,
    });

    if (!patch.ok) {
      const msg = patch.data?.message || patch.status;
      console.log(`✗ ${repo} — lock failed (${msg})`);
      failed.push({ repo, reason: msg });
      continue;
    }

    console.log(`✓ ${repo} — now private`);
    locked.push(app.slug);
  }

  let changed = false;
  for (const app of catalog) {
    if (locked.includes(app.slug) && app.githubPrivate !== true) {
      app.githubPrivate = true;
      changed = true;
    }
  }

  if (changed) {
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log('\nUpdated My-Projects.json (githubPrivate → true).');
  }

  console.log(`\nSummary: ${locked.length} private/locked, ${failed.length} failed`);
  if (failed.length) {
    console.log('\nFailed repos need owner auth (not the cursor bot integration):');
    for (const { repo, reason } of failed) console.log(`  • ${repo}: ${reason}`);
    console.log('\nAuthenticate as TheMarkkBradonCollective, then re-run:');
    console.log('  gh auth login --hostname github.com --git-protocol https --scopes repo');
    console.log('  npm run lock-catalog-repos');
    process.exit(1);
  }

  console.log('\nDone. Re-run npm run sync-apk-catalog to refresh download URLs.');
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}`);
  process.exit(1);
});

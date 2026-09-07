#!/usr/bin/env node
/**
 * Set catalog app repos to public on GitHub and sync My-Projects.json flags.
 * Requires a token with admin on each repo (classic PAT with `repo`, or org owner).
 *
 *   export GITHUB_TOKEN=ghp_...
 *   npm run make-repos-public
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'My-Projects.json');
const owner = 'TheMarkkBradonCollective';

function getToken() {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
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

  if (!res.ok) {
    const message = data?.message || res.statusText;
    const hint =
      res.status === 404
        ? ' (repo missing, or token lacks admin access to this private repo)'
        : '';
    throw new Error(`${method} ${path} → ${res.status} ${message}${hint}`);
  }

  return data;
}

async function main() {
  const token = getToken();
  if (!token) {
    console.error('Set GITHUB_TOKEN (classic PAT with repo scope + admin on each repo).');
    process.exit(1);
  }

  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const targets = catalog
    .filter((app) => app.github && app.githubPrivate === true)
    .map((app) => {
      const info = parseGithubRepo(app.github);
      return { app, ...info };
    })
    .filter((item) => item.repo);

  if (targets.length === 0) {
    console.log('No private catalog repos left in My-Projects.json.');
    return;
  }

  console.log(`Making ${targets.length} repos public under ${owner}…\n`);

  const updated = [];
  for (const { app, repo } of targets) {
    const current = await githubRequest(token, 'GET', `/repos/${owner}/${repo}`);
    if (current.private !== true && current.visibility === 'public') {
      console.log(`✓ ${repo} — already public`);
      updated.push(app.slug);
      continue;
    }

    await githubRequest(token, 'PATCH', `/repos/${owner}/${repo}`, {
      visibility: 'public',
      private: false,
    });
    console.log(`✓ ${repo} — now public`);
    updated.push(app.slug);
  }

  let changed = false;
  for (const app of catalog) {
    if (updated.includes(app.slug) && app.githubPrivate === true) {
      app.githubPrivate = false;
      changed = true;
    }
  }

  if (changed) {
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log('\nUpdated My-Projects.json (githubPrivate → false).');
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}`);
  process.exit(1);
});

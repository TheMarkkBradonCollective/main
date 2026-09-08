#!/usr/bin/env node
/**
 * Make every org repo private except catalog-listed repos and main.
 */
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const owner = 'TheMarkkBradonCollective';
const keepPublic = new Set(['main']);

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

async function github(token, method, path, body) {
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${data.message || ''}`);
  return data;
}

async function listOrgRepos(token) {
  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await github(
      token,
      'GET',
      `/users/${owner}/repos?per_page=100&page=${page}&type=all`
    );
    if (!Array.isArray(batch) || !batch.length) break;
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

async function main() {
  const token = getToken();
  if (!token) {
    console.error('Need GITHUB_TOKEN or gh auth as org owner.');
    process.exit(1);
  }

  const catalog = JSON.parse(await readFile(join(root, 'My-Projects.json'), 'utf8'));
  for (const app of catalog) {
    if (!app.github) continue;
    keepPublic.add(app.github.split('/').pop());
  }

  const repos = await listOrgRepos(token);
  const toLock = repos.filter((repo) => !keepPublic.has(repo.name) && !repo.private);

  if (!toLock.length) {
    console.log('No unlisted public repos to lock.');
    return;
  }

  console.log(`Keeping public (${keepPublic.size}): ${[...keepPublic].sort().join(', ')}\n`);
  console.log(`Locking ${toLock.length} unlisted repos…\n`);

  for (const repo of toLock) {
    await github(token, 'PATCH', `/repos/${owner}/${repo.name}`, {
      visibility: 'private',
      private: true,
    });
    console.log(`✓ ${repo.name} → private`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Pull latest APKs from private repos, refresh catalog, and rebuild download zips.
 * Requires gh auth as TheMarkkBradonCollective (or GITHUB_TOKEN with repo scope).
 */
import { spawnSync } from 'node:child_process';
import { execSync } from 'node:child_process';

function run(label, cmd, args) {
  console.log(`\n=== ${label} ===\n`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, MIRROR_ALL_APKS: '1' } });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function tokenCanReadPrivate() {
  try {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || execSync('gh auth token', { encoding: 'utf8' }).trim();
    return fetch('https://api.github.com/repos/TheMarkkBradonCollective/StrainVerse', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    }).then((r) => r.status === 200);
  } catch {
    return Promise.resolve(false);
  }
}

if (!(await tokenCanReadPrivate())) {
  console.error('Cannot read private app repos. Authenticate as TheMarkkBradonCollective:');
  console.error('  https://github.com/login/device');
  console.error('  gh auth login --hostname github.com --git-protocol https --scopes repo');
  process.exit(1);
}

run('Mirror all APKs', 'npm', ['run', 'mirror-all-apks']);
run('Package MBC Store ZIP', 'npm', ['run', 'package-mbc-store-zip']);
run('Package Verse ZIP', 'npm', ['run', 'package-verse-zip']);
run('Package full catalog ZIP', 'npm', ['run', 'package-apk-release']);
run('Publish GitHub release assets', 'bash', ['scripts/publish-apk-release.sh']);

console.log('\n✓ All APK mirrors and download zips refreshed.\n');

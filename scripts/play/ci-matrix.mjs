#!/usr/bin/env node
/**
 * Emit GitHub Actions matrix slugs from play-apps.json (runs sync first).
 * Writes local + cloned JSON arrays to GITHUB_OUTPUT when set.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sync = spawnSync(process.execPath, [path.join(root, 'scripts/play/sync-play-apps.mjs')], {
  stdio: 'inherit',
});
if (sync.status !== 0) process.exit(sync.status ?? 1);

const config = JSON.parse(readFileSync(path.join(root, 'scripts/play/play-apps.json'), 'utf8'));
const local = [];
const cloned = [];
for (const app of config.apps) {
  if (app.build?.clone) cloned.push(app.slug);
  else local.push(app.slug);
}

const payload = {
  local: local.length ? local : ['__skip__'],
  cloned: cloned.length ? cloned : ['__skip__'],
};

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `local=${JSON.stringify(payload.local)}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `cloned=${JSON.stringify(payload.cloned)}\n`);
} else {
  console.log(JSON.stringify(payload, null, 2));
}

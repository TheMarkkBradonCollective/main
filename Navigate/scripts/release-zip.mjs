#!/usr/bin/env node
/**
 * Create Navigate release zip (APK + version.json + README) for GitHub Releases.
 */
import { readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';
const outDir = join(root, 'release');
const zipPath = join(outDir, `Navigate-v${version}-release.zip`);

await mkdir(outDir, { recursive: true });

const staging = join(outDir, 'staging');
await mkdir(staging, { recursive: true });

const { copyFile } = await import('node:fs/promises');
await copyFile(join(root, 'public', 'navigate.apk'), join(staging, `Navigate-v${version}.apk`));
await copyFile(join(root, 'public', 'version.json'), join(staging, 'version.json'));
await copyFile(join(root, 'README.md'), join(staging, 'README.md'));

const r = spawnSync('zip', ['-j', zipPath, ...['Navigate-v' + version + '.apk', 'version.json', 'README.md'].map((f) => join(staging, f))], {
  cwd: staging,
  stdio: 'inherit',
});

if (r.status !== 0) throw new Error('zip failed');
console.log(`Wrote ${zipPath}`);

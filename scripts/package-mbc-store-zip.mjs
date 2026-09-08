#!/usr/bin/env node
/**
 * Zip the signed MBC Store APK for reliable mobile downloads.
 * Output: release/MBC-Store-v{version}.zip and download/releases/ copy for GitHub Pages.
 */
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const storeVersion = '1.0.0';
const apkName = `MBC-Store-v${storeVersion}.apk`;
const apkPath = join(root, 'apks', 'mbc-store', apkName);
const zipName = `MBC-Store-v${storeVersion}.zip`;
const releaseDir = join(root, 'release');
const staging = join(releaseDir, 'staging-mbc-store');
const zipPath = join(releaseDir, zipName);
const pagesZip = join(root, 'download', 'releases', zipName);

await mkdir(releaseDir, { recursive: true });
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });

const readme = [
  'MBC Store — The Markk Brandon Collective App Store',
  '',
  'Install steps (Android):',
  '1. Unzip this folder on your phone (Files app → tap the zip → Extract).',
  `2. Open ${apkName} from the extracted folder.`,
  '3. Tap Install when Android asks. Allow installs from your file app if prompted.',
  '4. Open MBC Store and install or update any Collective app from the catalog.',
  '',
  'Online catalog: https://themarkkbradoncollective.github.io/main/download/',
  '',
].join('\n');

await copyFile(apkPath, join(staging, apkName));
await writeFile(join(staging, 'README.txt'), readme);

const r = spawnSync('zip', ['-r', '-q', zipPath, '.'], { cwd: staging, stdio: 'inherit' });
if (r.status !== 0) throw new Error('zip failed');

await mkdir(dirname(pagesZip), { recursive: true });
await copyFile(zipPath, pagesZip);

const info = await stat(zipPath);
console.log(`\nWrote ${zipPath} (${(info.size / (1024 * 1024)).toFixed(1)} MB)`);
console.log(`Wrote ${pagesZip}`);

#!/usr/bin/env node
/**
 * Zip the three Verse family APKs (StrainVerse, SpiritsVerse, Cookverse).
 */
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'apk-catalog.json');
const releaseDir = join(root, 'release');
const staging = join(releaseDir, 'staging-verse');
const zipName = 'Verse-v1.zip';
const zipPath = join(releaseDir, zipName);
const pagesZip = join(root, 'download', 'releases', zipName);

const VERSE_SLUGS = ['strainverse', 'spiritsverse', 'cookverse'];

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const apps = VERSE_SLUGS.map((slug) => catalog.apps.find((a) => a.slug === slug)).filter(Boolean);

await mkdir(releaseDir, { recursive: true });
await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });

const manifest = [];

for (const app of apps) {
  const android = app.android;
  if (!android?.downloadUrl?.startsWith('apks/')) {
    throw new Error(`No APK for ${app.slug}`);
  }
  const rel = android.downloadUrl.replace(/^apks\//, '');
  const src = join(root, 'apks', rel);
  const dest = join(staging, android.downloadName || rel.split('/').pop());
  await copyFile(src, dest);
  const info = await stat(dest);
  manifest.push({
    slug: app.slug,
    name: app.name,
    version: android.version,
    file: android.downloadName,
    bytes: info.size,
    sha256: android.sha256,
  });
}

const readme = [
  'The Verse — StrainVerse · SpiritsVerse · Cookverse',
  '',
  'Install steps (Android):',
  '1. Unzip this folder on your phone.',
  '2. Tap each APK you want and confirm Install.',
  '3. Or install all three — they are separate apps in the Verse family.',
  '',
  ...manifest.map((item) => `- ${item.name} v${item.version} → ${item.file}`),
  '',
  'MBC App Store: https://themarkkbradoncollective.github.io/main/download/',
  '',
].join('\n');

await writeFile(join(staging, 'README.txt'), readme);
await writeFile(join(staging, 'MANIFEST.json'), `${JSON.stringify({ apps: manifest, generatedAt: new Date().toISOString() }, null, 2)}\n`);

const r = spawnSync('zip', ['-r', '-q', zipPath, '.'], { cwd: staging, stdio: 'inherit' });
if (r.status !== 0) throw new Error('zip failed');

await mkdir(dirname(pagesZip), { recursive: true });
await copyFile(zipPath, pagesZip);

const info = await stat(zipPath);
console.log(`\nWrote ${zipPath} (${(info.size / (1024 * 1024)).toFixed(1)} MB, ${manifest.length} APKs)`);
console.log(`Wrote ${pagesZip}`);

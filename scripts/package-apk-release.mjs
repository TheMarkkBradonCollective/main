#!/usr/bin/env node
/**
 * Bundle mirrored APKs for GitHub Releases on TheMarkkBradonCollective/main.
 *
 *   npm run package-apk-release          # latest APK per catalog app + MBC Store
 *   npm run package-apk-release -- --full   # every APK under apks/ (archives included)
 */
import { access, copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'apk-catalog.json');
const versionPath = join(root, 'version.json');
const apksRoot = join(root, 'apks');
const releaseDir = join(root, 'release');

const fullArchive = process.argv.includes('--full');

function siteVersion(versionJson) {
  return versionJson?.version || '1.0.0';
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function collectLatestEntries(catalog) {
  const entries = [];

  if (catalog.storeApp?.downloadUrl?.startsWith('apks/')) {
    entries.push({
      slug: 'mbc-store',
      name: catalog.storeApp.name || 'MBC Store',
      version: catalog.storeApp.version || null,
      relPath: catalog.storeApp.downloadUrl.replace(/^apks\//, ''),
    });
  }

  for (const app of catalog.apps) {
    const android = app.android;
    if (!android || android.status !== 'available') continue;
    if (!android.downloadUrl?.startsWith('apks/')) continue;
    entries.push({
      slug: app.slug,
      name: app.name,
      version: android.version || null,
      relPath: android.downloadUrl.replace(/^apks\//, ''),
    });
  }

  return entries;
}

async function collectAllApkPaths() {
  const paths = [];

  async function walk(dir) {
    const names = await readdir(dir, { withFileTypes: true });
    for (const entry of names) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) await walk(abs);
      else if (entry.name.endsWith('.apk')) paths.push(relative(apksRoot, abs));
    }
  }

  await walk(apksRoot);
  return paths.sort();
}

async function stageLatest(catalog, staging) {
  const entries = await collectLatestEntries(catalog);
  const manifest = {
    generatedAt: new Date().toISOString(),
    bundle: 'latest',
    siteVersion: siteVersion(JSON.parse(await readFile(versionPath, 'utf8'))),
    apps: [],
  };

  for (const entry of entries) {
    const src = join(apksRoot, entry.relPath);
    if (!(await exists(src))) {
      throw new Error(`Missing APK: ${entry.relPath}`);
    }
    const dest = join(staging, entry.relPath);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(src, dest);
    const info = await stat(src);
    manifest.apps.push({
      slug: entry.slug,
      name: entry.name,
      version: entry.version,
      file: entry.relPath.replace(/\\/g, '/'),
      bytes: info.size,
    });
  }

  manifest.totalBytes = manifest.apps.reduce((sum, item) => sum + item.bytes, 0);
  await writeFile(join(staging, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const readme = [
    'MBC All APKs — latest builds',
    '',
    'Install individual apps from the MBC App Store:',
    'https://themarkkbradoncollective.github.io/main/download/',
    '',
    'Each subfolder is one app slug. MANIFEST.json lists versions and file sizes.',
    '',
    ...manifest.apps.map((item) => `- ${item.name} (${item.slug}) — ${item.version || 'apk'} → ${item.file}`),
    '',
  ].join('\n');
  await writeFile(join(staging, 'README.txt'), readme);

  return { entries: manifest.apps, manifest };
}

async function stageFull(staging) {
  const relPaths = await collectAllApkPaths();
  const manifest = {
    generatedAt: new Date().toISOString(),
    bundle: 'full',
    siteVersion: siteVersion(JSON.parse(await readFile(versionPath, 'utf8'))),
    files: [],
  };

  for (const relPath of relPaths) {
    const src = join(apksRoot, relPath);
    const dest = join(staging, relPath);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(src, dest);
    const info = await stat(src);
    manifest.files.push({
      file: relPath.replace(/\\/g, '/'),
      bytes: info.size,
    });
  }

  manifest.totalBytes = manifest.files.reduce((sum, item) => sum + item.bytes, 0);
  await writeFile(join(staging, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    join(staging, 'README.txt'),
    [
      'MBC All APKs — full mirror archive',
      '',
      'Includes current builds and older archived APKs mirrored under apks/.',
      'For latest-only installs, use MBC-All-APKs-latest.zip instead.',
      '',
    ].join('\n')
  );

  return { count: manifest.files.length, manifest };
}

function zipDirectory(staging, zipPath) {
  const r = spawnSync('zip', ['-r', '-q', zipPath, '.'], { cwd: staging, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`zip failed for ${zipPath}`);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const versionJson = JSON.parse(await readFile(versionPath, 'utf8'));
const version = siteVersion(versionJson);
await mkdir(releaseDir, { recursive: true });

if (fullArchive) {
  const staging = join(releaseDir, 'staging-full');
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  const { count, manifest } = await stageFull(staging);
  const zipPath = join(releaseDir, `MBC-All-APKs-full-v${version}.zip`);
  zipDirectory(staging, zipPath);
  const zipStat = await stat(zipPath);
  console.log(`\nWrote ${relative(root, zipPath)} (${formatBytes(zipStat.size)}, ${count} APKs)\n`);
} else {
  const staging = join(releaseDir, 'staging-latest');
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  const { entries, manifest } = await stageLatest(catalog, staging);
  const zipPath = join(releaseDir, `MBC-All-APKs-latest-v${version}.zip`);
  zipDirectory(staging, zipPath);
  const zipStat = await stat(zipPath);
  console.log(`\nWrote ${relative(root, zipPath)} (${formatBytes(zipStat.size)}, ${entries.length} APKs)\n`);
}

await writeFile(
  join(releaseDir, 'LATEST.txt'),
  fullArchive ? `MBC-All-APKs-full-v${version}.zip` : `MBC-All-APKs-latest-v${version}.zip`
);

#!/usr/bin/env node
/**
 * Discover Android APKs for each app in My-Projects.json.
 * Reads version.json manifests and probes common APK paths on live hosts.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'My-Projects.json');

function normalizeBase(url) {
  let base = url.replace(/\/$/, '');
  if (base === 'https://guardr.co') base = 'https://www.guardr.co';
  return base;
}

function resolveUrl(base, pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return base + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

async function isRealApk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!res.ok) return false;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const len = Number(res.headers.get('content-length') || 0);
    const looksApk =
      ct.includes('vnd.android.package-archive') ||
      ct.includes('application/octet-stream') ||
      url.toLowerCase().endsWith('.apk');
    return looksApk && len > 50_000;
  } catch {
    return false;
  }
}

async function fetchVersionManifest(base) {
  try {
    const res = await fetch(`${base}/version.json`, { redirect: 'follow' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function apkFromManifest(base, manifest) {
  const apk = manifest?.apk;
  if (!apk) return null;

  if (apk.ready === false) return null;

  const url = resolveUrl(base, apk.url || apk.downloadUrl);
  if (!url) return null;

  return {
    version: apk.version || manifest.version || null,
    versionCode: apk.versionCode ?? manifest.versionCode ?? null,
    downloadUrl: url,
    downloadName: apk.downloadName || `${manifest.name || manifest.app || 'app'}.apk`,
    fileSize: apk.fileSize ?? null,
    sha256: apk.sha256 ?? null,
    releaseNotes: apk.releaseNotes || manifest.releaseNotes || null,
    packageId: apk.packageId ?? null,
    archives: Array.isArray(apk.archives)
      ? apk.archives.map((entry) => ({
          label: entry.label,
          version: entry.version,
          versionCode: entry.versionCode ?? null,
          downloadUrl: resolveUrl(base, entry.url),
          downloadName: entry.downloadName,
          fileSize: entry.fileSize ?? null,
          sha256: entry.sha256 ?? null,
          releaseNotes: entry.releaseNotes ?? null,
        }))
      : [],
  };
}

async function probeCandidates(base, slug) {
  const names = [
    slug,
    slug.replace(/-/g, ''),
    slug.replace(/verse$/, 'verse'),
  ];
  const paths = new Set();
  for (const name of names) {
    paths.add(`/${name}.apk`);
    paths.add(`/${name}-release.apk`);
  }
  paths.add('/app-release.apk');
  paths.add('/release.apk');
  paths.add('/latest.apk');
  paths.add('/download.apk');

  for (const path of paths) {
    const url = base + path;
    if (await isRealApk(url)) {
      return {
        version: null,
        versionCode: null,
        downloadUrl: url,
        downloadName: path.split('/').pop(),
        fileSize: null,
        sha256: null,
        releaseNotes: null,
        packageId: null,
        archives: [],
      };
    }
  }
  return null;
}

async function discoverApp(app) {
  const base = normalizeBase(app.url);
  const manifest = await fetchVersionManifest(base);
  let android = manifest ? apkFromManifest(base, manifest) : null;

  if (android?.downloadUrl && !(await isRealApk(android.downloadUrl))) {
    android = null;
  }

  if (!android) {
    android = await probeCandidates(base, app.slug);
  }

  const webVersion = manifest?.version || manifest?.label || manifest?.versionName || null;

  return {
    slug: app.slug,
    name: app.name,
    tagline: app.tagline,
    section: app.section,
    webUrl: app.url,
    icon: `icons/apps/${app.slug}.png`,
    webVersion,
    android: android
      ? { status: 'available', ...android }
      : {
          status: 'web-only',
          version: webVersion,
          releaseNotes: 'Coming soon',
        },
  };
}

const apps = JSON.parse(await readFile(catalogPath, 'utf8'));
console.log(`\nSyncing APK catalog for ${apps.length} apps…\n`);

const results = [];
for (const app of apps) {
  process.stdout.write(`→ ${app.slug}… `);
  try {
    const entry = await discoverApp(app);
    results.push(entry);
    const label = entry.android.status === 'available' ? entry.android.version || 'apk' : entry.android.status;
    console.log(label);
  } catch (err) {
    console.log('FAIL');
    console.error(`  ${err.message}`);
    results.push({
      slug: app.slug,
      name: app.name,
      tagline: app.tagline,
      section: app.section,
      webUrl: app.url,
      icon: `icons/apps/${app.slug}.png`,
      android: { status: 'error', releaseNotes: err.message },
    });
  }
}

const catalog = {
  generatedAt: new Date().toISOString(),
  note: 'Auto-generated by scripts/sync-apk-catalog.mjs — re-run npm run update to refresh.',
  apps: results,
};

const outPaths = [join(root, 'apk-catalog.json'), join(root, 'public', 'apk-catalog.json')];
await mkdir(join(root, 'public'), { recursive: true });
for (const dest of outPaths) {
  await writeFile(dest, JSON.stringify(catalog, null, 2) + '\n');
}

const available = results.filter((a) => a.android?.status === 'available').length;
console.log(`\nWrote apk-catalog.json — ${available}/${results.length} APKs available\n`);

#!/usr/bin/env node
/**
 * Discover Android APKs for each app in My-Projects.json.
 * Reads version.json manifests, probes common APK paths on live hosts,
 * and scans linked GitHub repos (release/, android-app/, etc.).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'My-Projects.json');

const GITHUB_SCAN_DIRS = ['release', 'android-app', 'apk', 'downloads', 'dist', 'public'];

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

function parseGithubRepo(githubUrl) {
  if (!githubUrl) return null;
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== 'github.com') return null;
    const [, owner, repo] = url.pathname.split('/');
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, '') };
  } catch {
    return null;
  }
}

function parseVersionFromFilename(name) {
  const match = name.match(/v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/i);
  return match ? match[1] : null;
}

function compareVersions(a, b) {
  const pa = (a || '0').split('.').map(Number);
  const pb = (b || '0').split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
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
    source: 'live',
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

async function probeCandidates(base, slug, manifest) {
  const names = [slug, slug.replace(/-/g, ''), slug.replace(/verse$/, 'verse')];
  const paths = new Set();
  for (const name of names) {
    paths.add(`/${name}.apk`);
    paths.add(`/${name}-release.apk`);
    paths.add(`/release/${name}.apk`);
    paths.add(`/android-app/${name}.apk`);
  }
  const version = manifest?.version;
  if (version) {
    paths.add(`/${slug}-v${version}.apk`);
    paths.add(`/release/${slug}-v${version}.apk`);
  }
  paths.add('/app-release.apk');
  paths.add('/release.apk');
  paths.add('/latest.apk');
  paths.add('/download.apk');

  for (const path of paths) {
    const url = base + path;
    if (await isRealApk(url)) {
      return {
        version: parseVersionFromFilename(path) || version || null,
        versionCode: null,
        downloadUrl: url,
        downloadName: path.split('/').pop(),
        fileSize: null,
        sha256: null,
        releaseNotes: null,
        packageId: manifest?.apk?.packageId ?? null,
        source: 'probe',
        archives: [],
      };
    }
  }
  return null;
}

async function fetchGithubDefaultBranch(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return 'main';
    const data = await res.json();
    return data.default_branch || 'main';
  } catch {
    return 'main';
  }
}

async function fetchGithubApkTree(owner, repo) {
  const branch = await fetchGithubDefaultBranch(owner, repo);
  const branches = [branch, 'main', 'master'].filter((v, i, a) => a.indexOf(v) === i);

  for (const ref of branches) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const apks = (data.tree || [])
        .filter((entry) => entry.type === 'blob' && entry.path.endsWith('.apk'))
        .map((entry) => ({
          path: entry.path,
          size: entry.size ?? null,
          branch: ref,
        }));
      if (apks.length) return apks;
    } catch {
      /* try next branch */
    }
  }
  return [];
}

function rankGithubApk(path) {
  const lower = path.toLowerCase();
  let score = 0;
  if (lower.startsWith('release/')) score += 100;
  else if (lower.startsWith('android-app/')) score += 80;
  else if (lower.startsWith('apk/') || lower.startsWith('downloads/')) score += 60;
  else if (lower.includes('/')) score += 20;
  const version = parseVersionFromFilename(path.split('/').pop());
  if (version) score += compareVersions(version, '0') > 0 ? 10 : 0;
  return score;
}

function pickBestGithubApk(apks) {
  if (!apks.length) return null;
  return [...apks].sort((a, b) => {
    const versionDiff = compareVersions(
      parseVersionFromFilename(b.path.split('/').pop()),
      parseVersionFromFilename(a.path.split('/').pop())
    );
    if (versionDiff !== 0) return versionDiff;
    return rankGithubApk(b.path) - rankGithubApk(a.path);
  })[0];
}

async function discoverGithubApk(app) {
  const repoInfo = parseGithubRepo(app.github);
  if (!repoInfo) return null;

  const { owner, repo } = repoInfo;
  const apks = await fetchGithubApkTree(owner, repo);
  const best = pickBestGithubApk(apks);
  if (!best) return null;

  const downloadUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${best.branch}/${best.path}`;
  if (!(await isRealApk(downloadUrl))) return null;

  const fileName = best.path.split('/').pop();
  const version = parseVersionFromFilename(fileName);

  const archives = apks
    .filter((entry) => entry.path !== best.path)
    .sort((a, b) =>
      compareVersions(
        parseVersionFromFilename(b.path.split('/').pop()),
        parseVersionFromFilename(a.path.split('/').pop())
      )
    )
    .map((entry) => {
      const name = entry.path.split('/').pop();
      return {
        label: name.replace(/\.apk$/i, ''),
        version: parseVersionFromFilename(name),
        versionCode: null,
        downloadUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${entry.branch}/${entry.path}`,
        downloadName: name,
        fileSize: entry.size ?? null,
        sha256: null,
        releaseNotes: null,
      };
    });

  return {
    version,
    versionCode: null,
    downloadUrl,
    downloadName: fileName,
    fileSize: best.size ?? null,
    sha256: null,
    releaseNotes: version ? `Android APK from ${owner}/${repo} (v${version})` : `Android APK from ${owner}/${repo}`,
    packageId: null,
    source: 'github',
    archives,
  };
}

async function discoverApp(app) {
  const base = normalizeBase(app.url);
  const manifest = await fetchVersionManifest(base);
  let android = manifest ? apkFromManifest(base, manifest) : null;

  if (android?.downloadUrl && !(await isRealApk(android.downloadUrl))) {
    android = null;
  }

  if (!android) {
    android = await probeCandidates(base, app.slug, manifest);
  }

  if (!android && app.github) {
    android = await discoverGithubApk(app);
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
    const label =
      entry.android.status === 'available'
        ? `${entry.android.version || 'apk'}${entry.android.source ? ` (${entry.android.source})` : ''}`
        : entry.android.status;
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

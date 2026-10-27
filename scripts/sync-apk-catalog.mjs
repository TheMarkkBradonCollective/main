#!/usr/bin/env node
/**
 * Discover Android APKs for each app in My-Projects.json.
 * Reads version.json manifests, probes live hosts, and scans GitHub repos.
 * Private repos require GITHUB_TOKEN (or GH_TOKEN / gh auth token) — APKs are
 * mirrored to apks/{slug}/ on this site so downloads stay public.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'My-Projects.json');
const apkMirrorRoot = join(root, 'apks');

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

function getGithubToken() {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const githubToken = getGithubToken();

function githubHeaders(extra = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
  return headers;
}

async function isRealApk(url, headers = {}) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers });
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

async function fetchRepoMeta(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: githubHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchGithubDefaultBranch(owner, repo) {
  const meta = await fetchRepoMeta(owner, repo);
  return meta?.default_branch || 'main';
}

async function fetchGithubApkTree(owner, repo) {
  const branch = await fetchGithubDefaultBranch(owner, repo);
  const branches = [branch, 'main', 'master'].filter((v, i, a) => a.indexOf(v) === i);

  for (const ref of branches) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
        { headers: githubHeaders() }
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

async function downloadGithubApk(owner, repo, entry) {
  const encodedPath = entry.path.split('/').map(encodeURIComponent).join('/');
  const metaRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${entry.branch}`,
    { headers: githubHeaders() }
  );
  if (!metaRes.ok) {
    throw new Error(`GitHub contents API ${metaRes.status} for ${owner}/${repo}/${entry.path}`);
  }

  const meta = await metaRes.json();
  let buffer;

  if (meta.content && meta.encoding === 'base64') {
    buffer = Buffer.from(meta.content, 'base64');
  } else if (meta.download_url) {
    const dlRes = await fetch(meta.download_url, { headers: githubHeaders() });
    if (!dlRes.ok) throw new Error(`GitHub download ${dlRes.status} for ${entry.path}`);
    buffer = Buffer.from(await dlRes.arrayBuffer());
  } else {
    throw new Error(`No downloadable content for ${owner}/${repo}/${entry.path}`);
  }

  if (buffer.length < 50_000) {
    throw new Error(`APK too small (${buffer.length} bytes) for ${entry.path}`);
  }

  return buffer;
}

async function mirrorApk(slug, fileName, buffer) {
  const dir = join(apkMirrorRoot, slug);
  await mkdir(dir, { recursive: true });
  const dest = join(dir, fileName);
  await writeFile(dest, buffer);
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  return {
    downloadUrl: `apks/${slug}/${fileName}`,
    downloadName: fileName,
    fileSize: buffer.length,
    sha256,
  };
}

async function resolveGithubDownload(app, owner, repo, entry, isPrivate) {
  const fileName = entry.path.split('/').pop();
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${entry.branch}/${entry.path}`;

  if (!isPrivate && (await isRealApk(rawUrl))) {
    return {
      downloadUrl: rawUrl,
      downloadName: fileName,
      fileSize: entry.size ?? null,
      sha256: null,
    };
  }

  if (!githubToken) {
    if (isPrivate) {
      console.warn(`\n  ⚠ ${app.slug}: private repo ${owner}/${repo} — set GITHUB_TOKEN to mirror APK`);
    }
    return null;
  }

  const buffer = await downloadGithubApk(owner, repo, entry);
  const mirrored = await mirrorApk(app.slug, fileName, buffer);
  return mirrored;
}

async function discoverGithubApk(app) {
  const repoUrl = app.apkGithub || app.github;
  const repoInfo = parseGithubRepo(repoUrl);
  if (!repoInfo) return null;

  const { owner, repo } = repoInfo;
  const meta = await fetchRepoMeta(owner, repo);
  if (!meta && !githubToken) return null;
  const isPrivate = meta?.private === true || app.githubPrivate === true;

  const apks = await fetchGithubApkTree(owner, repo);
  const best = pickBestGithubApk(apks);
  if (!best) return null;

  const primary = await resolveGithubDownload(app, owner, repo, best, isPrivate);
  if (!primary) return null;

  const fileName = best.path.split('/').pop();
  const version = parseVersionFromFilename(fileName);
  const source = primary.downloadUrl.startsWith('apks/') ? 'github-mirror' : 'github';

  const archives = [];
  for (const entry of apks.filter((item) => item.path !== best.path)) {
    const name = entry.path.split('/').pop();
    const archived = await resolveGithubDownload(app, owner, repo, entry, isPrivate);
    if (!archived) continue;
    archives.push({
      label: name.replace(/\.apk$/i, ''),
      version: parseVersionFromFilename(name),
      versionCode: null,
      downloadUrl: archived.downloadUrl,
      downloadName: archived.downloadName,
      fileSize: archived.fileSize ?? entry.size ?? null,
      sha256: archived.sha256 ?? null,
      releaseNotes: null,
    });
  }

  archives.sort((a, b) => compareVersions(b.version, a.version));

  return {
    version,
    versionCode: null,
    downloadUrl: primary.downloadUrl,
    downloadName: primary.downloadName,
    fileSize: primary.fileSize ?? best.size ?? null,
    sha256: primary.sha256 ?? null,
    releaseNotes: version
      ? `Android APK from ${owner}/${repo} (v${version})`
      : `Android APK from ${owner}/${repo}`,
    packageId: null,
    source,
    archives,
  };
}

function versionCodeFromSemver(version) {
  const parts = String(version || '0').split('.').map((n) => Number.parseInt(n, 10) || 0);
  const major = parts[0] || 0;
  const minor = parts[1] || 0;
  const patch = parts[2] || 0;
  return major * 10000 + minor * 100 + patch;
}

async function discoverLocalMirror(app) {
  const dir = join(apkMirrorRoot, app.slug);
  try {
    const { readdir } = await import('node:fs/promises');
    const files = (await readdir(dir)).filter((name) => name.endsWith('.apk'));
    if (!files.length) return null;

    const ranked = files
      .map((name) => ({
        name,
        version: parseVersionFromFilename(name),
      }))
      .sort((a, b) => compareVersions(b.version, a.version));

    const best = ranked[0];
    const filePath = join(dir, best.name);
    const buffer = await readFile(filePath);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const relPath = `apks/${app.slug}/${best.name}`;

    return {
      version: best.version,
      versionCode: best.version ? versionCodeFromSemver(best.version) : null,
      downloadUrl: relPath,
      downloadName: best.name,
      fileSize: buffer.length,
      sha256,
      releaseNotes: `${app.name} v${best.version || 'apk'} — custom GPS with OpenStreetMap routing and Android Auto.`,
      packageId: app.slug === 'navigate' ? 'com.themarkkbradoncollective.navigate' : null,
      source: 'mirror',
      archives: [],
    };
  } catch {
    return null;
  }
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

  if (!android && (app.github || app.apkGithub)) {
    android = await discoverGithubApk(app);
  }

  if (!android) {
    android = await discoverLocalMirror(app);
  }

  const webVersion = manifest?.version || manifest?.label || manifest?.versionName || null;

  if (android && (app.hideArchives || app.slug === 'sss')) {
    android = { ...android, archives: [] };
    if (app.slug === 'sss') {
      android.releaseNotes =
        android.version
          ? `SSS Staff v${android.version} — main Signature Security Specialist Android app.`
          : 'SSS Staff — main Signature Security Specialist Android app.';
    }
  }

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
console.log(`\nSyncing APK catalog for ${apps.length} apps…`);
if (githubToken) {
  console.log('GitHub token found — private repos can be scanned and mirrored.\n');
} else {
  console.log('No GITHUB_TOKEN — only public repos and live deployments.\n');
}

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
  storeApp: await readStoreAppMeta(),
  apps: results,
};

async function readStoreAppMeta() {
  const storeApk = join(root, 'apks', 'mbc-store', 'MBC-Store-v1.0.0.apk');
  try {
    const buffer = await readFile(storeApk);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    return {
      packageId: 'com.themarkkbradoncollective.store',
      name: 'MBC Store',
      version: '1.0.0',
      versionCode: 100,
      downloadUrl: 'apks/mbc-store/MBC-Store-v1.0.0.apk',
      downloadName: 'MBC-Store-v1.0.0.apk',
      fileSize: buffer.length,
      sha256,
      releaseNotes:
        'MBC Store — install and update every Markk Brandon Collective Android app from one catalog.',
    };
  } catch {
    return null;
  }
}

const outPaths = [join(root, 'apk-catalog.json'), join(root, 'public', 'apk-catalog.json')];
await mkdir(join(root, 'public'), { recursive: true });
for (const dest of outPaths) {
  await writeFile(dest, JSON.stringify(catalog, null, 2) + '\n');
}

const available = results.filter((a) => a.android?.status === 'available').length;
console.log(`\nWrote apk-catalog.json — ${available}/${results.length} APKs available\n`);

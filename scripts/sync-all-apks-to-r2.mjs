#!/usr/bin/env node
/**
 * Stage newest APK per app slug, upload to mbc-store-apks, emit catalog patch JSON.
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apkRoot = join(root, 'apks');
const staging = join(root, '.r2-staging');
const CDN = 'https://pub-07d688bf950545ddba9025a723c0798e.r2.dev';

function parseVersion(name) {
  const m = name.match(/v?(\d+(?:\.\d+)*(?:\.\d+)*)|(?:beta-v?)?(\d+\.\d+\.\d+\.\d+)/i);
  if (m) return m[1] || m[2];
  const beta = name.match(/(\d+\.\d+\.\d+\.\d+)/);
  return beta ? beta[1] : null;
}

function compareVersions(a, b) {
  const pa = (a || '0').split('.').map(Number);
  const pb = (b || '0').split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

async function sha256(file) {
  const buf = await readFile(file);
  return createHash('sha256').update(buf).digest('hex');
}

async function pickBestInDir(dir) {
  if (!existsSync(dir)) return null;
  const files = (await readdir(dir)).filter((f) => f.endsWith('.apk'));
  let best = null;
  let bestVer = null;
  for (const f of files) {
    const ver = parseVersion(f);
    const full = join(dir, f);
    const info = await stat(full);
    if (!best || (ver && compareVersions(ver, bestVer) > 0) || (!bestVer && info.size > best.size)) {
      best = { file: full, name: f, version: ver, size: info.size };
      bestVer = ver;
    }
  }
  return best;
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return buf.length;
}

/** slug → { source, version, stagedName } */
const targets = [
  { slug: 'chatr', dir: 'chatr', remote: 'https://github.com/TheMarkkBradonCollective/Chatr/releases/download/v1.1.0/chatr-v1.1.0.apk', version: '1.1.0' },
  { slug: 'cookverse', dir: 'cookverse', remote: 'https://cookverse-api.themarkkbrandoncollective-2d9.workers.dev/media/apk/cookverse-v1.0.17.apk', version: '1.0.17' },
  { slug: 'dlvrd', dir: 'dlvrd', remote: 'https://pub-54c223e811894250883493507bd607d3.r2.dev/dasher-companion.apk', version: '1.0.0', versionedName: 'dlvrd-v1.0.0.apk' },
  { slug: 'navigate', dir: 'navigate' },
  { slug: 'myvenue', dir: 'myvenue' },
  { slug: 'portr', dir: 'portr', pick: 'vendr-v0.3.5.apk' },
  { slug: 'runr', dir: 'runr', pick: 'runr-v0.2.1.apk' },
  { slug: 'meusthem', dir: 'meus-them' },
  { slug: 'groupdominoscore', dir: 'groupdominoscore' },
  { slug: 'spiritsverse', dir: 'spiritsverse' },
  { slug: 'findr', dir: 'findr' },
  { slug: 'strainverse', dir: 'strainverse' },
  { slug: 'gigos', dir: 'gigos', pick: 'gigos-v1.3.4.apk' },
  { slug: 'sss', dir: 'sss', pick: 'sss-clients-v1.0.0.apk' },
  { slug: 'brandr', dir: 'brandr' },
  { slug: 'checkdeck', dir: 'checkdeck' },
  { slug: 'hangman', dir: 'hangman' },
  { slug: 'mbc-store', dir: 'mbc-store', pick: 'MBC-Store-v1.0.0.apk' },
  {
    slug: 'guardr',
    remote: 'https://github.com/TheMarkkBradonCollective/Guardr/releases/latest/download/Guardr-Client.apk',
    version: '1.0.131-beta',
    versionedName: 'guardr-v1.0.131-beta.apk',
  },
  {
    slug: 'buynothing',
    remote: `${CDN}/buynothing/latest.apk`,
    version: '0.2.0.0057',
    versionedName: 'buynothing-v0.2.0.0057.apk',
    skipIfMissing: true,
  },
  {
    slug: 'buffalofree',
    remote: `${CDN}/buffalofree/latest.apk`,
    version: '0.2.0.0053',
    versionedName: 'buffalofree-v0.2.0.0053.apk',
    skipIfMissing: true,
  },
  { slug: 'friendr', skip: true },
];

const noAndroid = [
  'youcarplay',
  'spektr',
  'line',
  'freq',
  'css',
  'layoutlab',
  'markkade',
  'stoner4therecord',
  'signature-shine',
  'fooddelivery',
  'litapp',
];

await mkdir(staging, { recursive: true });
const uploads = [];
const catalogAndroid = {};

for (const t of targets) {
  if (t.skip) {
    catalogAndroid[t.slug] = {
      status: 'available',
      note: 'Already on R2 — not re-staged',
      downloadUrl: `${CDN}/${t.slug}/latest.apk`,
    };
    continue;
  }
  const staged = join(staging, `${t.slug}.apk`);
  let version = t.version;
  let source = '';
  let size = 0;
  try {
    if (t.remote) {
      size = await download(t.remote, staged);
      source = t.remote;
    } else {
      const dir = join(apkRoot, t.dir);
      let pick = null;
      if (t.pick) {
        const p = join(dir, t.pick);
        if (existsSync(p)) pick = { file: p, name: t.pick, version: parseVersion(t.pick), size: (await stat(p)).size };
      }
      if (!pick) pick = await pickBestInDir(dir);
      if (!pick) throw new Error('no local apk');
      await copyFile(pick.file, staged);
      version = version || pick.version || '0';
      size = pick.size;
      source = pick.file;
    }
    if (!version) version = parseVersion(basename(source)) || '0';
    const versionedName = t.versionedName || `${t.slug}-v${version}.apk`;
    uploads.push({ slug: t.slug, staged, version, versionedName });
    catalogAndroid[t.slug] = {
      status: 'available',
      version,
      updatedAt: '2026-10-31',
      downloadUrl: `${CDN}/${t.slug}/latest.apk`,
      downloadName: versionedName,
      fileSize: size,
      releaseNotes: `Central R2 mirror (${source.startsWith('http') ? 'upstream' : 'local mirror'}).`,
    };
    console.log(`✓ ${t.slug} v${version} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  } catch (e) {
    if (t.skipIfMissing) {
      console.warn(`⚠ ${t.slug}: ${e.message}`);
      catalogAndroid[t.slug] = { status: 'available', downloadUrl: t.remote?.replace(/\/latest.apk$/, '/latest.apk') };
    } else {
      console.error(`✗ ${t.slug}: ${e.message}`);
      catalogAndroid[t.slug] = { status: 'error', note: e.message };
    }
  }
}

const manifest = { uploads, catalogAndroid, noAndroid, cdn: CDN, generatedAt: new Date().toISOString() };
await writeFile(join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nWrote ${uploads.length} uploads to ${join(staging, 'manifest.json')}`);

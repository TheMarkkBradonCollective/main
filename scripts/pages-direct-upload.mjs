#!/usr/bin/env node
/**
 * Stage static assets, upload to Pages (JWT), write manifest for deployment API.
 */
import { createHash } from 'node:crypto';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
function contentType(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    woff2: 'font/woff2',
    txt: 'text/plain',
    xml: 'application/xml',
    webmanifest: 'application/manifest+json',
    apk: 'application/vnd.android.package-archive',
    zip: 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
}

const ROOT = process.cwd();
const OUT = join(ROOT, '.pages-deploy');
const MANIFEST_OUT = join(ROOT, '.pages-manifest.json');
const MAX_BYTES = 25 * 1024 * 1024;
const SKIP_TOP = new Set([
  '.git',
  'node_modules',
  '.pages-deploy',
  '.pages-manifest.json',
  '.r2-staging',
  'build-repos',
  'Navigate',
  'The-Rink-Studios',
  'the-rink-studios',
  'my-happy-plate',
  'preview',
]);

const jwtPath = process.env.CF_PAGES_JWT_FILE || '/tmp/cf-pages-jwt';
const jwt = process.env.CF_PAGES_UPLOAD_JWT || readFileSync(jwtPath, 'utf8').trim();
if (!jwt) {
  console.error('Missing Pages upload JWT');
  process.exit(1);
}

const skipped = [];

function shouldSkipRel(rel) {
  const top = rel.split(/[/\\]/)[0];
  if (SKIP_TOP.has(top)) return true;
  if (rel.startsWith('apks/friendr/')) return true;
  if (rel.startsWith('apks/buffalofree/')) return true;
  if (rel.startsWith('apks/buynothing/')) return true;
  if (rel === 'download/releases/Verse-v1.zip') return true;
  return false;
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, name.name);
    const rel = relative(ROOT, srcPath);
    if (shouldSkipRel(rel)) continue;

    const destPath = join(dest, name.name);
    if (name.isDirectory()) {
      copyDir(srcPath, destPath);
      continue;
    }
    const size = statSync(srcPath).size;
    if (size > MAX_BYTES) {
      skipped.push({ rel, size });
      continue;
    }
    cpSync(srcPath, destPath);
  }
}

function hashFile(path) {
  const hash = createHash('sha256');
  hash.update(readFileSync(path));
  return hash.digest('hex');
}

async function walk(dir, fileMap = new Map(), base = dir) {
  for (const name of readdirSync(dir)) {
    const filepath = join(dir, name);
    const rel = relative(base, filepath).split(/\\/g).join('/');
    const st = statSync(filepath);
    if (st.isDirectory()) {
      await walk(filepath, fileMap, base);
    } else {
      fileMap.set(rel, {
        path: filepath,
        contentType: contentType(rel),
        sizeInBytes: st.size,
        hash: hashFile(filepath),
      });
    }
  }
  return fileMap;
}

async function api(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, init);
  const json = await res.json();
  if (!json.success) {
    throw new Error(`${init.method || 'GET'} ${path}: ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

rmSync(OUT, { recursive: true, force: true });
copyDir(ROOT, OUT);
console.log(`Staged ${OUT}; skipped ${skipped.length} file(s) > 25MB`);
for (const s of skipped) {
  console.log(`  skip ${s.rel} (${(s.size / (1024 * 1024)).toFixed(1)} MB)`);
}

const fileMap = await walk(OUT);
const files = [...fileMap.values()];
console.log(`Uploading ${files.length} asset(s)...`);

const missing = await api('/pages/assets/check-missing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  },
  body: JSON.stringify({ hashes: files.map((f) => f.hash) }),
});

const toUpload = files.filter((f) => missing.includes(f.hash));
console.log(`${toUpload.length} new hash(es) to upload`);

const CONCURRENCY = 3;
let done = 0;
async function uploadOne(file) {
  const body = JSON.stringify([
    {
      key: file.hash,
      value: readFileSync(file.path).toString('base64'),
      metadata: { contentType: file.contentType },
      base64: true,
    },
  ]);
  await api('/pages/assets/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body,
  });
  done += 1;
  if (done % 25 === 0 || done === toUpload.length) {
    console.log(`  uploaded ${done}/${toUpload.length}`);
  }
}

for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
  await Promise.all(toUpload.slice(i, i + CONCURRENCY).map(uploadOne));
}

const manifest = Object.fromEntries(
  [...fileMap.entries()].map(([path, f]) => [path, f.hash])
);
writeFileSync(MANIFEST_OUT, JSON.stringify(manifest));
console.log(`Wrote ${MANIFEST_OUT} (${Object.keys(manifest).length} entries)`);

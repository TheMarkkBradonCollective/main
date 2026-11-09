#!/usr/bin/env node
/**
 * Copy the static site into dist/ for Cloudflare Pages and Workers assets.
 *
 * Cloudflare Pages only serves manifest keys that start with "/".
 * Publishing the repo root (pages_build_output_dir = ".") also uploads
 * wrangler.toml and previously shipped a slash-less manifest that 404s.
 * This directory is the site itself: index.html, apk-catalog.json, and the store UI.
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'dist');
const MAX_BYTES = 25 * 1024 * 1024;
const SKIP_TOP = new Set([
  '.git',
  'node_modules',
  'dist',
  '.pages-deploy',
  '.wrangler',
  'secrets',
  '.r2-staging',
  'play-scaffolds',
]);
const SKIP_FILES = new Set([
  'wrangler.toml',
  '.env',
  '.dev.vars',
  '.pages-manifest.json',
]);
const REQUIRED = [
  'index.html',
  'apk-catalog.json',
  'css/app-store.css',
  'js/app-store.js',
  '_redirects',
  '_headers',
];

function loadAssetIgnore() {
  let text = '';
  try {
    text = readFileSync(join(ROOT, '.assetsignore'), 'utf8');
  } catch {
    return [];
  }
  const patterns = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line === '*' || line === '**' || line === '/*' || line === '/**' || line === '**/*' || line === '/') {
      throw new Error(`.assetsignore pattern "${line}" would exclude the whole site and Pages would 404`);
    }
    patterns.push(line.replace(/^\.\//, ''));
  }
  return patterns;
}

function ignoredByAssets(rel, patterns) {
  for (const pattern of patterns) {
    if (pattern.endsWith('/')) {
      const dir = pattern.slice(0, -1);
      if (rel === dir || rel.startsWith(`${dir}/`)) return true;
    } else if (rel === pattern) {
      return true;
    }
  }
  return false;
}

function shouldSkip(rel, patterns) {
  if (!rel) return false;
  const top = rel.split('/')[0];
  if (SKIP_TOP.has(top)) return true;
  const base = rel.split('/').pop();
  if (SKIP_FILES.has(base)) return true;
  if (base.endsWith('.keystore') || base === '.env.local') return true;
  return ignoredByAssets(rel, patterns);
}

const patterns = loadAssetIgnore();
const skipped = [];

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, name.name);
    const rel = relative(ROOT, srcPath).split('\\').join('/');
    if (shouldSkip(rel, patterns)) continue;
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

rmSync(OUT, { recursive: true, force: true });
copyDir(ROOT, OUT);

// Keep the same ignore list inside the asset directory so Wrangler
// does not upload paths this script already skipped.
writeFileSync(join(OUT, '.assetsignore'), readFileSync(join(ROOT, '.assetsignore')));

const missing = REQUIRED.filter((rel) => {
  try {
    return !statSync(join(OUT, rel)).isFile();
  } catch {
    return true;
  }
});
if (missing.length) {
  console.error(`Pages output is missing required files: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`Staged ${OUT}`);
console.log(`Skipped ${skipped.length} file(s) over 25 MiB`);
for (const file of skipped) {
  console.log(`  skip ${file.rel} (${(file.size / (1024 * 1024)).toFixed(1)} MiB)`);
}
console.log('Output includes index.html, apk-catalog.json, css/app-store.css, and js/app-store.js');

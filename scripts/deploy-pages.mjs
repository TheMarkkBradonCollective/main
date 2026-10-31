#!/usr/bin/env node
/**
 * Stage a Cloudflare Pages deploy directory, skipping files over 25 MB.
 */
import { cpSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT = join(ROOT, '.pages-deploy');
const MAX_BYTES = 25 * 1024 * 1024;
const SKIP_TOP = new Set([
  '.git',
  'node_modules',
  '.pages-deploy',
  'Navigate',
  'The-Rink-Studios',
  'the-rink-studios',
  'my-happy-plate',
  'preview',
]);

let skipped = [];

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, name.name);
    const rel = relative(ROOT, srcPath);
    const top = rel.split(/[/\\]/)[0];
    if (SKIP_TOP.has(top)) continue;

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

console.log(`Staged ${OUT} (skipped ${skipped.length} file(s) over 25 MB)`);
for (const s of skipped) {
  console.log(`  skip ${s.rel} (${(s.size / (1024 * 1024)).toFixed(1)} MB)`);
}

execSync(`npx wrangler pages deploy "${OUT}" --project-name=mbc-store --commit-dirty=true`, {
  stdio: 'inherit',
  cwd: ROOT,
});

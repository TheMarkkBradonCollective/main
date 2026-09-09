#!/usr/bin/env node
/**
 * Drop this into any MBC Capacitor app repo as scripts/build-aab.mjs
 *
 * package.json:
 *   "build:aab": "node scripts/build-aab.mjs"
 *
 * Requires env (or defaults for local dev):
 *   MBC_UPLOAD_KEYSTORE_PASSWORD
 *   MBC_UPLOAD_KEY_PASSWORD
 *   ANDROID_KEYSTORE_PATH  (optional — defaults to ../secrets/mbc-upload.keystore)
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const keystorePath =
  process.env.ANDROID_KEYSTORE_PATH ||
  path.join(root, '..', 'secrets', 'mbc-upload.keystore');
const storePassword = process.env.MBC_UPLOAD_KEYSTORE_PASSWORD || 'mbc-upload-2026';
const keyPassword = process.env.MBC_UPLOAD_KEY_PASSWORD || storePassword;
const keyAlias = process.env.ANDROID_KEY_ALIAS || 'mbc-upload';

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  if (existsSync(path.join(root, 'vite.config.js')) || existsSync(path.join(root, 'vite.config.ts'))) {
    run('npm', ['run', 'build']);
  }
  if (!existsSync(androidDir)) run('npx', ['cap', 'add', 'android']);
  run('npx', ['cap', 'sync', 'android']);

  const props = [
    `storeFile=${path.relative(androidDir, keystorePath).replace(/\\/g, '/')}`,
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    '',
  ].join('\n');
  await fs.writeFile(path.join(androidDir, 'keystore.properties'), props);

  const gradlew = path.join(androidDir, 'gradlew');
  run(gradlew, ['bundleRelease'], androidDir);

  const aab = path.join(androidDir, 'app/build/outputs/bundle/release/app-release.aab');
  if (!existsSync(aab)) {
    console.error('AAB not found after build');
    process.exit(1);
  }

  const outDir = path.join(root, 'release');
  mkdirSync(outDir, { recursive: true });
  const outName = `${pkg.name || 'app'}-v${pkg.version || '1.0.0'}.aab`;
  const dest = path.join(outDir, outName);
  cpSync(aab, dest);
  console.log(`\nAAB: ${dest}\n`);
}

main();

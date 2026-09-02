#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';

const versionJson = {
  name: 'Navigate',
  version,
  updatedAt: new Date().toISOString(),
  pwa: true,
  apk: {
    ready: false,
    packageId: 'com.themarkkbradoncollective.navigate',
    name: 'Navigate',
    themeColor: '#0d1b2a',
    backgroundColor: '#0d1b2a',
    icon: '/icon-512.png',
  },
};

await writeFile(join(root, 'public/version.json'), JSON.stringify(versionJson, null, 2) + '\n');
console.log(`Updated public/version.json → v${version}`);

#!/usr/bin/env node
/**
 * MBC /update
 * Regenerates PWA icons, refreshes version.json and Android TWA metadata,
 * and bumps the service-worker cache so web + installable APK stay aligned.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pkgPath = resolve(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const SITE_HOMEPAGE = 'https://themarkkbradoncollective.github.io/main/';
const SITE_REPOSITORY = 'https://github.com/TheMarkkBradonCollective/main';

const version = pkg.version || '1.1.0';
const now = new Date().toISOString();
const cacheToken = `mbc-v${version.replace(/\./g, '-')}`;

console.log(`\nMBC /update — v${version}\n`);

// 0) Showcase app icons (best-effort — needs network)
console.log('→ Syncing showcase app icons…');
const appIcons = spawnSync(process.execPath, [resolve(root, 'scripts/sync-app-icons.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (appIcons.status !== 0) {
  console.warn('⚠ App icon sync skipped or partial (network / missing sources).');
}

console.log('→ Syncing APK catalog…');
const apkCatalog = spawnSync(process.execPath, [resolve(root, 'scripts/sync-apk-catalog.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (apkCatalog.status !== 0) {
  console.warn('⚠ APK catalog sync skipped or partial (network / missing sources).');
}

// 1) PWA icons (skip gracefully if sharp isn't installed and icons already exist)
console.log('→ Regenerating PWA icons…');
const icons = spawnSync(process.execPath, [resolve(root, 'scripts/generate-icons.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (icons.status !== 0) {
  const existing = [
    resolve(root, 'icons/icon-192.png'),
    resolve(root, 'icons/icon-512.png'),
  ].every((p) => existsSync(p));
  if (!existing) {
    console.error('Icon generation failed and no existing icons found.');
    process.exit(icons.status ?? 1);
  }
  console.warn('⚠ Icon generation skipped (missing deps). Using existing icons.');
}

// 2) Keep js/version.js in sync with package.json
writeFileSync(
  resolve(root, 'js/version.js'),
  `/** App version shown on loading splash and update tooling. */\n` +
    `export const APP_VERSION = '${version}';\n` +
    `export const APP_NAME = 'The Markk Brandon Collective';\n` +
    `export const APP_SHORT = 'MBC';\n\n` +
    `export function formatAppVersion(prefix = 'v') {\n` +
    `  return \`\${prefix}\${APP_VERSION}\`;\n` +
    `}\n`
);
console.log('→ Synced js/version.js');

// 3) Public version stamp (loading screen / SW checks)
const versionPayload = {
  name: 'The Markk Brandon Collective',
  shortName: 'MBC',
  version,
  updatedAt: now,
  pwa: true,
  sql: null,
  homepage: SITE_HOMEPAGE,
  repository: SITE_REPOSITORY,
  note: 'Grey NYC broadsheet newspaper site. Canonical host is GitHub Pages at /main/.',
  apk: {
    packageId: 'com.themarkkbradoncollective.mbc',
    name: 'The Markk Brandon Collective',
    themeColor: '#121212',
    backgroundColor: '#f7f7f5',
    icon: '/icons/icon-512.png',
  },
};
mkdirSync(resolve(root, 'public'), { recursive: true });
writeFileSync(resolve(root, 'version.json'), JSON.stringify(versionPayload, null, 2) + '\n');
writeFileSync(resolve(root, 'public/version.json'), JSON.stringify(versionPayload, null, 2) + '\n');
console.log('→ Wrote version.json');

// 4) Bump service worker cache name so installs pick up the new build
const swPath = resolve(root, 'sw.js');
if (existsSync(swPath)) {
  let sw = readFileSync(swPath, 'utf-8');
  sw = sw.replace(/const CACHE_NAME = ['"][^'"]+['"]/, `const CACHE_NAME = '${cacheToken}'`);
  writeFileSync(swPath, sw);
  console.log(`→ Bumped sw.js CACHE_NAME to ${cacheToken}`);
}

// 5) Android TWA / Bubblewrap manifest (APK readiness)
const androidDir = resolve(root, 'android');
mkdirSync(androidDir, { recursive: true });
const twa = {
  packageId: 'com.themarkkbradoncollective.mbc',
  name: 'The Markk Brandon Collective',
  launcherName: 'MBC',
  display: 'standalone',
  themeColor: '#121212',
  navigationColor: '#121212',
  navigationColorDark: '#121212',
  backgroundColor: '#f7f7f5',
  enableNotifications: false,
  startUrl: '/main/',
  iconUrl: '../icons/icon-512.png',
  maskableIconUrl: '../icons/icon-512.png',
  splashScreenFadeOutDuration: 300,
  signingKey: {
    path: './android.keystore',
    alias: 'mbc',
  },
  appVersionName: version,
  appVersionCode: Number(String(version).replace(/\D/g, '') || '110') || 110,
  shortcuts: [],
  generatorApp: 'mbc-update',
  webManifestUrl: '/main/manifest.webmanifest',
  fallbackType: 'customtabs',
  features: {},
};
writeFileSync(resolve(androidDir, 'twa-manifest.json'), JSON.stringify(twa, null, 2) + '\n');
console.log('→ Updated android/twa-manifest.json');

// Digital Asset Links placeholder for Play / TWA verification
mkdirSync(resolve(root, '.well-known'), { recursive: true });
const assetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.themarkkbradoncollective.mbc',
      sha256_cert_fingerprints: ['REPLACE_WITH_UPLOAD_KEY_SHA256'],
    },
  },
];
writeFileSync(resolve(root, '.well-known/assetlinks.json'), JSON.stringify(assetLinks, null, 2) + '\n');
console.log('→ Refreshed .well-known/assetlinks.json');

console.log(`\n✓ Update complete — MBC v${version}`);
console.log('  Next: commit, push, and merge to main. Company app SQL lives in each app repo.\n');

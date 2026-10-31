#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'apk-catalog.json');
const manifest = JSON.parse(await readFile(join(root, '.r2-staging/manifest.json'), 'utf8'));
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const CDN = manifest.cdn;

function patchAndroid(slug, patch) {
  let app = catalog.apps.find((a) => a.slug === slug);
  if (!app) return null;
  app.android = { ...app.android, ...patch };
  return app;
}

for (const [slug, data] of Object.entries(manifest.catalogAndroid)) {
  if (data.status === 'error') continue;
  if (slug === 'friendr') continue;
  patchAndroid(slug, {
    status: 'available',
    version: data.version,
    updatedAt: data.updatedAt || '2026-10-31',
    downloadUrl: `${CDN}/${slug}/latest.apk`,
    downloadName: data.downloadName,
    fileSize: data.fileSize,
    releaseNotes: data.releaseNotes,
  });
}

patchAndroid('friendr', {
  downloadUrl: `${CDN}/friendr/latest.apk`,
});

catalog.storeApp.downloadUrl = `${CDN}/mbc-store/latest.apk`;
catalog.storeApp.releaseNotes = 'MBC Store catalog app — central R2 mirror.';

const newApps = [
  {
    slug: 'guardr',
    name: 'Guardr',
    tagline: 'Security marketplace',
    description: 'Independent security marketplace — clients, guards, and staff.',
    category: 'security',
    icon: 'icons/apps/guardr.png',
    webUrl: 'https://www.guardr.co',
    screenshots: [],
    android: manifest.catalogAndroid.guardr,
  },
  {
    slug: 'hangman',
    name: 'HangMan',
    tagline: 'Classic word game',
    description: 'HangMan word game from the Collective.',
    category: 'games',
    icon: 'icons/icon-192.png',
    webUrl: 'https://github.com/TheMarkkBradonCollective/HangMan',
    screenshots: [],
    android: manifest.catalogAndroid.hangman,
  },
  {
    slug: 'brandr',
    name: 'Brandr',
    tagline: 'Brand tools',
    description: 'Brandr app from the Collective.',
    category: 'productivity',
    icon: 'icons/icon-192.png',
    webUrl: 'https://github.com/TheMarkkBradonCollective/Brandr',
    screenshots: [],
    android: manifest.catalogAndroid.brandr,
  },
  {
    slug: 'checkdeck',
    name: 'CheckDeck',
    tagline: 'CheckDeck',
    description: 'CheckDeck from the Collective.',
    category: 'productivity',
    icon: 'icons/icon-192.png',
    webUrl: 'https://github.com/TheMarkkBradonCollective/CheckDeck',
    screenshots: [],
    android: manifest.catalogAndroid.checkdeck,
  },
  {
    slug: 'runr',
    name: 'Runr',
    tagline: 'Runr companion',
    description: 'Runr — Portr family scheduling companion.',
    category: 'productivity',
    icon: 'icons/apps/portr.png',
    webUrl: 'https://portr-web.themarkkbrandoncollective-2d9.workers.dev',
    screenshots: [],
    android: manifest.catalogAndroid.runr,
  },
];

for (const na of newApps) {
  if (!catalog.apps.some((a) => a.slug === na.slug)) {
    na.android.downloadUrl = `${CDN}/${na.slug}/latest.apk`;
    catalog.apps.push(na);
  }
}

patchAndroid('portr', {
  status: 'available',
  version: manifest.catalogAndroid.portr?.version || '0.3.5',
  downloadUrl: `${CDN}/portr/latest.apk`,
  downloadName: manifest.catalogAndroid.portr?.downloadName,
  fileSize: manifest.catalogAndroid.portr?.fileSize,
  releaseNotes: 'Portr vendr role APK on central R2.',
});

patchAndroid('meusthem', {
  status: 'available',
  version: '1.0.0',
  downloadUrl: `${CDN}/meusthem/latest.apk`,
  downloadName: 'meusthem-v1.0.0.apk',
  fileSize: manifest.catalogAndroid.meusthem?.fileSize,
});

patchAndroid('myvenue', {
  status: 'available',
  version: '1.1.0',
  downloadUrl: `${CDN}/myvenue/latest.apk`,
  downloadName: 'myvenue-v1.1.0.apk',
  fileSize: manifest.catalogAndroid.myvenue?.fileSize,
  releaseNotes: 'MyVenue v1.1.0 on central R2 (v1.2.0 in progress).',
});

catalog.generatedAt = new Date().toISOString();
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log('Updated apk-catalog.json');

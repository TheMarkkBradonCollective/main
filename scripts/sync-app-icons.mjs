#!/usr/bin/env node
/**
 * Pull each showcase app's brand icon into icons/apps/*.png
 * Prefer GitHub raw (when the repo is under TheMarkkBradonCollective),
 * otherwise fall back to the live deployment asset.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'icons', 'apps');
const SIZE = 256;

const APPS = [
  {
    slug: 'strainverse',
    name: 'StrainVerse',
    sources: [
      'https://raw.githubusercontent.com/TheMarkkBradonCollective/StrainVerse/main/public/pwa-512.png',
      'https://strainverse-tmbc.vercel.app/pwa-512.png',
    ],
  },
  {
    slug: 'spiritsverse',
    name: 'SpiritsVerse',
    sources: [
      'https://raw.githubusercontent.com/TheMarkkBradonCollective/SpiritsVerse/main/public/pwa-512.png',
      'https://spiritsverse-tmbc.vercel.app/pwa-512.png',
    ],
  },
  {
    slug: 'cookverse',
    name: 'Cookverse',
    sources: [
      'https://cookverse-tmbc.vercel.app/logo-mark.png',
      'https://cookverse-tmbc.vercel.app/logo.png',
    ],
  },
  {
    slug: 'friendr',
    name: 'Friendr',
    sources: [
      'https://friendr-tmbc.vercel.app/icons/icon-512.png',
      'https://friendr-tmbc.vercel.app/brand/mark.png',
    ],
  },
  {
    slug: 'findr',
    name: 'Findr',
    sources: [
      'https://findr-tmbc.vercel.app/logo.png',
      'https://findr-tmbc.vercel.app/icons/icon-192.png',
    ],
  },
  {
    slug: 'chatr',
    name: 'Chatr',
    sources: [
      'https://chatr-tmbc.vercel.app/icon.png',
      'https://chatr-tmbc.vercel.app/apple-touch-icon.png',
    ],
  },
  {
    slug: 'buynothing',
    name: 'Sacramento Buy Nothing',
    sources: ['https://sacramentobuynothing.com/Logo.jpeg'],
  },
  {
    slug: 'guardr',
    name: 'Guardr',
    sources: [
      'https://www.guardr.co/logo.png',
      'https://www.guardr.co/icon-512.png',
      'https://www.guardr.co/apple-touch-icon.png',
    ],
  },
  {
    slug: 'sss',
    name: 'Signature Security Specialist',
    sources: [
      'https://htakvshlkqebuyjrcxnf.supabase.co/storage/v1/object/public/Site/patch.png',
      'https://htakvshlkqebuyjrcxnf.supabase.co/storage/v1/object/public/Site/patch-bg.png',
    ],
  },
];

async function fetchFirst(urls) {
  const errors = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) {
        errors.push(`${url} → ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // Reject HTML error pages pretending to be images
      const head = buf.subarray(0, 16).toString('utf8').toLowerCase();
      if (head.includes('<!doctype') || head.includes('<html')) {
        errors.push(`${url} → HTML`);
        continue;
      }
      await sharp(buf).metadata();
      return { url, buf };
    } catch (err) {
      errors.push(`${url} → ${err.message}`);
    }
  }
  throw new Error(errors.join('; '));
}

await mkdir(outDir, { recursive: true });
console.log(`\nSyncing showcase app icons → icons/apps/ (${SIZE}²)\n`);

const manifest = [];
for (const app of APPS) {
  process.stdout.write(`→ ${app.slug}… `);
  try {
    const { url, buf } = await fetchFirst(app.sources);
    const dest = join(outDir, `${app.slug}.png`);
    await sharp(buf)
      .resize(SIZE, SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(dest);
    console.log(`ok (${url})`);
    manifest.push({ slug: app.slug, name: app.name, source: url, file: `icons/apps/${app.slug}.png` });
  } catch (err) {
    console.log(`FAIL`);
    console.error(`  ${err.message}`);
  }
}

await writeFile(join(outDir, 'sources.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nWrote ${manifest.length}/${APPS.length} icons + sources.json\n`);

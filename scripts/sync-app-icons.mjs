#!/usr/bin/env node
/**
 * Pull each showcase app's brand icon into icons/apps/*.png
 * using the live URLs in My-Projects.json (canonical project list).
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { knockOutSolidBackdrop } from './knock-out-backdrop.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'icons', 'apps');
const catalogPath = join(root, 'My-Projects.json');
const SIZE = 256;

function decodeIconBuffer(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return buf;
  }
  // Windows ICO — prefer an embedded PNG payload (256² and similar).
  if (buf.length >= 6 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    const pngAt = buf.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (pngAt >= 0) return buf.subarray(pngAt);
  }
  return buf;
}

async function fetchFirst(urls) {
  const errors = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) {
        errors.push(`${url} → ${res.status}`);
        continue;
      }
      const raw = Buffer.from(await res.arrayBuffer());
      const head = raw.subarray(0, 16).toString('utf8').toLowerCase();
      if (head.includes('<!doctype') || head.includes('<html')) {
        errors.push(`${url} → HTML`);
        continue;
      }
      const buf = decodeIconBuffer(raw);
      await sharp(buf).metadata();
      return { url, buf };
    } catch (err) {
      errors.push(`${url} → ${err.message}`);
    }
  }
  throw new Error(errors.join('; '));
}

const apps = JSON.parse(await readFile(catalogPath, 'utf8'));
await mkdir(outDir, { recursive: true });
console.log(`\nSyncing showcase app icons from My-Projects.json → icons/apps/ (${SIZE}²)\n`);

const manifest = [];
for (const app of apps) {
  process.stdout.write(`→ ${app.slug}… `);
  try {
    const { url, buf } = await fetchFirst(app.iconSources || []);
    const dest = join(outDir, `${app.slug}.png`);

    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const knocked = knockOutSolidBackdrop(data, info.width, info.height, info.channels);
    const trimmed = await sharp(knocked, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .trim({ threshold: 0 })
      .png()
      .toBuffer();

    await sharp(trimmed)
      .resize(SIZE, SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(dest);
    console.log(`ok (${url})`);
    manifest.push({
      slug: app.slug,
      name: app.name,
      projectUrl: app.url,
      source: url,
      file: `icons/apps/${app.slug}.png`,
    });
  } catch (err) {
    console.log('FAIL');
    console.error(`  ${err.message}`);
  }
}

await writeFile(join(outDir, 'sources.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nWrote ${manifest.length}/${apps.length} icons + sources.json\n`);

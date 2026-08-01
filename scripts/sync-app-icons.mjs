#!/usr/bin/env node
/**
 * Pull each showcase app's brand icon into icons/apps/*.png
 * using the live URLs in My-Projects.json (canonical project list).
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'icons', 'apps');
const catalogPath = join(root, 'My-Projects.json');
const SIZE = 256;

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

const apps = JSON.parse(await readFile(catalogPath, 'utf8'));
await mkdir(outDir, { recursive: true });
console.log(`\nSyncing showcase app icons from My-Projects.json → icons/apps/ (${SIZE}²)\n`);

const manifest = [];
for (const app of apps) {
  process.stdout.write(`→ ${app.slug}… `);
  try {
    const { url, buf } = await fetchFirst(app.iconSources || []);
    const dest = join(outDir, `${app.slug}.png`);
    await sharp(buf)
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

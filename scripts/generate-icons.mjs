import sharp from 'sharp';
import { access, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'icons');
const master = join(iconsDir, 'logo.png');

/**
 * Generates PWA / favicon sizes from the official brand logo (icons/logo.png).
 * Drop a new master at icons/logo.png (or icons/logo-master.png) then run npm run update.
 */
await mkdir(iconsDir, { recursive: true });

let source = master;
try {
  await access(master);
} catch {
  const fallback = join(iconsDir, 'logo-master.png');
  await access(fallback);
  source = fallback;
  await copyFile(fallback, master);
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

for (const { name, size } of sizes) {
  await sharp(source)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(join(iconsDir, name));
}

console.log('Generated icons from brand logo →', iconsDir);

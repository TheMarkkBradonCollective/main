import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'icons');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#121212"/>
  <rect x="48" y="48" width="416" height="416" fill="none" stroke="#f7f7f5" stroke-width="6"/>
  <line x1="48" y1="128" x2="464" y2="128" stroke="#f7f7f5" stroke-width="4"/>
  <text x="256" y="340" text-anchor="middle" fill="#f7f7f5" font-family="Georgia, 'Times New Roman', serif" font-size="220" font-weight="700">M</text>
  <text x="256" y="92" text-anchor="middle" fill="#f7f7f5" font-family="Helvetica, Arial, sans-serif" font-size="28" letter-spacing="8">THE MARKKADE</text>
</svg>`;

await mkdir(iconsDir, { recursive: true });
await writeFile(join(iconsDir, 'icon.svg'), svg);

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

for (const { name, size } of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, name));
}

console.log('Generated icons in', iconsDir);

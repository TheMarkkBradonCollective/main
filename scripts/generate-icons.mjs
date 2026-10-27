import sharp from 'sharp';
import { access, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'icons');
const master = join(iconsDir, 'logo.png');

/**
 * Generates PWA / favicon sizes from the official brand logo (icons/logo.png).
 * First refreshes transparent logo/wordmark from *-master.png when present.
 * App icons are composited onto brand black so home-screen tiles stay opaque.
 */
await mkdir(iconsDir, { recursive: true });

const processBrand = spawnSync(process.execPath, [join(root, 'scripts/process-brand-assets.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (processBrand.status !== 0) {
  console.warn('⚠ Brand asset processing skipped or failed; using existing logo.png');
}

let source = master;
try {
  await access(master);
} catch {
  const fallback = join(iconsDir, 'logo-master.png');
  await access(fallback);
  source = fallback;
  await copyFile(fallback, master);
}

const BRAND_BLACK = { r: 0, g: 0, b: 0, alpha: 255 };

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

for (const { name, size } of sizes) {
  const logo = await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_BLACK,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(join(iconsDir, name));
}

console.log('Generated icons from brand logo →', iconsDir);

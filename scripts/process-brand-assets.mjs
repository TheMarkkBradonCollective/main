#!/usr/bin/env node
/**
 * Strip solid-black backdrops from brand masters → transparent PNGs,
 * then write display sizes used on the site.
 *
 * Masters: icons/logo-master.png, icons/wordmark-master.png
 * Outputs: icons/logo.png, icons/wordmark.png
 */
import sharp from 'sharp';
import { access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'icons');

/** Pure black / anti-aliased black → alpha; keep white + brand green. */
function knockOutBlack(data, width, height, channels) {
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Brand green (forest) — keep solid, including dark greens
    const greenDominant = g >= r + 6 && g >= b + 6 && g >= 18;
    if (greenDominant) {
      out[i + 3] = 255;
      continue;
    }

    // Near-black → fully transparent
    if (max <= 6) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
      continue;
    }

    // Neutral greys / white anti-alias on black → white with luminance alpha
    const chroma = max - min;
    if (chroma <= 18) {
      const alpha = max;
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = alpha;
      continue;
    }

    // Soft green fringe (slightly tinted dark pixels)
    if (g > r && g > b && g >= 12) {
      const alpha = Math.min(255, Math.round((g / 77) * 255));
      out[i] = 27;
      out[i + 1] = 77;
      out[i + 2] = 62;
      out[i + 3] = alpha;
      continue;
    }

    // Fallback: treat as white-on-black fringe
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = max;
  }
  return out;
}

async function loadRgba(path) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function writeTransparentPng(raw, width, height, channels, dest, { trim = false, resize } = {}) {
  let pipeline = sharp(raw, { raw: { width, height, channels } }).png();
  if (trim) {
    pipeline = pipeline.trim({ threshold: 0 });
  }
  if (resize) {
    // After trim, re-read dimensions via intermediate buffer
    const buf = await pipeline.toBuffer();
    pipeline = sharp(buf).resize(resize.width, resize.height, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }
  await pipeline.png().toFile(dest);
}

async function processLogo() {
  const src = join(iconsDir, 'logo-master.png');
  await access(src);
  const { data, width, height, channels } = await loadRgba(src);
  const knocked = knockOutBlack(data, width, height, channels);

  // Keep square canvas (circle badge); don't trim — layout expects 1:1
  await sharp(knocked, { raw: { width, height, channels } })
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(join(iconsDir, 'logo.png'));

  console.log('→ icons/logo.png (transparent, 512²)');
}

async function processWordmark() {
  const src = join(iconsDir, 'wordmark-master.png');
  await access(src);
  const { data, width, height, channels } = await loadRgba(src);
  const knocked = knockOutBlack(data, width, height, channels);

  const trimmed = await sharp(knocked, { raw: { width, height, channels } })
    .trim({ threshold: 0 })
    .png()
    .toBuffer();

  await sharp(trimmed)
    .resize(980, 424, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(iconsDir, 'wordmark.png'));

  console.log('→ icons/wordmark.png (transparent, trimmed)');
}

await mkdir(iconsDir, { recursive: true });
console.log('Processing brand masters (knock out black)…');
await processLogo();
await processWordmark();
console.log('Done.');

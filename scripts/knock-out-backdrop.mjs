/**
 * Remove solid image backdrops (black, white, or uniform corner color)
 * so icons sit cleanly on the newsprint page.
 */

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}

function getPixel(data, x, y, width, channels) {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2], channels >= 4 ? data[i + 3] : 255];
}

function knockOutBlackWhite(data, width, height, channels) {
  const out = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;

      if (max <= 32 && chroma <= 20) {
        out[i + 3] = 0;
        continue;
      }
      if (min >= 240 && chroma <= 15) {
        out[i + 3] = 0;
      }
    }
  }
  return out;
}

/**
 * @param {Buffer} raw RGBA pixel buffer
 * @param {number} width
 * @param {number} height
 * @param {number} channels
 * @param {{ threshold?: number }} [options]
 */
export function knockOutSolidBackdrop(raw, width, height, channels, { threshold = 42 } = {}) {
  if (channels < 4) {
    throw new Error('knockOutSolidBackdrop expects RGBA input');
  }

  const out = Buffer.from(raw);
  const visited = new Uint8Array(width * height);

  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  const seeds = [];
  for (const [x, y] of corners) {
    const [r, g, b, a] = getPixel(out, x, y, width, channels);
    if (a < 128) continue;
    seeds.push({ x, y, r, g, b });
  }

  if (!seeds.length) return out;

  const avgR = seeds.reduce((s, p) => s + p.r, 0) / seeds.length;
  const avgG = seeds.reduce((s, p) => s + p.g, 0) / seeds.length;
  const avgB = seeds.reduce((s, p) => s + p.b, 0) / seeds.length;
  const max = Math.max(avgR, avgG, avgB);
  const min = Math.min(avgR, avgG, avgB);
  const chroma = max - min;

  const allSimilar = seeds.every((s) => colorDist(s.r, s.g, s.b, avgR, avgG, avgB) <= threshold);
  const isNeutralBackdrop = chroma <= 28 && (max <= 40 || min >= 235);
  const isDarkUniform = max <= 40 && allSimilar;
  const isLightUniform = min >= 235 && allSimilar;

  if (!isNeutralBackdrop && !isDarkUniform && !isLightUniform) {
    return knockOutBlackWhite(out, width, height, channels);
  }

  const stack = seeds.map((seed) => [seed.x, seed.y, seed.r, seed.g, seed.b]);

  while (stack.length) {
    const [x, y, sr, sg, sb] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx = y * width + x;
    if (visited[idx]) continue;

    const i = idx * channels;
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (colorDist(r, g, b, sr, sg, sb) > threshold) continue;

    visited[idx] = 1;
    out[i + 3] = 0;

    stack.push([x + 1, y, sr, sg, sb]);
    stack.push([x - 1, y, sr, sg, sb]);
    stack.push([x, y + 1, sr, sg, sb]);
    stack.push([x, y - 1, sr, sg, sb]);
  }

  return out;
}

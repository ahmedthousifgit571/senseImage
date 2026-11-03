// Renders an EO/IR "night" twin for every photo in public/media: luminance through a contrast
// curve, then a phosphor gradient map. Alpha is kept, so cutouts stay cutouts.
// Usage: node scripts/make-night.mjs
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = path.join(ROOT, 'public', 'media');
const GROUPS = ['hero', 'capabilities', 'pillars', 'fleet', 'usecases', 'case', 'solutions', 'industries'];

// Obsidian → deep teal → phosphor → near-white hot.
const STOPS = [
  [0.0, [2, 6, 12]],
  [0.22, [5, 22, 32]],
  [0.46, [11, 70, 80]],
  [0.68, [18, 168, 156]],
  [0.86, [110, 240, 220]],
  [1.0, [236, 255, 250]],
];

// CAD renders are a dark airframe on light studio grey. A straight map turns the backdrop into a loud teal
// slab, so they use "white-hot" thermal polarity instead: the airframe glows on a cold background.
const WHITE_HOT = new Set(['capabilities']);

function lutFor(whiteHot = false) {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    // Gentle S-curve so skies stay dark and hot edges glow.
    const x = whiteHot ? Math.pow(1 - i / 255, 0.85) : i / 255;
    const t = x * x * (3 - 2 * x) * 0.7 + x * 0.3;
    let k = 0;
    while (k < STOPS.length - 2 && t > STOPS[k + 1][0]) k++;
    const [p0, c0] = STOPS[k];
    const [p1, c1] = STOPS[k + 1];
    const f = Math.min(1, Math.max(0, (t - p0) / (p1 - p0)));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(c0[c] + (c1[c] - c0[c]) * f);
  }
  return lut;
}

async function nightOf(file, LUT) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const l = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    out[i] = LUT[l * 3];
    out[i + 1] = LUT[l * 3 + 1];
    out[i + 2] = LUT[l * 3 + 2];
    out[i + 3] = data[i + 3];
  }
  const target = file.replace(/\.webp$/, '.night.webp');
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toFile(target);
  return target;
}

for (const group of GROUPS) {
  const LUT = lutFor(WHITE_HOT.has(group));
  const dir = path.join(MEDIA, group);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.webp') && !f.endsWith('.night.webp'));
  for (const f of files) {
    const target = await nightOf(path.join(dir, f), LUT);
    console.log('night', path.relative(MEDIA, target));
  }
}

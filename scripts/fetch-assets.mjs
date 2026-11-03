// Downloads SenseImage's own imagery from senseimage.in and converts it to webp under public/media.
// Raw downloads are cached in scripts/.cache/raw so re-running only re-encodes.
// Usage: node scripts/fetch-assets.mjs [--force]
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'scripts', '.cache', 'raw');
const OUT = path.join(ROOT, 'public', 'media');
const BASE = 'https://www.senseimage.in';
const IK = '/indrakavach/senseimage-web/assets/images/';
const IK_SEG = (stamp) => `${IK}IK_Body_Segment_(Assembly)_2026-Jul-20_${stamp}_png.png`;

// [group, slug, path on senseimage.in, max width]
const MANIFEST = [
  ['hero', 'scene', '/figma/a18993a8a19aff0fee7173bb8c939cbf2bfc54fe.png', 2400],
  ['hero', 'ik-flight', '/figma/3edefc91de1bd9216cb3c564760bb9d6a3da351c.png', 2400],
  ['hero', 'ik-guidance', `${IK}img-guidance.png`, 2000],

  ['capabilities', 'interception', IK_SEG('10-07-25AM-000_CustomizedView2330641154'), 1800],
  ['capabilities', 'navigation', IK_SEG('10-08-17AM-000_CustomizedView50061009667'), 1800],
  ['capabilities', 'targeting', IK_SEG('10-08-42AM-000_CustomizedView1090044994'), 1800],
  ['capabilities', 'eo-ir', IK_SEG('10-09-23AM-000_CustomizedView19049734017'), 1800],
  ['capabilities', 'swarm', IK_SEG('10-09-38AM-000_CustomizedView2848037777'), 1800],
  ['capabilities', 'payload', IK_SEG('10-11-17AM-000_CustomizedView8800923068'), 1800],
  ['capabilities', 'deployment', IK_SEG('11-06-42AM-000_CustomizedView20931140385'), 1800],

  ['pillars', 'border', '/figma/fp-indrakavach.png', 1200],
  ['pillars', 'gis', '/figma/32f261b47474b57c27c256bdfaa03758d03f1260.png', 1600],
  ['pillars', 'powerline', '/figma/home-power line inspection at scale.png', 1600],
  ['pillars', 'cuav', '/figma/home- counter uav field demonstration.png', 1600],

  ['fleet', 'card-indrakavach', '/figma/fp-indrakavach.png', 1200],
  ['fleet', 'card-a6', '/figma/fp-skycopter-a6plus.png', 1200],
  ['fleet', 'card-x6', '/figma/fp-skycopter-x6.png', 1200],
  ['fleet', 'card-falcon', '/figma/fp-falcon-a6.png', 1200],
  ['fleet', 'card-skyhunter', '/figma/fp-skyhunter-vtol.png', 1200],
  ['fleet', 'a6', '/products-page/skycopter-a6/assets/A6_header_bg.png', 1600],
  ['fleet', 'a6-hero', '/products-page/skycopter-a6/assets/hero-bg.png', 2000],
  ['fleet', 'x6', '/products-page/skycopter-x6/assets/x6gen.png', 2000],
  ['fleet', 'falcon', '/products-page/falcon-a6/assets/falcon-a6-product.png', 1600],
  ['fleet', 'skyhunter', '/products-page/skyhunter-vtol/assets/skyhunter-vtol-plane.png', 1600],
  ['fleet', 'skyhunter-carousel', '/products-page/skyhunter-vtol/assets/skyhunter-vtol-carousel.png', 2000],

  ['usecases', 'powerline', '/products-page/skycopter-a6/assets/a6_use_powerline.jpg', 1400],
  ['usecases', 'thermal', '/products-page/skycopter-a6/assets/a6_use_thermal.jpg', 1400],
  ['usecases', 'lidar', '/products-page/skycopter-a6/assets/a6_use_lidar.jpg', 1400],
  ['usecases', 'pipeline', '/products-page/skycopter-a6/assets/a6_use_pipeline.jpg', 1400],
  ['usecases', 'cargo', '/products-page/skycopter-a6/assets/a6_use_cargo.jpg', 1400],
  ['usecases', 'disaster', '/products-page/skycopter-a6/assets/a6_use_disaster.jpg', 1400],

  ['case', 'powerline-towers', '/figma/69c192fc6629d6bce0757a046e4a23534fd160a5.png', 2400],
  ['solutions', 'defence-ops', '/figma/d66591fd62c1a9fa1d37a80fd1f84019759cd02a.png', 1600],
  ['solutions', 'swarm', '/figma/8e80f45a0c06486771c729ef0ad0ccaa02d8c1ae.png', 1600],

  ['industries', 'defence', '/figma/home-defence & security.png', 1600],
  ['industries', 'energy', '/figma/002ef770e048a2cf3fd0f57bdeb4143eeb7d6bca.png', 1600],
  ['industries', 'mining', '/figma/e49f633fed36d09a89b071183f44a4d7967043e0.png', 1600],
  ['industries', 'oil-gas', '/figma/4bb7e574e95fcccf6a48d444d845110dc3f137b4.png', 1600],
  ['industries', 'gis', '/figma/32f261b47474b57c27c256bdfaa03758d03f1260.png', 1600],
  ['industries', 'surveillance', '/figma/fb64d32b918eddb98dcc0b4194006fac207985b2.png', 1600],

  ['clients', 'kec', '/figma/de1e79b985dbfbfa932a559a533bb68838b6c2d8.png', 600],
  ['clients', 'keltron', '/figma/ddd9c73db4181e028e16fda84895c7ef1a409ff5.png', 600],
  ['clients', 'lt', '/figma/8e1bbb5d2355b56c5cdcc9a3a53e7570f45387f5.png', 600],
  ['clients', 'tata-power', '/figma/809bf87e9716a7b76f77a7358520133f26c23753.png', 600],
  ['clients', 'kalpataru', '/figma/c82f074ed8af306de46c38df3f6f8ce888623c0d.png', 600],

  ['recognitions', 'r1', '/figma/83011aab827c702827c78801b197420986b2b802.png', 600],
  ['recognitions', 'r2', '/figma/f2868b47c182493bded8042e3a3e952d8aa8c1ed.png', 600],
  ['recognitions', 'r3', '/figma/bafc6b085a21885c2579b34033e4b2b91c02a1df.png', 600],
  ['recognitions', 'r4', '/figma/4bfed8d0e4c55b8f635c7d41f1812c917851091d.png', 600],
  ['recognitions', 'r5', '/figma/0adf11641259adf6bcdbc4915a21c04c64d1bb3b.png', 600],
  ['recognitions', 'r6', '/figma/42dd84bab74cccdad9c32c75ce627c399bc8198b.png', 600],

  ['certs', 'c1', '/assets/images/c1.png', 400],
  ['certs', 'c2', '/assets/images/c2.png', 400],
  ['certs', 'c3', '/assets/images/c3.png', 400],
  ['certs', 'c4', '/assets/images/c4.png', 400],
  ['certs', 'dgca-type-certified', '/products-page/skycopter-a6/assets/DGCA-typecertified-transparent.png', 400],

  ['brand', 'logo', '/assets/images/SenseImage-Logo.png', 800],
];

const force = process.argv.includes('--force');
const exists = (p) => access(p).then(() => true, () => false);

async function download(url, file) {
  if (!force && (await exists(file))) return;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (asset sync)' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`not an image (${type}) ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

await mkdir(RAW, { recursive: true });
const failures = [];
for (const [group, slug, src, maxWidth] of MANIFEST) {
  const url = BASE + encodeURI(src).replace(/&/g, '%26');
  const raw = path.join(RAW, `${group}--${slug}${path.extname(src)}`);
  const out = path.join(OUT, group, `${slug}.webp`);
  try {
    await download(url, raw);
    await mkdir(path.dirname(out), { recursive: true });
    // Client logos ship with uneven transparent padding; trim it so they sit at one optical size.
    const source = group === 'clients' ? await sharp(raw).trim().toBuffer() : raw;
    const info = await sharp(source)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 90, effort: 5 })
      .toFile(out);
    console.log(`ok  ${group}/${slug}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
  } catch (err) {
    failures.push(`${group}/${slug}: ${err.message}`);
    console.error(`ERR ${group}/${slug}: ${err.message}`);
  }
}
if (failures.length) {
  console.error(`\n${failures.length} failed`);
  process.exitCode = 1;
}

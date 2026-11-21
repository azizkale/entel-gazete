/**
 * Tasarımdaki sabit site görsellerini public/img/ altına çıkarır (bir kez çalıştırılır,
 * çıktılar depoya eklenir): ENTEL logosu, Risale Okulu logosu, kâğıt zemin ve
 * 1200×630 varsayılan paylaşım görseli (og-default.jpg).
 *
 *   node scripts/extract-design-assets.ts
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { readDesign, readSiteAssets } from './design-data.ts';

const out = new URL('../public/img/', import.meta.url);
mkdirSync(out, { recursive: true });
const p = (name: string) => new URL(name, out).pathname;

const { html } = readDesign();
const { logo, footer, paper } = readSiteAssets(html);

await sharp(logo).webp({ quality: 90 }).toFile(p('entel-logo.webp'));
await sharp(footer).webp({ quality: 90, alphaQuality: 100 }).toFile(p('risale-okulu.webp'));
await sharp(paper).webp({ quality: 75 }).toFile(p('paper.webp'));

// Varsayılan paylaşım görseli: kâğıt zemin + ortada logo, çift çizgi.
const W = 1200, H = 630;
const logoW = 760;
const logoBuf = await sharp(logo).resize({ width: logoW }).toBuffer();
const logoMeta = await sharp(logoBuf).metadata();
const lh = logoMeta.height ?? 385;
const top = Math.round((H - lh) / 2);
const rules = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="60" y="${top - 40}" width="${W - 120}" height="8" fill="#3D3D3B"/>
    <rect x="60" y="${top - 26}" width="${W - 120}" height="3" fill="#3D3D3B"/>
    <rect x="60" y="${top + lh + 23}" width="${W - 120}" height="8" fill="#3D3D3B"/>
    <rect x="60" y="${top + lh + 37}" width="${W - 120}" height="3" fill="#3D3D3B"/>
  </svg>`,
);
await sharp(paper)
  .resize(W, H, { fit: 'cover' })
  .composite([
    { input: rules, top: 0, left: 0 },
    { input: logoBuf, top, left: Math.round((W - logoW) / 2) },
  ])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(p('og-default.jpg'));

console.log('public/img/ güncellendi: entel-logo.webp, risale-okulu.webp, paper.webp, og-default.jpg');

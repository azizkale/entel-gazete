/**
 * Örnek veri yükleyici — YALNIZCA EMÜLATÖR.
 *
 * Tasarımın içindeki örnek veriyi (Sayı 52 ve Sayı 55: yazılar, lügatler, duyurular,
 * karikatürler, görseller) Firebase Emulator Suite'e aktarır. Gömülü base64 görseller
 * dosyaya çıkarılır, panelin yapacağı gibi WebP'ye çevrilir (1600 px ve 480 px) ve
 * Storage emülatörüne yüklenir.
 *
 *   npm run emulators      # ayrı bir terminalde
 *   npm run seed
 *
 * Mevcut emülatör verisi önce silinir.
 */
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { BodyBlock, Category, Comment, ImageRef, Issue, Post, Cartoon, Author } from '../src/app/core/models/content.ts';
import { CATEGORIES } from '../src/app/core/models/content.ts';
import {
  buildGlossary,
  buildIssueCover,
  buildMetaIndex,
  buildPostSummary,
  readMinutes,
  slugify,
} from '../src/app/core/content-utils.ts';
import { readDesign, parseTrDate, type DesignBlock, type DesignIssue } from './design-data.ts';

const PROJECT_ID = 'demo-entel';
const BUCKET = `${PROJECT_ID}.firebasestorage.app`;
const HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const STORAGE_PORT = 9199;

// Güvenlik: admin SDK'yı her zaman emülatöre yönlendir; gerçek projeye asla yazma.
process.env.FIRESTORE_EMULATOR_HOST = `${HOST}:${FIRESTORE_PORT}`;
process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${HOST}:${STORAGE_PORT}`;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${HOST}:9099`;
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.METADATA_SERVER_DETECTION = 'none';

const { initializeApp } = await import('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = await import('firebase-admin/firestore');
const { getStorage } = await import('firebase-admin/storage');

const app = initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET });
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

/* ---------- yardımcılar ---------- */

async function ensureEmulators(): Promise<void> {
  try {
    const r = await fetch(`http://${HOST}:${FIRESTORE_PORT}/`);
    if (!r.ok) throw new Error();
  } catch {
    console.error('Firestore emülatörüne ulaşılamadı. Önce ayrı bir terminalde: npm run emulators');
    process.exit(1);
  }
}

async function clearAll(): Promise<void> {
  await fetch(`http://${HOST}:${FIRESTORE_PORT}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
    method: 'DELETE',
  });
  try {
    await bucket.deleteFiles({ force: true });
  } catch {
    /* boş kova */
  }
}

const storageUrl = (path: string) =>
  `http://${HOST}:${STORAGE_PORT}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

/**
 * Panelin tarayıcıda yapacağı işlemin aynısı: WebP (kalite 0,8), büyük ≤1600 px ve
 * küçük ≤480 px; dosya adında içerik özeti; uzun süreli önbellek başlığı.
 */
async function uploadImage(folder: string, base: string, input: Buffer): Promise<ImageRef> {
  const large = await sharp(input).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  const small = await sharp(input).rotate().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 }).toBuffer();
  const hash = createHash('sha256').update(large.data).digest('hex').slice(0, 10);
  const path = `${folder}/${base}-${hash}.webp`;
  const thumbPath = `${folder}/${base}-${hash}-480.webp`;
  const metadata = { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' };
  await bucket.file(path).save(large.data, { metadata, resumable: false });
  await bucket.file(thumbPath).save(small, { metadata, resumable: false });
  return { path, url: storageUrl(path), thumbUrl: storageUrl(thumbPath), w: large.info.width, h: large.info.height };
}

function toBlocks(body: DesignBlock[]): BodyBlock[] {
  return body.map((b): BodyBlock => {
    switch (b.k) {
      case 'list':
        return { type: 'list', items: b.items ?? [] };
      case 'poem': {
        const block: BodyBlock = { type: 'poem', lines: b.lines ?? [] };
        if (b.acro) block.acro = true;
        if (b.em) block.em = true;
        return block;
      }
      default:
        return { type: b.k, text: b.t ?? '' };
    }
  });
}

function asCategory(c: string): Category {
  if (!(CATEGORIES as readonly string[]).includes(c)) throw new Error(`Bilinmeyen kategori: ${c}`);
  return c as Category;
}

/* ---------- aktarım ---------- */

await ensureEmulators();
console.log('Emülatör verisi temizleniyor…');
await clearAll();

const { issues: designIssues, images } = readDesign();
const ordered: DesignIssue[] = [...designIssues].sort((a, b) => b.no - a.no); // yeniden eskiye

const authors = new Map<string, Author & { id: string }>();
const allPosts: (Post & { id: string })[] = [];
const allIssues: Issue[] = [];
const cartoons: (Cartoon & { id: string })[] = [];

for (const di of ordered) {
  const at = Timestamp.fromDate(parseTrDate(di.date));
  console.log(`Sayı ${di.no} (${di.date}) — ${di.posts.length} yazı`);

  const posts: (Post & { id: string })[] = [];
  for (const [order, dp] of di.posts.entries()) {
    const id = dp.id;
    const authorIds = dp.authors.map((name) => {
      const aid = slugify(name);
      if (!authors.has(aid)) authors.set(aid, { id: aid, name, slug: aid, postCount: 0 });
      authors.get(aid)!.postCount++;
      return aid;
    });
    const imgName = dp.img?.[0];
    const imgBuf = imgName ? images[imgName] : undefined;
    if (imgName && !imgBuf) console.warn(`  ! Görsel bulunamadı: ${imgName}`);
    const hero = imgBuf ? await uploadImage(`posts/${id}`, 'hero', imgBuf) : null;
    const body = toBlocks(dp.body);
    const post: Post & { id: string } = {
      id,
      slug: id, // tasarımdaki kimlikler zaten slug
      issueNo: di.no,
      order,
      title: dp.title,
      category: asCategory(dp.cat),
      authorIds,
      authorNames: dp.authors,
      guest: dp.guest ?? null,
      note: dp.note ?? null,
      pages: dp.pages,
      tags: dp.tags,
      hero,
      body,
      readMinutes: readMinutes(body),
      status: 'published',
      publishedAt: at,
    };
    posts.push(post);
  }

  const cartoonId = `sayi-${di.no}`;
  const cartoonBuf = images[di.cartoon];
  let cartoon: (Cartoon & { id: string }) | null = null;
  if (cartoonBuf) {
    cartoon = {
      id: cartoonId,
      issueNo: di.no,
      // Tasarımda karikatür başlığı yok; panelden düzeltilecek.
      title: `Sayı ${di.no} karikatürü`,
      image: await uploadImage(`cartoons/${cartoonId}`, 'karikatur', cartoonBuf),
      relatedPostId: null,
      publishedAt: at,
    };
    cartoons.push(cartoon);
  }

  const coverPost = posts.find((p) => p.category === 'Editörden') ?? posts[0];
  const issue: Issue = {
    no: di.no,
    date: { text: di.date, at },
    quote: di.quote,
    status: 'published',
    pdf: null,
    coverPostId: coverPost.id,
    cartoonId: cartoon?.id ?? null,
    glossary: di.glossary.map(([word, def]) => ({ word, def })),
    ads: di.ads.map(([title, text]) => ({ title, text })),
    posts: posts.map((p) => buildPostSummary(p.id, p)),
    cover: buildIssueCover(coverPost.id, coverPost),
    cartoon: cartoon ? { id: cartoon.id, title: cartoon.title, image: cartoon.image } : null,
    publishedAt: at,
  };
  allIssues.push(issue);
  allPosts.push(...posts);
}

console.log('Firestore\'a yazılıyor…');
const writer = db.bulkWriter();
for (const p of allPosts) {
  const { id, ...data } = p;
  writer.set(db.doc(`posts/${id}`), data);
}
for (const a of authors.values()) {
  const { id, ...data } = a;
  writer.set(db.doc(`authors/${id}`), data);
}
for (const c of cartoons) {
  const { id, ...data } = c;
  writer.set(db.doc(`cartoons/${id}`), data);
}
for (const is of allIssues) writer.set(db.doc(`issues/${is.no}`), is);

const index = buildMetaIndex(allIssues, allPosts, [...authors.values()], CATEGORIES);
writer.set(db.doc('meta/index'), { ...index, updatedAt: FieldValue.serverTimestamp() });
writer.set(db.doc('meta/glossary'), { entries: buildGlossary(allIssues), updatedAt: FieldValue.serverTimestamp() });
writer.set(db.doc('meta/site'), { latestIssueNo: allIssues[0].no });

// Örnek yorumlar: biri onaylı, biri onay bekliyor (6. aşamadaki onay akışını denemek için).
const samplePost = allPosts.find((p) => p.category === 'Mikrofon') ?? allPosts[0];
const comments: Omit<Comment, 'createdAt'>[] = [
  { postId: samplePost.id, uid: 'ornek-okur-1', name: 'Örnek Okur', photoURL: null, text: 'Çok güzel bir söyleşi olmuş, emeğinize sağlık.', status: 'approved' },
  { postId: samplePost.id, uid: 'ornek-okur-2', name: 'İkinci Okur', photoURL: null, text: 'Bu yorum onay bekliyor; okurlar göremez.', status: 'pending' },
];
for (const c of comments) writer.create(db.collection('comments').doc(), { ...c, createdAt: FieldValue.serverTimestamp() });

await writer.close();

console.log(
  `Tamam: ${allIssues.length} sayı, ${allPosts.length} yazı, ${authors.size} yazar, ${cartoons.length} karikatür, ` +
    `${index.tags.length} etiket, sözlükte ${buildGlossary(allIssues).length} kelime.`,
);
console.log('Emülatör arayüzü: http://127.0.0.1:4000');
process.exit(0);

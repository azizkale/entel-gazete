/**
 * Firestore veri modeli (prompt bölüm 5).
 *
 * Bu dosya yalnızca tip içerir; hem Angular uygulaması hem de Node betikleri
 * (seed, yönetici ekleme) tarafından `import type` ile kullanılır.
 * Tarih alanları `TimestampLike` olarak tanımlıdır: istemcide `firebase/firestore`
 * Timestamp'i, betiklerde `firebase-admin` Timestamp'i gelir.
 */

export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export type PublishStatus = 'draft' | 'published';

/** Sabit kategoriler (prompt 3. bölüm "Yazarlar ve Konular"). Sıra menüdeki sıradır. */
export const CATEGORIES = ['Editörden', 'Deneme', 'Mikrofon', 'Arşivden', 'Şiir', 'Bir Kavram'] as const;
export type Category = (typeof CATEGORIES)[number];

/** "Yazarın diğer yazıları" listesinin gösterilmediği kurum imzaları. */
export const HOUSE_SIGNATURES = ['Editör', 'ENTEL'] as const;

/** Storage'daki bir görsel: büyük (≤1600 px) ve küçük (≤480 px) WebP. */
export interface ImageRef {
  /** Büyük görselin Storage yolu, ör. `posts/abc/hero-1a2b3c4d.webp` */
  path: string;
  url: string;
  thumbUrl: string;
  /** Büyük görselin piksel boyutları (oran için küçükte de kullanılır). */
  w: number;
  h: number;
}

/** Kartlarda kullanılan küçük görsel. */
export interface ThumbRef {
  url: string;
  w: number;
  h: number;
}

/* ---------- Yazı gövdesi blokları (5.2) ---------- */

/** `p`: paragraf (`**kalın**` desteklenir), `lead`: kalın giriş, `q`: röportaj sorusu,
 *  `i`: italik girintili paragraf, `pull`: ortalanmış çizgili alıntı. */
export interface TextBlock {
  type: 'p' | 'lead' | 'q' | 'i' | 'pull';
  text: string;
}
export interface ListBlock {
  type: 'list';
  items: string[];
}
/** Tek bir kıta. Ardışık `poem` blokları arasında kıta boşluğu bırakılır. */
export interface PoemBlock {
  type: 'poem';
  lines: string[];
  /** Akrostiş: dizelerin ilk harfleri kalın. */
  acro?: boolean;
  /** Son dize vurgulu. */
  em?: boolean;
}
export interface ImageBlock {
  type: 'image';
  image: ImageRef;
  caption?: string;
  alt: string;
}
export type BodyBlock = TextBlock | ListBlock | PoemBlock | ImageBlock;
export type BodyBlockType = BodyBlock['type'];

/* ---------- Koleksiyonlar (5.1) ---------- */

export interface GlossaryEntry {
  word: string;
  def: string;
}

export interface AdEntry {
  title: string;
  text: string;
}

/** `issues/{no}.posts[]` — ana sayfanın tek okumayla açılması için denormalize özet. */
export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  category: Category;
  authorNames: string[];
  guest: string | null;
  excerpt: string;
  thumb: ThumbRef | null;
  /** Görseli olmayan şiir kartında görselin yerine gösterilecek ilk dizeler. */
  verse: string[] | null;
  pages: string;
}

/** Manşet için editör yazısından alınan kısım. */
export interface IssueCover {
  postId: string;
  slug: string;
  title: string;
  hero: ImageRef | null;
  /** Manşette üç sütunda gösterilen ilk paragraflar (düz metin, `**` işaretleri korunur). */
  intro: string[];
}

export interface IssueCartoon {
  id: string;
  title: string;
  image: ImageRef;
}

/** `issues/{no}` — belge kimliği sayı numarası (ör. "56"). */
export interface Issue {
  no: number;
  date: { text: string; at: TimestampLike };
  quote: string;
  status: PublishStatus;
  pdf: { path: string; url: string } | null;
  coverPostId: string | null;
  cartoonId: string | null;
  glossary: GlossaryEntry[];
  ads: AdEntry[];
  /** Sayı içindeki sırasıyla yazı özetleri (editör yazısı dahil, ilk sırada). */
  posts: PostSummary[];
  /** Yayınlama anında doldurulur. */
  cover: IssueCover | null;
  /** Yayınlama anında doldurulur. */
  cartoon: IssueCartoon | null;
  publishedAt: TimestampLike | null;
}

/** `posts/{id}` */
export interface Post {
  slug: string;
  issueNo: number;
  order: number;
  title: string;
  category: Category;
  authorIds: string[];
  authorNames: string[];
  guest: string | null;
  note: string | null;
  pages: string;
  tags: string[];
  hero: ImageRef | null;
  body: BodyBlock[];
  readMinutes: number;
  status: PublishStatus;
  publishedAt: TimestampLike | null;
}

/** `authors/{id}` */
export interface Author {
  name: string;
  slug: string;
  postCount: number;
}

/** `cartoons/{id}` */
export interface Cartoon {
  issueNo: number;
  title: string;
  image: ImageRef;
  relatedPostId: string | null;
  publishedAt: TimestampLike | null;
}

/** Bulmaca ipucu. `row`/`col` 0 tabanlı. */
export interface PuzzleClue {
  num: number;
  clue: string;
  row: number;
  col: number;
  length: number;
}

/** `puzzles/{no}` — herkese açık kısım. Cevap harfleri burada YOKTUR. */
export interface Puzzle {
  width: number;
  height: number;
  /** Satır satır maske: `1` beyaz kare, `0` siyah kare. Ör. ["1101", "1111"]. */
  mask: string[];
  /** Kare numaraları: `{ r, c, n }` listesi. */
  numbers: { r: number; c: number; n: number }[];
  across: PuzzleClue[];
  down: PuzzleClue[];
  solutionPublic: boolean;
}

/** `puzzles/{no}/private/solution` — yalnızca `solutionPublic == true` olunca okunur. */
export interface PuzzleSolution {
  /** Satır satır harfler; siyah kareler `#`. */
  grid: string[];
}

export type CommentStatus = 'pending' | 'approved' | 'rejected';

/** `comments/{id}` */
export interface Comment {
  postId: string;
  uid: string;
  name: string;
  photoURL: string | null;
  /** En fazla 1500 karakter. */
  text: string;
  status: CommentStatus;
  createdAt: TimestampLike;
}

/* ---------- meta ---------- */

/** `meta/glossary` — bütün sayıların lügatleri birleşik. Uygulama açılışında bir kez okunur. */
export interface MetaGlossary {
  entries: GlossaryEntry[];
  updatedAt: TimestampLike;
}

export interface IndexCount {
  slug: string;
  name: string;
  count: number;
}

export interface IndexAuthor extends IndexCount {
  /** `authors/{id}` kimliği; konuklarda `null`. */
  id: string | null;
  role: 'author' | 'guest';
}

/** Arşiv ve "Önceki sayılar" bloğu için sayı özeti. */
export interface IndexIssue {
  no: number;
  date: string;
  coverTitle: string;
  coverSlug: string;
  coverThumb: ThumbRef | null;
  posts: { slug: string; title: string; authorName: string }[];
  hasPdf: boolean;
}

/** `meta/index` — yayınlama anında yeniden hesaplanır; sayfa açılışında hesaplama yapılmaz. */
export interface MetaIndex {
  /** Yayımlanmış sayılar, yeniden eskiye. */
  issues: IndexIssue[];
  authors: IndexAuthor[];
  categories: IndexCount[];
  tags: IndexCount[];
  updatedAt: TimestampLike;
}

/** `meta/site` */
export interface MetaSite {
  latestIssueNo: number;
}

/** `admins/{uid}` */
export interface AdminRecord {
  email: string;
  name?: string;
  addedAt?: TimestampLike;
}

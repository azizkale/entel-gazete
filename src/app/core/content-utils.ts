/**
 * Saf yardımcı fonksiyonlar: slug, özet, okuma süresi ve yayınlama anında
 * üretilen denormalize veriler (sayı özetleri, meta/index, meta/glossary).
 *
 * ÖNEMLİ: Bu dosya çalışma zamanında hiçbir şey import etmez (yalnızca `import type`).
 * Böylece hem Angular uygulaması (yönetim panelindeki "Yayınla") hem de Node
 * betikleri (`scripts/seed.ts`) aynı hesaplamayı kullanır.
 */
import type {
  Author,
  BodyBlock,
  GlossaryEntry,
  IndexAuthor,
  IndexCount,
  IndexIssue,
  Issue,
  IssueCover,
  Post,
  PostSummary,
} from './models/content';

const TR_MAP: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
};

/** Türkçe karakterleri sadeleştirerek URL'ye uygun slug üretir: "Şekvadan Şükre" → "sekvadan-sukre". */
export function slugify(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[çğıiöşüâîû]/g, (c) => TR_MAP[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’‘`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Türkçe sıralama karşılaştırıcısı. */
export const trCompare = (a: string, b: string): number => a.localeCompare(b, 'tr');

const stripMarks = (t: string): string => t.replace(/\*\*/g, '');

/** Kart özeti: ilk `p`/`lead` bloğundan, kelime sınırında kesilmiş (tasarımdaki `excerpt`). */
export function makeExcerpt(body: BodyBlock[], max = 170): string {
  const textBlock = body.find(
    (b): b is Extract<BodyBlock, { text: string }> => (b.type === 'p' || b.type === 'lead') && 'text' in b,
  );
  let text = '';
  if (textBlock) {
    text = textBlock.text;
  } else {
    const poem = body.find((b) => b.type === 'poem');
    if (poem && poem.type === 'poem') text = poem.lines.slice(0, 2).join(' / ');
    else {
      const any = body.find((b) => 'text' in b);
      if (any && 'text' in any) text = any.text;
    }
  }
  text = stripMarks(text).trim();
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max);
  return text.slice(0, cut > 0 ? cut : max) + '…';
}

/** Tahmini okuma süresi (dakika), dakikada 200 kelime. */
export function readMinutes(body: BodyBlock[]): number {
  let words = 0;
  for (const b of body) {
    const parts =
      b.type === 'list' ? b.items : b.type === 'poem' ? b.lines : b.type === 'image' ? [b.caption ?? ''] : [b.text];
    for (const p of parts) words += p.split(/\s+/).filter(Boolean).length;
  }
  return Math.max(1, Math.round(words / 200));
}

/** Görseli olmayan şiir kartı için ilk üç dize. */
function verseFor(post: Pick<Post, 'body' | 'hero'>): string[] | null {
  if (post.hero) return null;
  const poem = post.body.find((b) => b.type === 'poem');
  if (poem && poem.type === 'poem') return poem.lines.slice(0, 3);
  return [makeExcerpt(post.body, 120)];
}

export function buildPostSummary(id: string, post: Post): PostSummary {
  return {
    id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    authorNames: post.authorNames,
    guest: post.guest,
    excerpt: makeExcerpt(post.body),
    thumb: post.hero ? { url: post.hero.thumbUrl, w: post.hero.w, h: post.hero.h } : null,
    verse: verseFor(post),
    pages: post.pages,
  };
}

/** Manşet: editör yazısının başlığı, görseli ve ilk iki metin paragrafı. */
export function buildIssueCover(id: string, post: Post): IssueCover {
  const intro = post.body
    .filter((b): b is Extract<BodyBlock, { text: string }> => b.type === 'p' || b.type === 'lead')
    .slice(0, 2)
    .map((b) => b.text);
  return { postId: id, slug: post.slug, title: post.title, hero: post.hero, intro };
}

/**
 * Bütün sayıların lügatlerini tek sözlükte birleştirir (yeniden eskiye; aynı kelime
 * birden çok sayıda varsa en yeni tanım kalır). Kelimeye göre Türkçe sıralanır.
 */
export function buildGlossary(issuesNewestFirst: Pick<Issue, 'glossary'>[]): GlossaryEntry[] {
  const seen = new Map<string, GlossaryEntry>();
  for (const is of issuesNewestFirst) {
    for (const g of is.glossary) {
      const key = g.word.toLocaleLowerCase('tr');
      if (!seen.has(key)) seen.set(key, { word: g.word, def: g.def });
    }
  }
  return [...seen.values()].sort((a, b) => trCompare(a.word, b.word));
}

type PostWithId = Post & { id: string };

function countBy(names: string[]): IndexCount[] {
  const m = new Map<string, number>();
  for (const n of names) m.set(n, (m.get(n) ?? 0) + 1);
  return [...m.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => trCompare(a.name, b.name));
}

/**
 * `meta/index` içeriğini hesaplar. Yalnızca yayımlanmış sayı ve yazılar verilmelidir.
 * Kategoriler sabit listedeki sırayla, yazar ve etiketler Türkçe alfabetik döner.
 */
export function buildMetaIndex(
  issuesNewestFirst: Issue[],
  posts: PostWithId[],
  authors: (Author & { id: string })[],
  categoryOrder: readonly string[],
): { issues: IndexIssue[]; authors: IndexAuthor[]; categories: IndexCount[]; tags: IndexCount[] } {
  const issues: IndexIssue[] = issuesNewestFirst.map((is) => {
    const cover = is.cover;
    const rest = is.posts.filter((p) => p.id !== is.coverPostId);
    return {
      no: is.no,
      date: is.date.text,
      coverTitle: cover?.title ?? is.posts[0]?.title ?? '',
      coverSlug: cover?.slug ?? is.posts[0]?.slug ?? '',
      coverThumb: cover?.hero ? { url: cover.hero.thumbUrl, w: cover.hero.w, h: cover.hero.h } : null,
      posts: rest.map((p) => ({ slug: p.slug, title: p.title, authorName: p.guest ?? p.authorNames[0] ?? '' })),
      hasPdf: !!is.pdf,
    };
  });

  const authorCounts = new Map<string, number>();
  for (const p of posts) for (const id of p.authorIds) authorCounts.set(id, (authorCounts.get(id) ?? 0) + 1);
  const indexAuthors: IndexAuthor[] = authors
    .filter((a) => (authorCounts.get(a.id) ?? 0) > 0)
    .map((a) => ({ id: a.id, slug: a.slug, name: a.name, count: authorCounts.get(a.id) ?? 0, role: 'author' as const }));
  const authorNames = new Set(indexAuthors.map((a) => a.name.toLocaleLowerCase('tr')));
  for (const g of countBy(posts.map((p) => p.guest).filter((g): g is string => !!g))) {
    if (!authorNames.has(g.name.toLocaleLowerCase('tr'))) indexAuthors.push({ ...g, id: null, role: 'guest' });
  }
  indexAuthors.sort((a, b) => trCompare(a.name, b.name));

  const catCounts = countBy(posts.map((p) => p.category));
  const categories = categoryOrder
    .map((c) => catCounts.find((x) => x.name === c))
    .filter((x): x is IndexCount => !!x);

  const tags = countBy(posts.flatMap((p) => p.tags));
  return { issues, authors: indexAuthors, categories, tags };
}

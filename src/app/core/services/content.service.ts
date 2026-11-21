import { FIRESTORE } from '../firebase';
import { Injectable, inject, signal } from '@angular/core';
// Firestore örneği core/firebase.ts'ten (FIRESTORE) gelir.
// Okur sayfalarında yalnızca tek seferlik okuma (getDoc/getDocs) — onSnapshot YOK.
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import type { Issue, MetaGlossary, MetaIndex, MetaSite, Post } from '../models/content';

export type WithId<T> = T & { id: string };

/**
 * Okur tarafı veri erişimi. Okuma sayısını düşük tutmak için:
 * - ana sayfa: en yeni sayının tek belgesi,
 * - yazı sayfası: tek belge,
 * - meta/index ve meta/glossary: uygulama açılışında bir kez, bellekte tutulur.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly db = inject(FIRESTORE);

  private indexPromise?: Promise<MetaIndex | null>;
  private glossaryPromise?: Promise<MetaGlossary | null>;
  private readonly issueCache = new Map<number, Promise<WithId<Issue> | null>>();
  private readonly postCache = new Map<string, Promise<WithId<Post> | null>>();

  /** Birleşik sözlük; yüklenince dolar. */
  readonly glossary = signal<MetaGlossary | null>(null);
  /** Yazar/etiket/kategori sayıları ve arşiv. */
  readonly index = signal<MetaIndex | null>(null);

  /** En yeni yayımlanmış sayı — tek okuma. */
  async getLatestIssue(): Promise<WithId<Issue> | null> {
    const q = query(
      collection(this.db, 'issues'),
      where('status', '==', 'published'),
      orderBy('no', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    const d = snap.docs[0];
    if (!d) return null;
    const issue = { id: d.id, ...(d.data() as Issue) };
    this.issueCache.set(issue.no, Promise.resolve(issue));
    return issue;
  }

  getIssue(no: number): Promise<WithId<Issue> | null> {
    let p = this.issueCache.get(no);
    if (!p) {
      p = getDoc(doc(this.db, 'issues', String(no))).then((s) =>
        s.exists() ? { id: s.id, ...(s.data() as Issue) } : null,
      );
      this.issueCache.set(no, p);
    }
    return p;
  }

  /** Yazı sayfası — slug ile tek okuma. */
  getPostBySlug(slug: string): Promise<WithId<Post> | null> {
    let p = this.postCache.get(slug);
    if (!p) {
      const q = query(
        collection(this.db, 'posts'),
        where('slug', '==', slug),
        where('status', '==', 'published'),
        limit(1),
      );
      p = getDocs(q).then((snap) => {
        const d = snap.docs[0];
        return d ? { id: d.id, ...(d.data() as Post) } : null;
      });
      this.postCache.set(slug, p);
    }
    return p;
  }

  async getSite(): Promise<MetaSite | null> {
    const s = await getDoc(doc(this.db, 'meta', 'site'));
    return s.exists() ? (s.data() as MetaSite) : null;
  }

  /** meta/index — oturum başına bir kez okunur. */
  loadIndex(): Promise<MetaIndex | null> {
    this.indexPromise ??= getDoc(doc(this.db, 'meta', 'index')).then((s) => {
      const v = s.exists() ? (s.data() as MetaIndex) : null;
      this.index.set(v);
      return v;
    });
    return this.indexPromise;
  }

  /** meta/glossary — uygulama açılışında bir kez okunur ve önbelleğe alınır. */
  loadGlossary(): Promise<MetaGlossary | null> {
    this.glossaryPromise ??= getDoc(doc(this.db, 'meta', 'glossary')).then((s) => {
      const v = s.exists() ? (s.data() as MetaGlossary) : null;
      this.glossary.set(v);
      return v;
    });
    return this.glossaryPromise;
  }
}

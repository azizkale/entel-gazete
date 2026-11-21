// Firestore güvenlik kuralı testleri — emülatörde çalışır: `npm run test:rules`
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-entel-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'admins/editor'), { email: 'editor@example.com' });
    await setDoc(doc(db, 'issues/55'), { no: 55, status: 'published' });
    await setDoc(doc(db, 'issues/56'), { no: 56, status: 'draft' });
    await setDoc(doc(db, 'posts/yayinda'), { slug: 'yayinda', status: 'published' });
    await setDoc(doc(db, 'posts/taslak'), { slug: 'taslak', status: 'draft' });
    await setDoc(doc(db, 'authors/a1'), { name: 'Yazar', slug: 'yazar', postCount: 1 });
    await setDoc(doc(db, 'cartoons/c1'), { issueNo: 55, title: 'Karikatür' });
    await setDoc(doc(db, 'meta/site'), { latestIssueNo: 55 });
    await setDoc(doc(db, 'puzzles/55'), { width: 2, height: 2, solutionPublic: true });
    await setDoc(doc(db, 'puzzles/55/private/solution'), { grid: ['AB', 'CD'] });
    await setDoc(doc(db, 'puzzles/56'), { width: 2, height: 2, solutionPublic: false });
    await setDoc(doc(db, 'puzzles/56/private/solution'), { grid: ['EF', 'GH'] });
    await setDoc(doc(db, 'comments/ok'), { postId: 'yayinda', status: 'approved', uid: 'u2', text: 'güzel' });
    await setDoc(doc(db, 'comments/bekliyor'), { postId: 'yayinda', status: 'pending', uid: 'reader', text: 'x' });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const reader = () => env.authenticatedContext('reader', { name: 'Okur' }).firestore();
const admin = () => env.authenticatedContext('editor').firestore();

describe('sayılar ve yazılar', () => {
  it('herkes yayımlanmış sayıyı ve yazıyı okuyabilir', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'issues/55')));
    await assertSucceeds(getDoc(doc(anon(), 'posts/yayinda')));
  });

  it('taslak sayı ve yazı okunamaz', async () => {
    await assertFails(getDoc(doc(anon(), 'issues/56')));
    await assertFails(getDoc(doc(reader(), 'posts/taslak')));
  });

  it('en yeni sayı sorgusu yalnızca status filtresiyle çalışır', async () => {
    const db = anon();
    await assertSucceeds(
      getDocs(query(collection(db, 'issues'), where('status', '==', 'published'), orderBy('no', 'desc'), limit(1))),
    );
    await assertFails(getDocs(query(collection(db, 'issues'), orderBy('no', 'desc'), limit(1))));
  });

  it('slug ile yazı sorgusu status filtresiyle çalışır', async () => {
    const db = anon();
    await assertSucceeds(
      getDocs(query(collection(db, 'posts'), where('slug', '==', 'yayinda'), where('status', '==', 'published'))),
    );
    await assertFails(getDocs(query(collection(db, 'posts'), where('slug', '==', 'taslak'))));
  });

  it('okur yazamaz, yönetici yazabilir ve taslağı okuyabilir', async () => {
    await assertFails(setDoc(doc(reader(), 'posts/yeni'), { status: 'published' }));
    await assertFails(updateDoc(doc(anon(), 'issues/55'), { quote: 'x' }));
    await assertSucceeds(setDoc(doc(admin(), 'posts/yeni'), { status: 'draft' }));
    await assertSucceeds(getDoc(doc(admin(), 'issues/56')));
    await assertSucceeds(deleteDoc(doc(admin(), 'posts/taslak')));
  });
});

describe('herkese açık belgeler', () => {
  it('yazar, karikatür ve meta okunur ama yazılamaz', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'authors/a1')));
    await assertSucceeds(getDoc(doc(anon(), 'cartoons/c1')));
    await assertSucceeds(getDoc(doc(anon(), 'meta/site')));
    await assertFails(setDoc(doc(reader(), 'meta/site'), { latestIssueNo: 99 }));
    await assertFails(setDoc(doc(reader(), 'authors/a2'), { name: 'x' }));
    await assertSucceeds(setDoc(doc(admin(), 'meta/site'), { latestIssueNo: 56 }));
  });
});

describe('yönetici listesi', () => {
  it('kullanıcı yalnızca kendi kaydını okuyabilir', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'admins/editor')));
    await assertSucceeds(getDoc(doc(reader(), 'admins/reader'))); // yok ama okuma izni var
    await assertFails(getDoc(doc(reader(), 'admins/editor')));
    await assertFails(getDoc(doc(anon(), 'admins/editor')));
    await assertFails(getDocs(collection(reader(), 'admins')));
  });

  it('okur kendini yönetici yapamaz', async () => {
    await assertFails(setDoc(doc(reader(), 'admins/reader'), { email: 'x' }));
  });
});

describe('bulmaca', () => {
  it('bulmaca belgesi herkese açık', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'puzzles/56')));
  });

  it('çözüm yalnızca solutionPublic doğruysa okunur', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'puzzles/55/private/solution')));
    await assertFails(getDoc(doc(anon(), 'puzzles/56/private/solution')));
    await assertFails(getDoc(doc(reader(), 'puzzles/56/private/solution')));
    await assertSucceeds(getDoc(doc(admin(), 'puzzles/56/private/solution')));
  });

  it('okur bulmacayı ya da çözümü değiştiremez', async () => {
    await assertFails(updateDoc(doc(reader(), 'puzzles/56'), { solutionPublic: true }));
  });
});

describe('yorumlar', () => {
  const valid = (overrides = {}) => ({
    postId: 'yayinda',
    uid: 'reader',
    name: 'Okur',
    photoURL: null,
    text: 'Çok güzel bir yazı.',
    status: 'pending',
    createdAt: serverTimestamp(),
    ...overrides,
  });

  it('okur yalnızca onaylı yorumları okur', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'comments/ok')));
    await assertFails(getDoc(doc(anon(), 'comments/bekliyor')));
    await assertFails(getDoc(doc(reader(), 'comments/bekliyor')));
    await assertSucceeds(
      getDocs(query(collection(anon(), 'comments'), where('postId', '==', 'yayinda'), where('status', '==', 'approved'))),
    );
    await assertFails(getDocs(query(collection(anon(), 'comments'), where('postId', '==', 'yayinda'))));
  });

  it('giriş yapan okur geçerli bir yorum ekleyebilir', async () => {
    await assertSucceeds(addDoc(collection(reader(), 'comments'), valid()));
  });

  it('giriş yapmamış kişi yorum ekleyemez', async () => {
    await assertFails(addDoc(collection(anon(), 'comments'), valid()));
  });

  it('yorum "pending" dışında bir durumla eklenemez', async () => {
    await assertFails(addDoc(collection(reader(), 'comments'), valid({ status: 'approved' })));
  });

  it('başkası adına yorum eklenemez', async () => {
    await assertFails(addDoc(collection(reader(), 'comments'), valid({ uid: 'baskasi' })));
  });

  it('1500 karakteri aşan veya boş yorum eklenemez', async () => {
    await assertSucceeds(addDoc(collection(reader(), 'comments'), valid({ text: 'a'.repeat(1500) })));
    await assertFails(addDoc(collection(reader(), 'comments'), valid({ text: 'a'.repeat(1501) })));
    await assertFails(addDoc(collection(reader(), 'comments'), valid({ text: '' })));
  });

  it('fazladan alan veya sahte tarih kabul edilmez', async () => {
    await assertFails(addDoc(collection(reader(), 'comments'), valid({ approvedBy: 'x' })));
    await assertFails(addDoc(collection(reader(), 'comments'), valid({ createdAt: new Date(2000, 0, 1) })));
  });

  it('okur yorumu onaylayamaz ya da silemez; yönetici yapabilir', async () => {
    await assertFails(updateDoc(doc(reader(), 'comments/bekliyor'), { status: 'approved' }));
    await assertFails(deleteDoc(doc(reader(), 'comments/bekliyor')));
    await assertSucceeds(updateDoc(doc(admin(), 'comments/bekliyor'), { status: 'approved' }));
    await assertSucceeds(deleteDoc(doc(admin(), 'comments/ok')));
  });
});

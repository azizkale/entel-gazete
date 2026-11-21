// Storage güvenlik kuralı testleri — emülatörde çalışır: `npm run test:rules`
// Storage kuralları yönetici kontrolü için Firestore'daki `admins/{uid}` belgesine bakar.
import { readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

let env;
const MB = 1024 * 1024;
const bytes = (n) => new Uint8Array(n);

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-entel-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'admins/editor'), { email: 'editor@example.com' });
    await uploadBytes(ref(ctx.storage(), 'posts/p1/hero.webp'), bytes(10), { contentType: 'image/webp' });
  });
});

after(async () => {
  await env?.cleanup();
});

const anon = () => env.unauthenticatedContext().storage();
const reader = () => env.authenticatedContext('reader').storage();
const admin = () => env.authenticatedContext('editor').storage();
const img = { contentType: 'image/webp' };
const pdf = { contentType: 'application/pdf' };

describe('storage', () => {
  it('okuma herkese açık', async () => {
    await assertSucceeds(getBytes(ref(anon(), 'posts/p1/hero.webp')));
  });

  it('okur ya da anonim kullanıcı yükleyemez', async () => {
    await assertFails(uploadBytes(ref(anon(), 'posts/p1/a.webp'), bytes(10), img));
    await assertFails(uploadBytes(ref(reader(), 'posts/p1/a.webp'), bytes(10), img));
  });

  it('yönetici görsel yükleyebilir (en fazla 5 MB, yalnızca image/*)', async () => {
    await assertSucceeds(uploadBytes(ref(admin(), 'posts/p1/b.webp'), bytes(1000), img));
    await assertSucceeds(uploadBytes(ref(admin(), 'cartoons/c1/k.webp'), bytes(1000), img));
    await assertSucceeds(uploadBytes(ref(admin(), 'site/og.jpg'), bytes(1000), { contentType: 'image/jpeg' }));
    await assertFails(uploadBytes(ref(admin(), 'posts/p1/buyuk.webp'), bytes(5 * MB + 1), img));
    await assertFails(uploadBytes(ref(admin(), 'posts/p1/x.pdf'), bytes(1000), pdf));
  });

  it('yönetici PDF yükleyebilir (en fazla 25 MB, yalnızca application/pdf)', async () => {
    await assertSucceeds(uploadBytes(ref(admin(), 'issues/56/pdf/entel-56.pdf'), bytes(6 * MB), pdf));
    await assertFails(uploadBytes(ref(admin(), 'issues/56/pdf/buyuk.pdf'), bytes(25 * MB + 1), pdf));
    await assertFails(uploadBytes(ref(admin(), 'issues/56/pdf/resim.webp'), bytes(1000), img));
  });

  it('tanımsız klasörlere kimse yazamaz', async () => {
    await assertFails(uploadBytes(ref(admin(), 'baska/x.webp'), bytes(10), img));
  });
});

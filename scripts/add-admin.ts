/**
 * Bir kullanıcıyı yönetici yapar: `admins/{uid}` belgesini oluşturur.
 * Kullanıcının önce sitede (/yonetim) Google ile bir kez giriş yapmış olması gerekir.
 *
 *   Emülatörde:  npm run add-admin -- eposta@ornek.com
 *   Canlıda:     npm run add-admin -- eposta@ornek.com --prod
 *                (önce: gcloud auth application-default login)
 */
const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith('--'));
const prod = args.includes('--prod');
if (!email) {
  console.error('Kullanım: npm run add-admin -- eposta@ornek.com [--prod]');
  process.exit(1);
}

const projectId = prod ? 'entel-gazete' : 'demo-entel';
if (!prod) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
}
process.env.GCLOUD_PROJECT = projectId;
if (!prod) process.env.METADATA_SERVER_DETECTION = 'none';

const { initializeApp, applicationDefault } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

const app = initializeApp(prod ? { projectId, credential: applicationDefault() } : { projectId });
try {
  const user = await getAuth(app).getUserByEmail(email);
  await getFirestore(app)
    .doc(`admins/${user.uid}`)
    .set({ email, name: user.displayName ?? '', addedAt: FieldValue.serverTimestamp() });
  console.log(`${email} (${user.uid}) artık yönetici. [${projectId}]`);
  process.exit(0);
} catch (e) {
  console.error(
    `Kullanıcı bulunamadı ya da yazılamadı: ${(e as Error).message}\n` +
      'Önce /yonetim sayfasından bu hesapla Google ile bir kez giriş yapın.',
  );
  process.exit(1);
}

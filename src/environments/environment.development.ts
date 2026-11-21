/**
 * Geliştirme ortamı: Firebase Emulator Suite'e bağlanır.
 * `demo-` önekli proje kimliği emülatörlerin gerçek bir projeye hiç dokunmamasını sağlar.
 */
import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  siteUrl: 'http://127.0.0.1:5000',
  useEmulators: true,
  firebase: {
    apiKey: 'demo-api-key',
    authDomain: 'demo-entel.firebaseapp.com',
    projectId: 'demo-entel',
    storageBucket: 'demo-entel.firebasestorage.app',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000',
  },
  emulators: {
    host: '127.0.0.1',
    auth: 9099,
    firestore: 8080,
    storage: 9199,
  },
};

/**
 * Canlı (production) ortam — Firebase projesi `entel-gazete`.
 * (Konsol: Proje ayarları → Genel → Web uygulamanız → SDK yapılandırması.)
 * Bu değerler gizli değildir; güvenliği Firestore/Storage kuralları sağlar.
 */
import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  siteUrl: 'https://entel-gazete.web.app',
  useEmulators: false,
  firebase: {
    apiKey: 'AIzaSyB8qRwJn84hPZPZ6BC2D3c3kUIdhS94h8o',
    authDomain: 'entel-gazete.firebaseapp.com',
    projectId: 'entel-gazete',
    storageBucket: 'entel-gazete.firebasestorage.app',
    messagingSenderId: '737432602912',
    appId: '1:737432602912:web:92eabeac2ab79e849daf45',
  },
};

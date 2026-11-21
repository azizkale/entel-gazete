import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  production: boolean;
  useEmulators: boolean;
  firebase: FirebaseOptions;
  /** Yalnızca geliştirmede: emülatör adresleri. */
  emulators?: { host: string; auth: number; firestore: number; storage: number };
  /** Paylaşım bağlantılarında kullanılan sitenin tam adresi (sonunda / yok). */
  siteUrl: string;
}

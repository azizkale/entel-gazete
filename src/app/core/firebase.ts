import { InjectionToken, inject, makeEnvironmentProviders } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

/**
 * Firestore örneği.
 *
 * Neden `@angular/fire/firestore` değil: AngularFire'ın Firestore modülü rxfire
 * üzerinden `firebase/auth`'u da okur paketine çekiyor (~40 kB gzip). Okurların
 * çoğu WhatsApp'tan telefonla geleceği için Firestore'u doğrudan SDK ile kuruyoruz;
 * uygulama (FirebaseApp) yine AngularFire'dan gelir, panelde AngularFire kullanılır.
 */
export const FIRESTORE = new InjectionToken<Firestore>('entel.firestore');

export function provideEntelFirestore() {
  return makeEnvironmentProviders([
    {
      provide: FIRESTORE,
      useFactory: () => {
        const app = inject(FirebaseApp);
        // Kalıcı yerel önbellek (IndexedDB): tekrar ziyaretlerde okumaları azaltır.
        const db = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        });
        const emu = environment.useEmulators ? environment.emulators : undefined;
        if (emu) connectFirestoreEmulator(db, emu.host, emu.firestore);
        return db;
      },
    },
  ]);
}

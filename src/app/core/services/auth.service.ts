import { FIRESTORE } from '../firebase';
import { Injectable, inject, signal } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import type { Auth, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

type AuthModule = typeof import('firebase/auth');

/**
 * Google ile giriş ve yönetici kontrolü.
 * `firebase/auth` okur paketine girmesin diye ilk ihtiyaçta dinamik olarak yüklenir
 * (yorum yazma ya da yönetim paneli).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly app = inject(FirebaseApp);
  private readonly db = inject(FIRESTORE);

  /** `undefined`: henüz bilinmiyor, `null`: giriş yok. */
  readonly user = signal<User | null | undefined>(undefined);

  private loaded?: Promise<{ auth: Auth; mod: AuthModule; ready: Promise<User | null> }>;

  private load() {
    this.loaded ??= import('firebase/auth').then((mod) => {
      const auth = mod.getAuth(this.app);
      const emu = environment.useEmulators ? environment.emulators : undefined;
      if (emu) mod.connectAuthEmulator(auth, `http://${emu.host}:${emu.auth}`, { disableWarnings: true });
      const ready = new Promise<User | null>((resolve) => {
        let first = true;
        mod.onAuthStateChanged(auth, (u) => {
          this.user.set(u);
          if (first) {
            first = false;
            resolve(u);
          }
        });
      });
      return { auth, mod, ready };
    });
    return this.loaded;
  }

  /** İlk oturum durumu belli olana kadar bekler (Auth modülünü yükler). */
  async whenReady(): Promise<User | null> {
    return (await this.load()).ready;
  }

  async signInWithGoogle(): Promise<User> {
    const { auth, mod } = await this.load();
    const cred = await mod.signInWithPopup(auth, new mod.GoogleAuthProvider());
    return cred.user;
  }

  async signOut(): Promise<void> {
    const { auth, mod } = await this.load();
    await mod.signOut(auth);
  }

  /** `admins/{uid}` belgesi varsa yöneticidir. Kurallar kullanıcının kendi belgesini okumasına izin verir. */
  async isAdmin(user?: User | null): Promise<boolean> {
    const u = user === undefined ? await this.whenReady() : user;
    if (!u) return false;
    try {
      const s = await getDoc(doc(this.db, 'admins', u.uid));
      return s.exists();
    } catch {
      return false;
    }
  }
}

import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Yönetim paneli koruması. Giriş yoksa giriş sayfasına, giriş var ama
 * `admins` listesinde değilse "Yetkiniz yok" sayfasına yönlendirir.
 */
export const adminGuard: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.whenReady();
  if (!user) return router.parseUrl('/yonetim/giris');
  return (await auth.isAdmin(user)) ? true : router.parseUrl('/yonetim/yetkisiz');
};

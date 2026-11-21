import { Routes } from '@angular/router';
import { connectStorageEmulator, getStorage, provideStorage } from '@angular/fire/storage';
import { adminGuard } from '../core/guards/admin.guard';
import { environment } from '../../environments/environment';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    // Storage yalnızca panelde gerekir (yükleme); okur tarafı görsel adreslerini belgeden alır.
    providers: [
      provideStorage(() => {
        const storage = getStorage();
        const emu = environment.useEmulators ? environment.emulators : undefined;
        if (emu) connectStorageEmulator(storage, emu.host, emu.storage);
        return storage;
      }),
    ],
    children: [
      { path: 'giris', loadComponent: () => import('./login/admin-login').then((m) => m.AdminLogin) },
      { path: 'yetkisiz', loadComponent: () => import('./unauthorized/unauthorized').then((m) => m.Unauthorized) },
      {
        path: '',
        canMatch: [adminGuard],
        loadComponent: () => import('./dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
    ],
  },
];

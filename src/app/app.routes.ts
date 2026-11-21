import { Routes } from '@angular/router';

export const routes: Routes = [
  // Yönetim paneli ayrı, lazy-loaded bir paket: okur tarafının boyutunu büyütmez.
  { path: 'yonetim', loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: '', loadChildren: () => import('./public/public.routes').then((m) => m.PUBLIC_ROUTES) },
];

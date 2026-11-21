import { Routes } from '@angular/router';

const pending = () => import('../shared/pending/pending-page').then((m) => m.PendingPage);

/** Okur sitesi adresleri (prompt bölüm 3). Hash yok; Hosting'de SPA yönlendirmesi var. */
export const PUBLIC_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./issue/issue-page').then((m) => m.IssuePage) },
  { path: 'sayi/:no', loadComponent: () => import('./issue/issue-page').then((m) => m.IssuePage) },
  { path: 'yazi/:slug', loadComponent: pending, data: { title: 'Yazı', stage: 2 } },
  { path: 'yazarlar', loadComponent: pending, data: { title: 'Yazarlar', stage: 2 } },
  { path: 'yazarlar/:slug', loadComponent: pending, data: { title: 'Yazarlar', stage: 2 } },
  { path: 'konular', loadComponent: pending, data: { title: 'Konular', stage: 2 } },
  { path: 'konular/:slug', loadComponent: pending, data: { title: 'Konular', stage: 2 } },
  { path: 'karikaturler', loadComponent: pending, data: { title: 'Karikatürler', stage: 3 } },
  { path: 'bulmaca', loadComponent: pending, data: { title: 'Bulmaca', stage: 5 } },
  { path: 'bulmaca/:no', loadComponent: pending, data: { title: 'Bulmaca', stage: 5 } },
  { path: 'sayilar', loadComponent: pending, data: { title: 'Sayılar', stage: 2 } },
  { path: '**', loadComponent: pending, data: { title: 'Sayfa bulunamadı', notFound: true } },
];

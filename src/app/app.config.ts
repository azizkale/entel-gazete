import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideEntelFirestore } from './core/firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideEntelFirestore(),
    // Auth ve Storage burada YOK: okur paketini küçük tutmak için Auth ilk ihtiyaçta
    // (yorum/panel) AuthService içinde, Storage yalnızca panel rotalarında yüklenir.
  ],
};

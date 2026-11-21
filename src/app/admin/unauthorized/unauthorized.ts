import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <h1 class="ftitle">Yetkiniz yok</h1>
      <p class="fsub">
        {{ auth.user()?.email }} hesabı yönetici listesinde değil. Erişim için genel yayın yönetmenine başvurun.
      </p>
      <p>
        <button type="button" class="more" (click)="auth.signOut()">Çıkış yap</button> ·
        <a routerLink="/">Siteye dön</a>
      </p>
    </div>
  `,
})
export class Unauthorized {
  protected readonly auth = inject(AuthService);
}

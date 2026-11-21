import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** 1. AŞAMA: panelin girişi. Bölümler 4. aşamada eklenecek. */
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <h1 class="ftitle">Yönetim paneli</h1>
      <p class="fsub">Hoş geldiniz, {{ auth.user()?.displayName ?? auth.user()?.email }}.</p>
      <p>Sayılar, Yazılar, Yazarlar, Karikatürler, Bulmaca ve Yorumlar bölümleri sonraki aşamalarda eklenecek.</p>
      <p>
        <button type="button" class="more" (click)="signOut()">Çıkış yap</button> ·
        <a routerLink="/">Siteye dön</a>
      </p>
    </div>
  `,
})
export class AdminDashboard {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}

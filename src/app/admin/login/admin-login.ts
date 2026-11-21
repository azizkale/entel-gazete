import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <h1 class="ftitle">Yönetim paneli</h1>
      <p class="fsub">Devam etmek için Google hesabınızla giriş yapın.</p>
      <button type="button" class="send" (click)="signIn()" [disabled]="busy()">Google ile giriş yap</button>
      @if (error()) {
        <p class="fsub" role="alert">{{ error() }}</p>
      }
    </div>
  `,
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  async signIn(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.signInWithGoogle();
      await this.router.navigateByUrl('/yonetim');
    } catch {
      this.error.set('Giriş yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      this.busy.set(false);
    }
  }
}

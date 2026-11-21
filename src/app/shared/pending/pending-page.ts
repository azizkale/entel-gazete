import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Geçici sayfa: henüz yapılmamış bölümler için (ilgili aşamada değiştirilecek). */
@Component({
  selector: 'app-pending-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <h1 class="ftitle">{{ title() }}</h1>
      @if (notFound()) {
        <p class="fsub">Aradığınız sayfa bulunamadı.</p>
      } @else {
        <p class="fsub">Bu sayfa {{ stage() }}. aşamada yapılacak.</p>
      }
      <p><a routerLink="/">Ana sayfaya dön →</a></p>
    </div>
  `,
})
export class PendingPage {
  readonly title = input('');
  readonly stage = input<number>(0);
  readonly notFound = input(false);
}

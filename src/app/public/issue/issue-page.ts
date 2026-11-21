import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';

/**
 * `/` ve `/sayi/:no`.
 * 1. AŞAMA: Firebase bağlantısını doğrulayan sade bir görünüm. Tasarımdaki
 * "Bu Sayı" görünümü 2. aşamada bu bileşenin yerini alacak.
 */
@Component({
  selector: 'app-issue-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      @if (issue.isLoading()) {
        <p class="fsub">Yükleniyor…</p>
      } @else if (issue.error()) {
        <p class="fsub">Veri okunamadı. Emülatörler çalışıyor mu? (<code>npm run emulators</code>)</p>
      } @else if (issue.value(); as is) {
        <p class="fsub">Bağlantı denemesi · 1. aşama</p>
        <h1 class="ftitle">Sayı {{ is.no }} · {{ is.date.text }}</h1>
        <blockquote class="stage-quote">{{ is.quote }}</blockquote>
        @if (is.cover?.hero; as hero) {
          <img [src]="hero.thumbUrl" [width]="hero.w" [height]="hero.h" alt="" class="stage-img" />
        }
        <ol class="stage-list">
          @for (p of is.posts; track p.id) {
            <li>
              <b>{{ p.title }}</b> — {{ p.category }} · {{ p.guest ?? p.authorNames.join(', ') }}
              <small>(/yazi/{{ p.slug }})</small>
            </li>
          }
        </ol>
        <p class="fsub">
          Lügat: {{ is.glossary.length }} kelime · Duyuru: {{ is.ads.length }} ·
          Birleşik sözlük: {{ content.glossary()?.entries?.length ?? '…' }} kelime ·
          Arşivdeki sayılar: {{ content.index()?.issues?.length ?? '…' }}
        </p>
        <p><a routerLink="/yonetim">Yönetim paneli →</a></p>
      } @else {
        <p class="fsub">Henüz yayımlanmış sayı yok. Örnek veriyi yüklemek için: <code>npm run seed</code></p>
      }
    </div>
  `,
  styles: `
    .stage-quote { font-family: var(--quote); font-weight: 700; font-size: 15px; margin: 0 0 16px; }
    .stage-img { max-width: 480px; width: 100%; height: auto; display: block; }
    .stage-list { padding-left: 1.2em; }
    .stage-list small { color: var(--muted); font-family: var(--ui); }
  `,
})
export class IssuePage {
  protected readonly content = inject(ContentService);
  /** Rota parametresi (`/sayi/:no`); ana sayfada boş. */
  readonly no = input<string>();

  protected readonly issue = resource({
    params: () => ({ no: this.no() }),
    loader: async ({ params }) => {
      void this.content.loadGlossary();
      void this.content.loadIndex();
      return params.no ? this.content.getIssue(Number(params.no)) : this.content.getLatestIssue();
    },
  });
}

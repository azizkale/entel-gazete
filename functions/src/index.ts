/**
 * WhatsApp/sosyal medya önizleme fonksiyonu (prompt bölüm 4).
 *
 * Hosting `/yazi/**`, `/sayi/**` ve `/karikaturler` isteklerini buraya yönlendirir.
 * 1. AŞAMA: yalnızca uygulamanın index.html'ini olduğu gibi döndürür.
 * 3. AŞAMA: ilgili belgeyi okuyup og:* etiketlerini yerleştirecek.
 */
import { onRequest } from 'firebase-functions/v2/https';

let cachedHtml: { html: string; at: number } | undefined;

async function loadIndexHtml(origin: string): Promise<string> {
  if (cachedHtml && Date.now() - cachedHtml.at < 5 * 60_000) return cachedHtml.html;
  const res = await fetch(`${origin}/index.html`);
  const html = await res.text();
  cachedHtml = { html, at: Date.now() };
  return html;
}

export const preview = onRequest(
  { region: 'europe-west1', memory: '256MiB', minInstances: 0, maxInstances: 5, concurrency: 40 },
  async (req, res) => {
    const host = req.get('x-forwarded-host') ?? req.get('host') ?? '';
    const proto = host.startsWith('127.0.0.1') || host.startsWith('localhost') ? 'http' : 'https';
    const html = await loadIndexHtml(`${proto}://${host}`);
    res.set('Cache-Control', 'public, max-age=300, s-maxage=86400');
    res.type('html').send(html);
  },
);

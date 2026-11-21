/**
 * Tasarım dosyasındaki (docs/entel-tasarim.html) gömülü örnek veriyi okur.
 * Tasarımda veri `const ISSUES=[...]` ve `const IMG={...}` olarak duruyor; görseller base64.
 */
import { readFileSync } from 'node:fs';

export interface DesignBlock {
  k: 'p' | 'lead' | 'q' | 'i' | 'pull' | 'list' | 'poem';
  t?: string;
  items?: string[];
  lines?: string[];
  acro?: boolean;
  em?: boolean;
}
export interface DesignPost {
  id: string;
  title: string;
  cat: string;
  authors: string[];
  guest?: string;
  note?: string;
  img: [string, [number, number]] | null;
  pages: string;
  tags: string[];
  body: DesignBlock[];
}
export interface DesignIssue {
  no: number;
  date: string;
  quote: string;
  posts: DesignPost[];
  glossary: [string, string][];
  cartoon: string;
  ads: [string, string][];
}

export const DESIGN_FILE = new URL('../docs/entel-tasarim.html', import.meta.url);

export function readDesign(): { html: string; issues: DesignIssue[]; images: Record<string, Buffer> } {
  const html = readFileSync(DESIGN_FILE, 'utf8');
  const a = html.indexOf('const ISSUES=');
  const b = html.indexOf('const LATEST=');
  if (a < 0 || b < 0) throw new Error('Tasarım dosyasında ISSUES/IMG verisi bulunamadı.');
  // Tasarımın kendi veri satırları (yalnızca JSON benzeri sabitler) değerlendirilir.
  const code = html.slice(a, b) + ';return {ISSUES, IMG};';
  const { ISSUES, IMG } = new Function(code)() as { ISSUES: DesignIssue[]; IMG: Record<string, string> };
  const images: Record<string, Buffer> = {};
  for (const [name, uri] of Object.entries(IMG)) images[name] = dataUriToBuffer(uri);
  return { html, issues: ISSUES, images };
}

export function dataUriToBuffer(uri: string): Buffer {
  const comma = uri.indexOf(',');
  return Buffer.from(uri.slice(comma + 1), 'base64');
}

/** Tasarımın künye/alt künye görselleri ve kâğıt zemini. */
export function readSiteAssets(html: string): { logo: Buffer; footer: Buffer; paper: Buffer } {
  const bg = html.match(/url\((data:image\/[a-z]+;base64,[^)]+)\)/);
  const imgs = [...html.matchAll(/<img src="(data:image\/[a-z]+;base64,[^"]+)"/g)].map((m) => m[1]);
  if (!bg || imgs.length < 2) throw new Error('Tasarımda logo/zemin görselleri bulunamadı.');
  return { paper: dataUriToBuffer(bg[1]), logo: dataUriToBuffer(imgs[0]), footer: dataUriToBuffer(imgs[1]) };
}

const MONTHS = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];

/** "04 Kasım 2026" → Date (UTC öğle, saat dilimi kaymasın diye). */
export function parseTrDate(text: string): Date {
  const [d, m, y] = text.trim().split(/\s+/);
  const mi = MONTHS.indexOf(m.toLocaleLowerCase('tr'));
  if (mi < 0) throw new Error(`Ay adı tanınmadı: ${text}`);
  return new Date(Date.UTC(Number(y), mi, Number(d), 12));
}

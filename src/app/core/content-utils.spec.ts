import { buildGlossary, makeExcerpt, readMinutes, slugify } from './content-utils';

describe('content-utils', () => {
  it('slugify Türkçe karakterleri sadeleştirir', () => {
    expect(slugify("Şekvadan Şükre Açılan Pencere")).toBe('sekvadan-sukre-acilan-pencere');
    expect(slugify("Nilüfer Üner Hoca İle Kur'an Okulu'na Yolculuk")).toBe(
      'nilufer-uner-hoca-ile-kuran-okuluna-yolculuk',
    );
    expect(slugify('IŞIK ve İLİM')).toBe('isik-ve-ilim');
    expect(slugify('Câmiiyet')).toBe('camiiyet');
  });

  it('makeExcerpt kelime sınırında keser ve ** işaretlerini atar', () => {
    const body = [{ type: 'p' as const, text: '**Kalın** ' + 'kelime '.repeat(60) }];
    const e = makeExcerpt(body, 50);
    expect(e.startsWith('Kalın kelime')).toBe(true);
    expect(e.endsWith('…')).toBe(true);
    expect(e.length).toBeLessThanOrEqual(51);
  });

  it('readMinutes en az 1 döner', () => {
    expect(readMinutes([{ type: 'p', text: 'kısa' }])).toBe(1);
    expect(readMinutes([{ type: 'p', text: 'a '.repeat(1000) }])).toBe(5);
  });

  it('buildGlossary en yeni tanımı tutar ve Türkçe sıralar', () => {
    const g = buildGlossary([
      { glossary: [{ word: 'şükür', def: 'yeni' }, { word: 'ülfet', def: 'x' }] },
      { glossary: [{ word: 'Şükür', def: 'eski' }, { word: 'cerbeze', def: 'y' }] },
    ]);
    expect(g.map((x) => x.word)).toEqual(['cerbeze', 'şükür', 'ülfet']);
    expect(g[1].def).toBe('yeni');
  });
});

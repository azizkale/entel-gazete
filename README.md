# Entel Gazete

Risale Okulu'nun iki haftada bir çıkan ilmî gazetesi Entel'in web sitesi ve yönetim paneli.
Angular 21 (standalone, signals, yeni control flow, lazy route'lar, strict TypeScript) +
Firebase (Hosting, Firestore, Storage, Authentication, tek bir küçük Cloud Function).

- Tasarım referansı: [`docs/entel-tasarim.html`](docs/entel-tasarim.html)
- Proje tanımı: [`docs/prompt.md`](docs/prompt.md)

> **Durum:** 1. aşama tamamlandı (iskelet, Firebase bağlantısı, emülatörler, veri modeli,
> güvenlik kuralları ve testleri, seed). Okur sayfaları 2. aşamada gelecek.

---

## İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Klasör yapısı](#klasör-yapısı)
3. [Emülatörde çalıştırma](#emülatörde-çalıştırma)
4. [Örnek veri (seed)](#örnek-veri-seed)
5. [Testler](#testler)
6. [Firebase projesi kurulumu](#firebase-projesi-kurulumu)
7. [Blaze planı ve bütçe uyarısı](#blaze-planı-ve-bütçe-uyarısı)
8. [İlk yöneticiyi ekleme](#ilk-yöneticiyi-ekleme)
9. [Önizleme ve canlı yayın](#önizleme-ve-canlı-yayın)
10. [Yeni bir sayıyı panelden yayınlama](#yeni-bir-sayıyı-panelden-yayınlama)
11. [Veri modeli özeti](#veri-modeli-özeti)

---

## Gereksinimler

- **Node.js 22.18 veya üstü** (betikler TypeScript'i doğrudan çalıştırır)
- **npm 11** (`npm i -g npm@11`; npm 10'da bir bağımlılık çözümleme hatası var)
- **Java 21** (Firebase emülatörleri için; `java -version` ile kontrol edin)
- Firebase CLI projeye dahildir (`npx firebase ...`); ayrıca kurmanız gerekmez.

```bash
npm install
```

```bash
npm --prefix functions install
```

## Klasör yapısı

```
src/app/core/        servisler, modeller (models/content.ts), guard'lar, saf yardımcılar (content-utils.ts)
src/app/public/      okur sayfaları
src/app/admin/       yönetim paneli (ayrı lazy-loaded paket)
src/app/shared/      künye, kart, etiket, blok render, lügat tooltip (2. aşama)
functions/           WhatsApp önizleme fonksiyonu
scripts/             seed, yönetici ekleme, tasarımdan görsel çıkarma
tests/rules/         Firestore ve Storage kural testleri
public/img/          logo, kâğıt zemin, varsayılan paylaşım görseli (1200×630)
```

## Emülatörde çalıştırma

Geliştirme tamamen Firebase Emulator Suite üzerinde yapılır (Auth, Firestore, Storage,
Functions, Hosting). Geliştirme ortamı `demo-entel` adlı sahte bir proje kullanır; gerçek
projeye hiçbir şey yazılmaz.

İki terminal açın:

```bash
npm run emulators
```

```bash
npm start
```

- Uygulama: http://localhost:4200
- Emülatör arayüzü (veriyi görmek/düzenlemek için): http://127.0.0.1:4000
- Hosting emülatörü (derlenmiş site + önizleme fonksiyonu): http://127.0.0.1:5000 (önce `npm run build`)

`npm run emulators` kapanırken veriyi `.emulator-data/` klasörüne kaydeder ve sonraki
açılışta geri yükler. Sıfırdan başlamak için `npm run emulators:fresh`.

> Emülatördeki Google girişi sahte bir hesap seçme penceresi açar: "Add new account" ile
> istediğiniz e-postayı yazarak giriş yaparsınız.

## Örnek veri (seed)

Tasarımın içindeki örnek veriyi (Sayı 52 ve Sayı 55: yazılar, lügatler, duyurular,
karikatürler, görseller) emülatöre aktarır. Gömülü base64 görseller dosyaya çıkarılır,
WebP'ye çevrilir (1600 px ve 480 px) ve Storage emülatörüne yüklenir. Emülatörler açıkken:

```bash
npm run seed
```

Seed önce emülatördeki mevcut veriyi siler. Gerçek projeye asla bağlanmaz.

## Testler

Güvenlik kurallarının birim testleri (emülatörü kendisi açıp kapatır):

```bash
npm run test:rules
```

Angular birim testleri:

```bash
npm test
```

## Firebase projesi kurulumu

Proje `entel-gazete` oluşturuldu ve web yapılandırması
`src/environments/environment.ts` dosyasına girildi. Konsolda yapılacaklar:

1. **Authentication** → Başlayın → Oturum açma yöntemi → **Google**'ı etkinleştirin
   (destek e-postası seçin).
   Authentication → Ayarlar → **Yetkili alan adları**: kendi alan adınız varsa ekleyin
   (`entel-gazete.web.app` ve `entel-gazete.firebaseapp.com` zaten listededir).
2. **Firestore Database** → Veritabanı oluştur → Konum: **`eur3` (Avrupa)** →
   Üretim modunda başlat (kurallarımız yüklenecek).
3. **Storage** → Başlayın → Avrupa'da bir bölge seçin. (Storage için Blaze planı gerekir, bkz. aşağısı.)
4. Bilgisayarınızda Firebase CLI ile oturum açın ve kuralları/indeksleri yükleyin:

   ```bash
   npx firebase login
   ```

   ```bash
   npx firebase deploy --project entel-gazete --only firestore,storage
   ```

## Blaze planı ve bütçe uyarısı

Cloud Functions ve (yeni projelerde) Storage, kullandıkça öde **Blaze** planını gerektirir.
Hedefimiz ücretsiz kotada kalmak; yine de sürpriz faturaya karşı bütçe uyarısı kurun:

1. Firebase konsolu → sol alttaki plan etiketi (**Spark**) → **Yükselt** → **Blaze**'i seçin ve
   bir faturalandırma hesabı bağlayın.
2. Google Cloud konsolunda **Faturalandırma → Bütçeler ve uyarılar** sayfasını açın:
   https://console.cloud.google.com/billing/budgets
3. **Bütçe oluştur**:
   - Ad: `Entel aylık`
   - Kapsam: proje **entel-gazete**, tüm hizmetler
   - Tutar: **Belirtilen tutar**, örneğin aylık **5 USD**
4. **Eşik kuralları**: %50, %90 ve %100 (gerçekleşen) ekleyin.
5. **Bildirimler**: "Faturalandırma yöneticilerine ve kullanıcılarına e-posta uyarıları gönder" kutusunu işaretleyin.
6. **Bitir**.

> Bütçe uyarısı harcamayı **durdurmaz**, yalnızca e-posta gönderir. Maliyeti düşük tutan
> tasarım kararları: okur sayfalarında gerçek zamanlı dinleyici yok, ana sayfa tek belge
> okur, sözlük ve dizin oturum başına bir kez okunur, Firestore yerel önbelleği açık,
> görseller WebP ve uzun süre önbellekli, önizleme fonksiyonu `minInstances: 0` ve CDN önbellekli.

## İlk yöneticiyi ekleme

Yönetim paneline yalnızca `admins/{uid}` belgesi olan kullanıcılar girebilir.

1. Siteyi açın, **/yonetim** adresine gidin ve yönetici olacak Google hesabıyla giriş yapın
   ("Yetkiniz yok" sayfası görünecek; bu normal).
2. Kullanıcıyı yönetici yapın — iki yol var:

   **a) Konsoldan (en kolayı):** Firebase konsolu → Authentication → Kullanıcılar →
   kullanıcının **Kullanıcı UID**'sini kopyalayın. Firestore → **Koleksiyon başlat** →
   koleksiyon kimliği `admins`, belge kimliği = kopyaladığınız UID, alan
   `email` (string) = e-posta adresi → Kaydet.

   **b) Komutla:**

   ```bash
   gcloud auth application-default login
   ```

   ```bash
   npm run add-admin -- eposta@ornek.com --prod
   ```

3. Sayfayı yenileyin; panel açılır. Sonraki yöneticileri de aynı şekilde ekleyebilirsiniz.

Emülatörde: `npm run add-admin -- eposta@ornek.com` (`--prod` olmadan).

## Önizleme ve canlı yayın

Önce bir **önizleme kanalına** yayınlayın, kontrol edin, sonra canlıya alın.

Önizleme (7 gün geçerli geçici bir adres verir; yalnızca Hosting):

```bash
npm run deploy:preview
```

Komutun çıktısında `https://entel-gazete--onizleme-xxxx.web.app` gibi bir adres görünür.
Bu alan adını Authentication → Yetkili alan adlarına eklemezseniz Google girişi orada çalışmaz.

Canlı yayın (Hosting, fonksiyon, kurallar ve indeksler):

```bash
npm run deploy:live
```

## Yeni bir sayıyı panelden yayınlama

_(Panel 4. aşamada yapılacak; adımlar o aşamada ayrıntılandırılacak.)_

1. `/yonetim` → **Sayılar** → **Yeni sayı**: numara (otomatik önerilir), tarih, künye sözü, PDF.
2. **Yazılar** → her yazı için **Yeni yazı**: PDF'ten metni kopyalayıp **Metin yapıştır**
   ile bloklara dönüştürün, görseli yükleyin, kategori/yazar/etiketleri seçin, taslak kaydedin.
3. **Karikatürler** → görseli yükleyin, başlığı yazın, sayıyı seçin.
4. **Bulmaca** → kelime ve ipuçlarını girin, **Yerleştir**, kaydedin.
5. Sayıya dönün: Lügat, Duyurular, editör yazısı, karikatür ve yazı sırasını ayarlayın.
6. **Yayınla**: sayı özeti, `meta/site`, `meta/index`, `meta/glossary` tek seferde güncellenir,
   bir önceki sayının bulmaca çözümü açılır.

## Veri modeli özeti

Ayrıntılı tipler: [`src/app/core/models/content.ts`](src/app/core/models/content.ts).

| Koleksiyon | İçerik |
|---|---|
| `issues/{no}` | Sayı: tarih, söz, durum, PDF, lügat, duyurular, **yazı özetleri** (ana sayfa yalnızca bunu okur), manşet ve karikatür özeti |
| `posts/{id}` | Yazı: slug, sayı, sıra, başlık, kategori, yazarlar, etiketler, ana görsel, **gövde blokları** (JSON) |
| `authors/{id}` | Yazar adı, slug, yazı sayısı |
| `cartoons/{id}` | Karikatür: sayı, başlık, görsel |
| `puzzles/{no}` | Bulmaca maskesi, numaralar, ipuçları (**cevapsız**) |
| `puzzles/{no}/private/solution` | Harfler — yalnızca `solutionPublic == true` olunca okunur |
| `comments/{id}` | Yorumlar (`pending` / `approved` / `rejected`) |
| `meta/glossary` | Birleşik sözlük (açılışta bir kez okunur) |
| `meta/index` | Yazar, etiket, kategori sayıları ve arşiv listesi (yayınlarken hesaplanır) |
| `meta/site` | `latestIssueNo` |
| `admins/{uid}` | Yönetici listesi |

Storage klasörleri: `issues/{no}/pdf/`, `posts/{postId}/`, `cartoons/{id}/`, `site/`.
Görseller WebP, iki boy (1600 px / 480 px), dosya adında içerik özeti ve
`Cache-Control: public, max-age=31536000, immutable`.

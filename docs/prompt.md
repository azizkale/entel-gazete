# Entel Gazete Web Sitesi — Proje Prompt'u

Sen deneyimli bir Angular ve Firebase geliştiricisisin. "Entel Gazete" için bir web sitesi ve yönetim paneli geliştireceksin. Entel Gazete, Risale Okulu'nun iki haftada bir çıkan ilmî gazetesi. Şu an yalnızca PDF olarak yayınlanıyor ve WhatsApp gruplarında dağıtılıyor. Okurların büyük çoğunluğu WhatsApp'tan gelecek, yani telefondan okuyacak.

Ekte genel yayın yönetmenimizin hazırladığı tasarım var ("ENTEL Gazete Sitesi"). Bu tasarım, görsel kimliğin ve sayfa yapısının referansı. Görünüşünü birebir koru, ama içini gerçek bir uygulamaya dönüştür: şu an bütün içerik ve görseller koda gömülü, bunun yerine içerik Firebase'den gelecek ve bir yönetim panelinden girilecek.

Çalışmaya başlamadan önce tasarımı baştan sona incele. Bir konuda emin olmadığında tahmin yürütme, bana sor.

---

## 1. Teknoloji ve maliyet ilkeleri

- **Ön yüz:** Angular'ın güncel kararlı sürümü. Standalone component, signals, yeni control flow (`@if`, `@for`), lazy-loaded route'lar ve TypeScript strict modu kullan.
- **Arka uç:** Firebase'in AngularFire paketi.
  - Hosting
  - Firestore
  - Storage (görseller ve PDF'ler)
  - Authentication (Google ile giriş)
  - Tek bir küçük Cloud Function (bkz. bölüm 4)
- **Plan:** Blaze, ama hedef ücretsiz kotada kalmak. README'de bütçe uyarısının nasıl kurulacağını adım adım yaz.
- **Kullanılmayacaklar:** SSR sunucusu, Cloud Run, Algolia, ücretli Firebase uzantıları. Herkese açık sayfalarda gerçek zamanlı dinleyici (`onSnapshot`) da kullanma. Okur sayfaları veriyi tek seferlik `getDoc`/`getDocs` ile alsın. Firestore'un kalıcı yerel önbelleğini aç.
- **Okuma sayısını düşük tut:**
  - Ana sayfa tek bir belge okuyarak açılabilmeli. En yeni sayının belgesi, o sayıdaki yazıların özetlerini (başlık, kategori, yazar, kısa özet, küçük görsel) kendi içinde taşısın.
  - Yazı sayfası tek belge okusun.
  - Yorumlar yalnızca okur yorum bölümüne gelince yüklensin.

## 2. Görsel kimlik (tasarımdan aynen alınacak)

- **Renk token'ları:**
  - `--paper:#E8E7E3`
  - `--ink:#3D3D3B`
  - `--ink-soft:#56554F`
  - `--muted:#77756E`
  - `--box:#D9D2C5`
  - `--rule:#3D3D3B`
  - `--hair:#B9B6AD`
  - `--card:#EFEEEA`
- **Tema:** Yalnızca açık tema. Basılı gazeteyle aynı görünmeli.
- **Fontlar (Google Fonts):**
  - Cinzel: manşet ve büyük başlıklar
  - Playfair Display: başlıklar
  - Lora: gövde metni
  - Montserrat: arayüz, etiketler, tarihler
  - Noto Serif: künyedeki söz
- **Gazete öğeleri:**
  - Kâğıt dokulu zemin
  - Çift çizgili künye (kalın üst çizgi, ince alt çizgi)
  - Noktalı ayraçlar
  - Kalem ikonlu kategori etiketi
  - Bölüm başlığının yanından uzanan çizgi
- **Mobil:** Öncelik telefon. 16 piksel kenar boşluğu bırak, yatay kaydırma olmasın. Künye, tasarımdaki gibi dar ekranda tek sütuna düşsün.
- **Erişilebilirlik:**
  - Tıklanan her şey gerçek `<button>` ya da `<a>` olsun.
  - Klavye odağı görünsün.
  - Görsellerin `alt` metni olsun.
  - `lang="tr"` kullan.
  - Sıralamalar `localeCompare(..., "tr")` ile yapılsın.

## 3. Okur sitesi: sayfalar ve adresler

Hash yerine gerçek adresler kullan. Hosting'de SPA yönlendirmesi olacak.

| Adres | Sayfa |
|---|---|
| `/` | En yeni sayı (tasarımdaki "Bu Sayı" görünümü) |
| `/sayi/:no` | Eski bir sayı. Üstte "En yeni sayıya dön" bandı olsun |
| `/yazi/:slug` | Yazı sayfası |
| `/yazarlar` ve `/yazarlar/:slug` | Yazar listesi ve seçilen yazarın yazıları |
| `/konular` ve `/konular/:slug` | Kategori ve etiketlere göre süzme |
| `/karikaturler` | Karikatür köşesi, tüm sayıların karikatür galerisi |
| `/bulmaca` ve `/bulmaca/:no` | Etkileşimli bulmaca |
| `/sayilar` | Bütün sayıların listesi (arşiv) |

**Ortak üst bölüm (künye):**
- Logo ana sayfaya götürsün.
- Ortada sayının sözü, sağda "Haber Turu" kutusu (sayının öne çıkan beş yazısı) dursun.
- Altında tarih ve sayı satırı ile "Risale Okulu'nun bihâftelik ilmi gazetesidir." sloganı.
- Menü sırası: Bu Sayı · Yazarlar · Konular · Karikatürler · Bulmaca · Sayılar.

**Sayı görünümü (tasarımdaki gibi):**
1. Editör yazısı manşette: Cinzel ile büyük başlık, geniş görsel, üç sütunlu giriş ve "Editör yazısının tamamı →" bağlantısı.
2. "Bu sayıda" başlığı altında yazı kartlarından bir ızgara. Kartta görsel, kategori etiketi, başlık, yazar ve özet olsun. Görseli olmayan şiir kartında görselin yerine şiirin ilk dizeleri çıksın.
3. Altta üç panel: o sayının Lügat'i, Karikatür'ü (`/karikaturler`'e bağlansın) ve Duyurular.
4. "Önceki sayılar" bloğu. Her sayı için görsel, sayı numarası, tarih, editör yazısının başlığı ve yazı listesi gösterilsin.
5. Sayının PDF'i yüklenmişse "PDF olarak indir" düğmesi.

**Yazı sayfası (tasarımdaki gibi):**
- Üst satır, başlık ve kategori etiketi.
- Ana görsel.
- Künye satırı: yazar, varsa konuk, "Sayı N · s. X", tahmini okuma süresi.
- Gövde blokları (bkz. 5.2).
- Yazının sonunda yazarın imzası ve varsa notu.
- Etiket çipleri, `/konular/...` sayfasına götürsün.
- "Yazarın diğer yazıları" listesi. Editör ve ENTEL imzalı yazılarda bu liste gösterilmesin.
- Aynı sayı içinde önceki ve sonraki yazı bağlantıları.
- Yorumlar bölümü (bkz. 5.5).

**Lügat kelimelerini otomatik işaretleme (tasarımdaki özellik, korunmalı):**
- Bütün sayıların lügatleri tek bir sözlükte birleşsin.
- Bir kelimenin yazı içinde ilk geçtiği yerin altı noktalı çizilsin. Türkçe eklerle de eşleşsin: tasarımdaki gövde eşleştirme mantığını kullan.
- Kelimenin üstüne gelince ya da dokununca anlamı açılsın.
- Mobilde dokunmayla açılıp kapanmalı. Tooltip ekran dışına taşmamalı.
- Sözlüğün tamamı her yazı sayfasında yeniden okunmasın. Tek bir `meta/glossary` belgesinde dursun ve uygulama açılırken bir kez okunup önbelleğe alınsın.

**Yazarlar ve Konular:** Tasarımdaki iki sütunlu düzeni koru. Solda isim listesi ve yazı sayıları, sağda satır satır yazılar. Kategoriler sabit:
- Editörden
- Deneme
- Mikrofon (röportaj)
- Arşivden
- Şiir
- Bir Kavram

Etiketler serbest. Yazar ve etiket sayıları her sayfa açılışında hesaplanmasın. Yayınlama anında `meta/index` belgesine yazılsın.

**Karikatürler:** Galeri en yeniden eskiye sıralansın. Her kartta karikatürün başlığı (tek satır, ilgili yazıdan alınır), sayı numarası ve görsel olsun. Tıklanınca büyük görünüm açılsın. Karikatürün altında açıklama ya da numara olmasın, sadece başlık ve görsel.

**Bulmaca (etkileşimli):**
- Bulmacada siyah kareli bir ızgara olsun, ayrıca "Yatay" ve "Dikey" başlıkları altında numaralı ipuçları. İpucu biçimi: `4. ipucu metni` (numara, nokta, ipucu). İpuçlarında harf sayısı ya da parantez yok.
- Okur kutulara Türkçe harflerle yazabilsin (Ç, Ğ, İ, I, Ö, Ş, Ü dahil, büyük harfe çevrilerek).
- Ok tuşları ve otomatik ilerleme çalışsın. Bir ipucuna tıklanınca o kelime vurgulansın.
- Okurun ilerlemesi tarayıcıda (localStorage) saklansın. Okuma ve yazmayı try/catch içine al.
- Çözüm, PDF'teki gibi bir sonraki sayı yayınlanınca "Geçtiğimiz sayının çözümü" olarak açılsın. O zamana kadar cevaplar istemciye hiç gelmemeli (bkz. veri modeli ve kurallar).
- Telefonda kullanışlı olmalı: kareler dokunmaya yetecek büyüklükte, ipuçları ızgaranın altında.

## 4. WhatsApp önizlemesi (çok önemli)

Bağlantılar WhatsApp'ta paylaşılacak. `/yazi/:slug`, `/sayi/:no` ve `/karikaturler` bağlantıları paylaşılınca önizlemede başlık, kısa açıklama ve görsel görünmeli.

**Çözüm:**
- Hosting'de bu yollar için bir rewrite tanımla. Rewrite, küçük bir HTTP Cloud Function'a gitsin: 2. nesil, `europe-west`, `minInstances: 0`, 256 MB.
- Fonksiyon ilgili belgeyi okusun, `index.html` içine `og:title`, `og:description`, `og:image`, `og:url` ve `twitter:card` etiketlerini yerleştirip döndürsün.
- `Cache-Control: public, max-age=300, s-maxage=86400` başlığıyla yanıtı CDN'de önbelleğe alsın.
- Angular uygulaması tarayıcıda normal şekilde açılsın. Ayrıca her sayfada Angular'ın `Title` ve `Meta` servisleriyle başlık ve açıklama güncellensin.
- Sitenin `og:image` için varsayılan bir paylaşım görseli olsun: logo ve kâğıt zemin, 1200×630.

## 5. Veri modeli (Firestore)

### 5.1 Koleksiyonlar

**`issues/{no}`** (belge kimliği sayı numarası, ör. `"56"`):
- `no`, `date` (gösterim için "18 Kasım 2026" ve sıralama için Timestamp)
- `quote`: künyedeki söz
- `status`: `draft` veya `published`
- `pdf`: `{ path, url }`
- `coverPostId`: editör yazısı
- `cartoonId`
- `glossary`: `[{ word, def }]`
- `ads`: `[{ title, text }]`
- `posts`: sıralı özet dizisi, `[{ id, slug, title, category, authorNames, guest, excerpt, thumb, pages }]`. Denormalize, ana sayfa yalnızca bunu okur.

**`posts/{id}`:**
- `slug` (benzersiz, Türkçe karakterler sadeleştirilmiş), `issueNo`, `order`
- `title`, `category`, `authorIds`, `authorNames`, `guest`, `note`, `pages`
- `tags`: string dizisi
- `hero`: `{ path, url, thumbUrl, w, h }`
- `body`: blok dizisi
- `readMinutes`, `status`, `publishedAt`

**`authors/{id}`:** `name`, `slug`, `postCount`

**`cartoons/{id}`:** `issueNo`, `title`, `image: { path, url, thumbUrl, w, h }`, `relatedPostId` (isteğe bağlı), `publishedAt`

**`puzzles/{no}`:** `width`, `height`, hücre maskesi (hangi kare beyaz), numaralar, `across` ve `down` ipuçları (`[{ num, clue, row, col, length }]`), `solutionPublic` (boolean). Cevaplar burada yer almaz.

**`puzzles/{no}/private/solution`:** harflerle dolu ızgara. Yalnızca `solutionPublic == true` olunca okunabilir. Bir sonraki sayı yayınlanınca panel bu alanı kendiliğinden `true` yapar.

**`comments/{id}`:** `postId`, `uid`, `name`, `photoURL`, `text` (en fazla 1500 karakter), `status` (`pending`, `approved` veya `rejected`), `createdAt`

**`meta/glossary`**, **`meta/index`** (yazar, etiket ve kategori sayıları), **`meta/site`** (`latestIssueNo`)

**`admins/{uid}`:** yönetici listesi. İlk yönetici README'deki adımla elle eklenir.

### 5.2 Yazı gövdesi blokları

Tasarımdaki blok türlerini aynen destekle:

- `p`: paragraf. `**kalın**` işaretlemesi desteklenir.
- `lead`: kalın giriş paragrafı.
- `q`: röportaj sorusu (kalın, üstünde boşluk).
- `i`: italik ve girintili paragraf.
- `pull`: ortalanmış, üstte ve altta çizgili alıntı.
- `list`: madde listesi.
- `poem`: dizeler. Akrostiş (`acro`: ilk harfler kalın) ve son dizeyi vurgulama (`em`) seçenekleri var. Kıtalar arasında boşluk bırakılır.
- `image`: metin içi görsel ve alt yazı. Yeni blok türü.

HTML saklama. Bloklar JSON olarak tutulsun ve render sırasında kaçışlanarak (escape) basılsın.

### 5.3 Storage

- **Klasörler:**
  - `issues/{no}/pdf/...`
  - `posts/{postId}/...`
  - `cartoons/{id}/...`
  - `site/...`
- **Görsel işleme:** Görseller yüklenmeden önce tarayıcıda küçültülsün ve WebP'ye çevrilsin (kalite yaklaşık 0,8). İki boy üretilsin:
  - büyük: en uzun kenar 1600 piksel
  - küçük (kart ve önizleme): 480 piksel
- **Önbellek:** Yüklemede `cacheControl: "public, max-age=31536000, immutable"` kullan. Dosya adına içerik özeti (hash) ekle ki eskisinin yerine yenisi yüklendiğinde adres değişsin.
- **Kayıt:** Görselin genişliği ve yüksekliği belgeye yazılsın. `<img>` etiketinde `width`/`height` ve `loading="lazy"` kullan.

### 5.4 Güvenlik kuralları

- **Firestore:**
  - Herkes yalnızca `status == "published"` olan sayı ve yazıları okuyabilir.
  - `admins` listesindekiler her şeyi okuyup yazabilir.
  - Çözüm belgesi yalnızca `solutionPublic` doğruysa okunur.
  - Yorum ekleme koşulları: giriş yapmış olmak, `status == "pending"`, `uid == request.auth.uid` ve metin uzunluğu sınırı. Okurlar yalnızca onaylı yorumları okur. Yorumu yalnızca yönetici onaylar ya da siler.
- **Storage:** Okuma herkese açık. Yazma yalnızca yöneticiye açık: görsellerde `image/*` ve en fazla 5 MB, PDF'te `application/pdf` ve en fazla 25 MB.
- Kurallar için emülatörde çalışan birim testleri yaz.

### 5.5 Yorumlar

- Yazı sayfasının sonunda dursun. Tasarımdaki "Google ile giriş" kutusunu kullan.
- Okur Google ile giriş yapıp yorum yazar. Yorum "onay bekliyor" olarak kaydedilir. Okura "Yorumunuz editör onayından sonra yayınlanacak" mesajı gösterilir.
- Onaylanan yorumlar yazının altında görünür.

## 6. Yönetim paneli (`/yonetim`)

- Google ile giriş yapılır. Yalnızca `admins` listesindekiler girebilir, diğerleri "Yetkiniz yok" sayfası görür.
- Panel okur sitesinden ayrı, lazy-loaded bir modül olsun ki okur tarafının paket boyutu büyümesin.
- Panel sade olmalı. Editörler yazılımcı değil.

1. **Sayılar:** Yeni sayı oluşturma alanları:
   - numara (son sayının bir fazlası önerilsin), tarih, künye sözü
   - PDF yükleme
   - Lügat satırları (kelime ve tanım, ekle/sil/sırala)
   - Duyurular
   - editör yazısı seçimi, karikatür seçimi
   - yazıların sırasını sürükle-bırak ile ayarlama

   "Yayınla" düğmesi tek bir toplu yazmayla (batch) şunları yapar:
   - sayının yazı özetlerini oluşturur
   - `meta/site.latestIssueNo` değerini günceller
   - `meta/index` ve `meta/glossary` belgelerini yeniden hesaplar
   - bir önceki sayının bulmaca çözümünü açar
2. **Yazılar:** Liste sayıya ve duruma göre süzülebilsin. Yazı formunda şunlar olsun:
   - başlık (slug otomatik üretilsin, elle değiştirilebilsin), sayı, kategori
   - yazarlar: çoklu seçim, listede olmayan isim yazılınca yeni yazar oluşur
   - konuk, sayfa no, etiketler (öneri listeli), not
   - ana görsel yükleme (kırpma önizlemeli)
   - **blok editörü:** blok ekle, sil, yukarı/aşağı taşı. Her blok türünün kendi basit alanı olsun.
   - **"Metin yapıştır" yardımcısı:** PDF'ten kopyalanan düz metin yapıştırılınca boş satırlardan paragraflara bölünüp `p` bloklarına dönüşsün. PDF'ten gelen satır sonu tirelerini ve kırık satırları birleştir. Bu, editörün en çok zaman kazanacağı yer.
   - okur görünümünde önizleme, taslak kaydet, yayınla
3. **Yazarlar:** isim düzeltme, birleştirme (aynı kişinin iki farklı yazılışı), yazı sayısı.
4. **Karikatürler:** görsel yükleme, başlık, sayı seçimi, isteğe bağlı ilgili yazı.
5. **Bulmaca:** Sayı seçilir. Editör kelimeleri ve ipuçlarını satır satır girer.
   - "Yerleştir" düğmesi kelimeleri birbirini kesecek şekilde otomatik bir ızgaraya dizer: 13×15 civarı, kesişimi en çok olan düzeni seçsin.
   - Yerleşmeyen kelimeler listelensin. Editör yeniden karıştırabilsin ya da elle konum verebilsin.
   - Önizleme boş ızgara ve çözümlü ızgara olarak iki sekmede gösterilsin.
   - Kaydederken herkese açık belgeye yalnızca maske, numaralar ve ipuçları yazılsın. Harfler `private/solution` belgesine gitsin.
6. **Yorumlar:** Onay bekleyenler listesi. Onayla, reddet, sil.

## 7. Proje yapısı, geliştirme ve yayın

- Klasörler:
  - `src/app/core` (servisler, modeller, guard'lar)
  - `src/app/public` (okur sayfaları)
  - `src/app/admin` (panel)
  - `src/app/shared` (künye, kart, etiket, blok render, lügat tooltip)
  - `functions/` (önizleme fonksiyonu)
- Geliştirme Firebase Emulator Suite ile yapılsın: Auth, Firestore, Storage, Functions, Hosting.
- **Seed betiği:** Tasarımın içindeki örnek veriyi (Sayı 52 ve Sayı 55; yazılar, lügatler, duyurular, görseller) emülatöre aktarsın. Görseller tasarımda base64 olarak gömülü: betik bunları dosyaya çıkarıp Storage'a yüklesin.
- `firebase.json` içinde şunlar olsun:
  - SPA rewrite
  - önizleme fonksiyonu rewrite'ları
  - statik dosyalar için uzun süreli önbellek başlıkları
  - `index.html` için `no-cache`
- Önce bir önizleme kanalına (`firebase hosting:channel:deploy`) yayınlanacak, sonra canlıya alınacak. Ikisinin komutlarını README'ye yaz.
- **README içeriği:**
  - Firebase projesi kurulumu
  - Blaze ve bütçe uyarısı kurulumu
  - ilk yöneticiyi ekleme
  - emülatörde çalıştırma
  - seed
  - önizleme ve canlı yayın
  - yeni bir sayıyı panelden yayınlama, adım adım
- Lighthouse mobil hedefi: performans ve erişilebilirlik 90 ve üzeri.

## 8. Çalışma sırası

Her aşamanın sonunda dur, bana neyin bittiğini ve nasıl deneyeceğimi kısaca yaz, onayımı bekle.

1. Proje iskeleti, Firebase bağlantısı, emülatörler, veri modeli tipleri, güvenlik kuralları ve testleri, seed betiği.
2. Okur sitesi: künye, sayı görünümü, yazı sayfası (bloklar ve lügat tooltip'i), Yazarlar, Konular, Sayılar. Tasarımla yan yana karşılaştırarak.
3. Karikatürler sayfası ve WhatsApp önizleme fonksiyonu.
4. Yönetim paneli: Sayılar, Yazılar (blok editörü ve metin yapıştırma), Yazarlar, Karikatürler.
5. Etkileşimli bulmaca: okur tarafı ve paneldeki otomatik yerleştirici.
6. Yorumlar (giriş, onay akışı) ve son temizlik: performans, erişilebilirlik, README.

Tasarımda olmayan bir şeye karar vermen gerekirse, örneğin yeni bir sayfanın düzeni, tasarımın diliyle tutarlı yap ve aşama sonunda bana söyle.


# CUPISTAN · KAP'TAN KAPI'YA

CUPISTAN için bir dijital dünya. Konsept, gerekçeleri ve eleştiri turunda değişenler için [CONCEPT.md](CONCEPT.md) dosyasına bakın.

Tek bir hece bütün deneyimi taşıyor: **KAP**. Açılışta CUPİSTAN, KAPİSTAN'a dönüşüyor. Sonra KAP hecesi köşeye uçup sitenin omurgası oluyor. Ziyaretçi maskotun kapağını kaldırıyor, kabın içine düşüyor ve yedi anlamdan geçerek kapıdan çıkıyor: KAPAK → KAP → KAPRİS → KAPIŞ KAPIŞ → KAPAK OLSUN → KAPI → KAP!

## Yayına alma (Hostinger / herhangi bir statik sunucu)

Derleme adımı yok. Şunları `public_html/` içine yükleyin:

```
index.html  404.html  credits.html  favicon.svg  favicon-32.png  apple-touch-icon.png
robots.txt  sitemap.xml  .htaccess  assets/
```

`tools/` ve `.md` dosyaları sunucuya gerekmez. Git ile yayına alınırsa `.htaccess` bunları ve `.git` klasörünü dışarıya kapatıyor. `.htaccess` ayrıca şunları yapıyor:

- https'ye ve www'suz alan adına yönlendirme (`cupistan.com`)
- sıkıştırma ve önbellek
- MIME türleri
- 404 sayfası

**Her yayında** `index.html` içindeki `kap.css?v=2`, `fonts.css?v=2` ve `kap.js?v=2` numaralarını bir artırın. CSS ve JS dosyaları 30 gün önbellekte kalıyor.

Yerelde denemek için:

```
npx serve .            # ya da: python3 -m http.server
```

## Kontrol

```
node tools/check.mjs                      # etkileşim ve saat testleri (PASS/FAIL)
node tools/qa.mjs out both auto           # mobil ve masaüstü ekran görüntüleri
node tools/qa.mjs out mobile 0,50vh Europe/Istanbul
```

`check.mjs` şunları test ediyor:

- İçindekiler penceresi: odak tuzağı, ESC ile kapanma, arka planın etkisiz kalması
- Omurgadaki eklerin üst üste binmemesi
- Sekiz farklı saatte açık ve kapalı durum, Cuma ve Cumartesi 02:00 dahil
- Hareket azaltma ve JavaScript'siz görünüm

## Klasörler

| yol | ne |
|---|---|
| `index.html` | bütün deneyim ve içerik: menü, şubeler, saatler, JSON-LD |
| `assets/css/kap.css` | renk sistemi, tipografi, sahneler (önce mobil, sonra masaüstü yeniden kompozisyonu) |
| `assets/js/kap.js` | kaydırma motoru, isimden omurgaya geçiş, kaba dalış, gezen kalp, ekler vitrini, kova salınımı, kutu kapağı, canlı saatler, İçindekiler |
| `assets/css/fonts.css`, `assets/fonts/` | Coiny, Fraunces ve DM Mono'nun Türkçe alt kümeleri (toplam 162 KB, `tools/fonts.sh`) |
| `assets/photo/` | sanat yönetimiyle kırpılmış WebP fotoğraflar (`tools/photos.sh`) |
| `assets/og.jpg`, `apple-touch-icon.png`, `favicon-32.png` | paylaşım görseli ve ikonlar (`tools/brand-assets.mjs`) |
| `credits.html` | fotoğraf ve yazı tipi künyesi |

## İçerik nasıl güncellenir

- **Saatler**: `assets/js/kap.js` içindeki `BRANCH` nesnesi (dakika cinsinden). Aynı saatler `index.html` içinde metin olarak da geçiyor: kapı tabelaları, kapı bilgileri, İçindekiler ve JSON-LD.
- **Yol tarifi bağlantıları**: `kap.js` içindeki `MAPS` nesnesi (Google Haritalar `dir` bağlantıları). Şubelerin Google İşletme kayıtları netleşince `destination_place_id` eklenmeli.
- **Fiyat**: Kova Waffle Menü 250₺. `index.html` içinde `kapis__price` ve İçindekiler menüsünde geçiyor.
- **Ekler vitrini**: `index.html` içindeki `data-eclair` düğmeleri ve fişteki satırlar. `data-color`, sahnenin zemin rengi.
- **Fotoğraflar**: Gerçek çekimler geldiğinde `assets/photo/` içindeki dosyayı aynı ad, aynı en-boy oranı ve aynı genişliklerle değiştirmek yeterli. Kırpma ölçüleri `tools/photos.sh` içinde.
- **Maskot**: KAPAK sahnesindeki SVG (`index.html`). Parçalara ayrılmış: `.m-lid` kapak, `.m-heart` kalp, `.m-eyes` gözler, `.m-sleep` uyuyan gözler, `.m-zz`. Diğer kopyalar JS ile bu SVG'den üretiliyor.

## Doğrulanmamış bilgiler (müşteriyle teyit edilmeli)

Bilgiler Instagram profilinden (@cupistantr) ve herkese açık kaynaklardan alındı. Uydurulmadı. Aşağıdakiler teyit edilmeli:

- **Hacıhalil Çarşı şubesinin açık adresi** ve iki şubenin Google Haritalar kaydı. "Yol tarifi" şu an adres araması yapıyor.
- **Çarşı şubesinin her gün açık olduğu.** Biyografide gün belirtilmiyor.
- **"CmCts02"** ifadesi Cuma ve Cumartesi geceleri 02:00'ye kadar açık olarak yorumlandı.
- **Telefon numarası** bulunamadı, bu yüzden sitede yok. İletişim Instagram DM üzerinden.
- **Paket servis kanalı** (Yemeksepeti, Getir vb.) bilinmiyor. "DM'den sor" diye yönlendiriliyor.
- **Ekler çeşitleri.** Sitede renkle anılıyor (pembe, yeşil, kahve, kırmızı) çünkü vitrin değişiyor. Fotoğraflar stok görsel.
- **Kova Waffle Menü 250₺** fiyatı ve "Siyah & Beyaz Kova" adı Instagram gönderilerinden alındı.
- **Alan adı**: `cupistan.com` (www'suz) varsayıldı. Canonical, OG ve JSON-LD adresleri buna göre yazıldı.

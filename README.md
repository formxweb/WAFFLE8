# CUPISTAN · KAP'TAN KAPI'YA

CUPISTAN için bir dijital dünya. Konsept, gerekçeleri ve sistem için [CONCEPT.md](CONCEPT.md) dosyasına bakın.

Tek bir hece bütün deneyimi taşıyor: **KAP**. Ziyaretçi maskotun kapağını kaldırıyor, kabın içine düşüyor ve yedi anlamdan geçerek kapıdan çıkıyor: KAPAK → KAP → KAPRİS → KAPIŞ KAPIŞ → KAPAK OLSUN → KAPI → KAP!

## Yayına alma (Hostinger / herhangi bir statik sunucu)

Derleme adımı yok. Kök klasördeki şunları `public_html/` içine yükleyin:

```
index.html  404.html  favicon.svg  robots.txt  .htaccess  CREDITS.md
assets/
```

`tools/`, `CONCEPT.md` ve `README.md` sunucuya gerekmez. `.htaccess` sıkıştırmayı, önbelleği, MIME türlerini ve 404 sayfasını ayarlıyor.

Yerelde denemek için:

```
npx serve .            # ya da: python3 -m http.server
```

## Klasörler

| yol | ne |
|---|---|
| `index.html` | tüm deneyim ve içerik (menü, şubeler, saatler, JSON-LD) |
| `assets/css/kap.css` | renk sistemi, tipografi, sahneler. Önce mobil, sonra masaüstü yeniden kompozisyonu |
| `assets/js/kap.js` | kaydırma motoru, kapak dalışı, gezen kalp, canlı saatler, ekler lokması, kova salınımı, İçindekiler |
| `assets/photo/` | sanat yönetimiyle kırpılmış WebP fotoğraflar (`tools/photos.sh`) |
| `assets/fonts/` | Coiny, Fraunces, DM Mono (sunucuda barındırılıyor, Türkçe karakterli) |
| `tools/qa.mjs` | ekran görüntüsü kontrolü: `node tools/qa.mjs out both auto` |

## İçerik nasıl güncellenir

- **Saatler**: `assets/js/kap.js` içindeki `BRANCH` nesnesi (dakika cinsinden). Aynı saatler `index.html` içinde üç yerde metin olarak geçiyor: kapı kartları, İçindekiler ve JSON-LD.
- **Fiyat**: Kova Waffle Menü 250₺. `index.html` içinde `kapis__price` ve İçindekiler menüsünde geçiyor.
- **Ekler çeşitleri**: `index.html` içindeki `data-eclair` figürleri. `data-color`, sahnenin o anki zemin rengi; `data-ink` de üstündeki yazı rengi.
- **Fotoğraflar**: Gerçek çekimler geldiğinde `assets/photo/` içindeki dosyayı aynı ad, aynı en-boy oranı ve aynı genişliklerle değiştirmek yeterli. Kırpma ölçüleri `tools/photos.sh` içinde.
- **Maskot**: `index.html` içinde, KAPAK sahnesindeki SVG. Animasyon için parçalara ayrılmış: `.m-lid` kapak, `.m-heart` kalp, `.m-eyes` gözler, `.m-sleep` uyuyan gözler. Diğer kopyalar JS ile bu SVG'den üretiliyor.

## Doğrulanmamış bilgiler (müşteriyle teyit edilmeli)

Bilgiler Instagram profilinden (@cupistantr) ve herkese açık kaynaklardan alındı. Uydurulmadı. Aşağıdakiler teyit edilmeli:

- **Hacıhalil Çarşı şubesinin açık adresi.** Bilinmediği için "Yol tarifi" bağlantısı bir Google Haritalar araması.
- **Çarşı şubesinin her gün açık olduğu.** Biyografide gün belirtilmiyor.
- **"CmCts02"** ifadesi Cuma ve Cumartesi geceleri 02:00'ye kadar açık olarak yorumlandı.
- **Telefon numarası** herkese açık kaynaklarda bulunamadı, bu yüzden sitede yok. İletişim Instagram DM üzerinden yapılıyor.
- **Paket servis kanalı** (Yemeksepeti, Getir vb.) bilinmiyor. Paket servis için DM'e yönlendiriliyor.
- **Ekler çeşitleri ve ürün fotoğrafları** stok görseller. Ürünler Instagram'daki gönderilerle benzer renk ve türde seçildi.
- **Kova Waffle Menü 250₺** fiyatı Instagram gönderisinden alındı. Fiyat değişirse güncellenmeli.

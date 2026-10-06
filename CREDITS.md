# Fotoğraf ve yazı tipi kaynakları

Bu sayfanın sitedeki karşılığı: [credits.html](credits.html).

## Fotoğraflar

Tüm fotoğraflar [Pexels](https://www.pexels.com/license/) lisansı ile kullanılıyor. Bu lisans ticari kullanıma izin veriyor ve atıf zorunlu değil. Kırpma, döndürme, rötuş ve dekupe `tools/photos.sh` ile yapılıyor; kaynaklar 4000 piksel genişlikte indiriliyor ve hiçbir görsel büyütülmüyor. Fotoğraflar CUPISTAN'ın kendi ürünlerini göstermiyor; CUPISTAN'ın kendi çekimi yapılana kadar ürün kategorisini temsil eden stok görsellerdir. Gerçek çekimler geldiğinde aynı dosya adı ve en-boy oranıyla `assets/photo/` klasörüne konması yeterli.

| dosya | sahne | en-boy | kaynak |
|---|---|---|---|
| `kap-ici-*` | KAPAK: kabın içi, yukarıdan (kabın iç kenarı karenin 0,355'i, tam ortada) | 1:1 | https://www.pexels.com/photo/7594391/ |
| `magnolya-*` | KAP: Magnolya | 15:16 | https://www.pexels.com/photo/13000186/ |
| `dondurma-*` | KAP: Dondurma (kaplardaki başka bir dükkânın adı kırpıldı ve silindi) | 15:16 | https://www.pexels.com/photo/22809602/ |
| `kap-tatli-*` | KAP: Kap tatlı | 15:16 | https://www.pexels.com/photo/39342928/ |
| `ekler-pembe-*` | KAPRİS: 01 pembe | 2,6:1 | https://www.pexels.com/photo/33100287/ |
| `ekler-yesil-*` | KAPRİS: 02 yeşil | 2,6:1 | https://www.pexels.com/photo/9157463/ |
| `ekler-kahve-*` | KAPRİS: 03 kahve (yeşil ile aynı fotoğraf) | 2,6:1 | https://www.pexels.com/photo/9157463/ |
| `ekler-kirmizi-*` | KAPRİS: 04 kırmızı | 2,6:1 | https://www.pexels.com/photo/30700723/ |
| `kova-*` | KAPIŞ KAPIŞ: Kova Waffle Menü (kova maskesi) | 400:460 | https://www.pexels.com/photo/21832922/ |
| `kova-dondurma-*` | KAPIŞ KAPIŞ: dondurmalı waffle kase (daire maskesi) | 1:1 | https://www.pexels.com/photo/22484685/ |
| `pasta-kutu-*` | KAPAK OLSUN: kutuda pasta | 4:5 | https://www.pexels.com/photo/20156595/ |
| `son-kasik-*` | KAP!: son kaşık (şeffaf arka planlı dekupe) | dikey | https://www.pexels.com/photo/14145912/ |

Eklerlerin büyük dosyası (`-1600`) kaynağın izin verdiği en büyük net boyutta: yeşil 1600, kırmızı 1352, pembe 1014, kahve 1000 piksel genişlikte (kahve ekler fotoğrafta odak dışında).

## Paylaşım görseli ve ikonlar

`assets/og.jpg`, `apple-touch-icon.png` ve `favicon-32.png` fotoğraf değil: maskottan ve `favicon.svg` dosyasından `tools/brand-assets.mjs` ile çiziliyor.

## Yazı tipleri

[SIL Open Font License 1.1](https://openfontlicense.org) ile kullanılıyor. Dosyalar `assets/fonts/` klasöründe; `tools/fonts.sh` orijinal Google Fonts kaynaklarından Türkçe alt kümeleri üretiyor. Lisans metni `assets/fonts/OFL.txt` dosyasında.

- **Coiny** (Marcelo Magalhães). Display.
- **Fraunces** (Undercase Type: Phaedra Charles, Flavia Zimbardi). Editoryal.
- **DM Mono** (Colophon Foundry). Mikro tipografi.

## Maskot

Maskot, CUPISTAN'ın Instagram profil görselinden (@cupistantr) vektör olarak yeniden çizildi. Animasyon için parçalara ayrıldı: kapak, kalp, gözler ve yüz. Marka bu karaktere ait.

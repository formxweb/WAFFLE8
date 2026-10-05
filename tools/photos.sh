#!/usr/bin/env bash
# Downloads the photography from Pexels (free licence, commercial use allowed)
# and produces the art-directed crops in assets/photo/.
#
#   bash tools/photos.sh
#
# Every crop is documented next to its command. Source pages are listed in
# CREDITS.md. Replace any file in assets/photo/ with a real CUPISTAN photo of
# the same name and aspect ratio; no HTML change is needed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${PHOTO_CACHE:-$ROOT/.photo-cache}"
OUT="$ROOT/assets/photo"
mkdir -p "$SRC" "$OUT"

get() { # pexels id
  [ -s "$SRC/$1.jpg" ] || curl -sfL --retry 3 -o "$SRC/$1.jpg" \
    "https://images.pexels.com/photos/$1/pexels-photo-$1.jpeg?auto=compress&cs=tinysrgb&w=2400"
}

# webp <src.jpg> <name> <widths...>  (writes name-<w>.webp)
webp() {
  local in="$1" name="$2"; shift 2
  for w in "$@"; do
    convert "$in" -resize "${w}x>" -strip -quality 78 -define webp:method=6 "$OUT/$name-$w.webp"
  done
}

# rotate around (cx,cy) by deg, then crop w x h centred on (cx,cy)
capsule() { # id cx cy deg w h tmp
  convert "$SRC/$1.jpg" -virtual-pixel edge -distort SRT "$2,$3 1 $4" -gravity NorthWest \
    -crop "$5x$6+$(( $2 - $5/2 ))+$(( $3 - $6/2 ))" +repage "$7"
}

crop() { # id geometry tmp
  convert "$SRC/$1.jpg" -crop "$2" +repage "$3"
}

T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT

for id in 7594391 13000186 22809602 39342928 18136630 9157463 33100287 30700723 \
          22484685 21832922 20156595 14145912; do get "$id"; done

# KAPAK — looking into the cup from above (cream + strawberry swirl). Square, cup centred.
crop 7594391 1600x1600+370+0 "$T/ic.jpg";            webp "$T/ic.jpg" kap-ici 900 1600

# KAP — vessels
crop 13000186 1897x2371+0+420 "$T/mag.jpg";          webp "$T/mag.jpg" magnolya 700 1200
crop 22809602 800x800+530+600 "$T/fis.jpg";          webp "$T/fis.jpg" dondurma-fistik 600 800
crop 39342928 2400x2400+0+400 "$T/tir.jpg";          webp "$T/tir.jpg" kap-tatli 700 1200
cp "$SRC/18136630.jpg" "$T/krema.jpg";               webp "$T/krema.jpg" krema-cilek 900 1600

# KAPRİS — one éclair per capsule, rotated level
capsule 33100287 1575 2115 15   1300 500 "$T/e1.jpg"; webp "$T/e1.jpg" ekler-cilek 700 1300
capsule 9157463  1560 2600 37.4 1500 600 "$T/e2.jpg"; webp "$T/e2.jpg" ekler-fistik 700 1400
capsule 9157463  1290 2070 30.4 1900 600 "$T/e3.jpg"; webp "$T/e3.jpg" ekler-bitter 700 1400
capsule 30700723 1305 740  12   1000 400 "$T/e4.jpg"; webp "$T/e4.jpg" ekler-frambuaz 700 1000

# KAPIŞ KAPIŞ — the bowl on pink, and an extreme close-up of waffle + strawberries
crop 22484685 1920x2400+180+990 "$T/kova.jpg";       webp "$T/kova.jpg" kova 700 1200
crop 21832922 1400x1400+400+0 "$T/kovay.jpg";        webp "$T/kovay.jpg" kova-yakin 700 1200

# KAPAK OLSUN — bento cake in its box, lid open
crop 20156595 2400x3000+0+600 "$T/pasta.jpg";        webp "$T/pasta.jpg" pasta-kutu 700 1200

# KAP! — the last spoon (white background, used with multiply)
crop 14145912 2400x3200+0+200 "$T/kasik.jpg";        webp "$T/kasik.jpg" son-kasik 600 1000

# Share image (1200x630): the cup from above
convert "$SRC/7594391.jpg" -resize 1200x -gravity center -crop 1200x630+0+0 +repage -quality 82 "$ROOT/assets/og.jpg"

ls -la "$OUT" | awk '{print $5, $9}'
du -sh "$OUT"

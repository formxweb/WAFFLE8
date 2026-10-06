#!/usr/bin/env bash
# Downloads the photography from Pexels (free licence, commercial use allowed)
# and produces the art-directed crops in assets/photo/.
#
#   bash tools/photos.sh            # needs ImageMagick 6 with WebP, curl
#
# Sources are fetched at w=4000 (Pexels caps at the original size) into a cache
# OUTSIDE the repo (override with PHOTO_CACHE=/path). Nothing is ever upscaled:
# every output width is <= the width of the source region it is cut from.
# Coordinates below are pixels of those downloads. Source pages: CREDITS.md.
#
# To swap in a real CUPISTAN photo, drop a file with the same name and aspect
# ratio into assets/photo/; no HTML change is needed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${PHOTO_CACHE:-${TMPDIR:-/tmp}/cupistan-photo-cache}"
OUT="$ROOT/assets/photo"
mkdir -p "$SRC" "$OUT"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT

get() { # pexels id -> $SRC/<id>.jpg
  [ -s "$SRC/$1.jpg" ] || curl -sfL --retry 3 -o "$SRC/$1.jpg" \
    "https://images.pexels.com/photos/$1/pexels-photo-$1.jpeg?auto=compress&cs=tinysrgb&w=4000"
}

# enc <in> <out-name> <width> [quality] [extra args...]   (out-name without .webp)
enc() {
  local in="$1" name="$2" w="$3" q="${4:-84}"; shift 3; [ $# -gt 0 ] && shift
  local iw; iw=$(identify -format "%w" "$in")
  if [ "$w" -gt "$iw" ]; then echo "refusing to upscale $name ($iw < $w)" >&2; exit 1; fi
  convert "$in" -resize "${w}x" "$@" -strip -quality "$q" -define webp:method=6 "$OUT/$name.webp"
}

# crop <id> <geometry> <tmp>
crop() { convert "$SRC/$1.jpg" -crop "$2" +repage "$3"; }

# level <id> <cx> <cy> <deg> <geometry> <tmp> : rotate around (cx,cy) so the éclair is level, then crop
level() { convert "$SRC/$1.jpg" -virtual-pixel edge -distort SRT "$2,$3 1 $4" -crop "$5" +repage "$6"; }

for id in 7594391 13000186 22809602 39342928 9157463 33100287 30700723 \
          21832922 22484685 20156595 14145912; do get "$id"; done

# ── KAPAK: looking into the cup from above ───────────────────────────────────
# Square, cup centred. The cup's inner rim (inside edge of the lip) was measured
# on the 3738x2492 source: centre (1765,1229), radius 899 horizontal / 889 vertical
# (mean 894). kap.js maps RIM = 0.355 of the side, so the side is 894/0.355 = 2520.
# The square runs 31px above the frame; those rows are the wood mirrored (the grain
# runs vertically, so the seam is invisible).
convert "$SRC/7594391.jpg" -crop 2520x2489+505+0 +repage \
  \( +clone -crop 2520x31+0+0 +repage -flip \) +swap -append +repage "$T/ici.png"
for w in 900 1600 2400; do enc "$T/ici.png" "kap-ici-$w" "$w"; done

# ── KAP: three vessels (15:16, the cup-shaped mask) ──────────────────────────
# Magnolya: tight on the layered glass, sides of the glass at the frame edges,
# strawberries just under the top edge (the mask hides the top 5%).
crop 13000186 1230x1312+270+470 "$T/mag.png"
enc "$T/mag.png" magnolya-700 700; enc "$T/mag.png" magnolya-1200 1200

# Dondurma: the pistachio scoop with the strawberry scoop behind. The cups carry
# another shop's printed name; the crop stops right of the red cup's logo
# (x>=600) and the letters of the yellow cup that remain at the right edge are
# painted out (morphological close = paper colour) in a feathered patch.
crop 22809602 900x960+600+580 "$T/don0.png"
convert "$T/don0.png" \( +clone -morphology Close Disk:16 \) \
  \( -size 900x960 xc:black -fill white -draw "rectangle 785,845 900,930" -blur 0x6 \) \
  -composite "$T/don.png"
enc "$T/don.png" dondurma-600 600; enc "$T/don.png" dondurma-900 900

# Kap tatlı: top view, the centre cup and parts of four neighbours. The phone
# source is over-sharpened cocoa powder; an edge-preserving smooth on the
# powder (fruit and rims keep their edges) brings the 1200 under 160KB at q74.
crop 39342928 2400x2560+440+940 "$T/tat0.png"
convert "$T/tat0.png" -resize 1200x -selective-blur 0x3+19% "$T/tat.png"
enc "$T/tat.png" kap-tatli-700 700 74; enc "$T/tat.png" kap-tatli-1200 1200 74

# ── KAPRİS: one éclair per capsule, 2.6:1, rotated level ─────────────────────
# Each crop stays inside its own éclair (no neighbour's colour). Where the
# source is soft or small, the "-1600" file is the largest sharp size instead
# (same 2.6:1 aspect, so the HTML width/height ratio still holds).
# Pembe: stripes only; above is the caramel éclair, below the chocolate one, so
# the band is 390px tall. Source-limited -> 1014px.
level 33100287 2016 2707 15 1014x390+1340+2470 "$T/e1.png"
enc "$T/e1.png" ekler-pembe-800 800; enc "$T/e1.png" ekler-pembe-1600 1014
# Yeşil: the front pistachio éclair, left end meeting the capsule end; sharp.
level 9157463 2789 4177 40 2600x1000+1150+3645 "$T/e2.png"
enc "$T/e2.png" ekler-yesil-800 800; enc "$T/e2.png" ekler-yesil-1600 1600
# Kahve: the cocoa-crumb éclair, left end. Tight vertically: the green crumbs
# of its neighbour start 130px below, the caramel one 10px above. The éclair
# sits behind the focal plane (its cream dots are blurred beyond use), so the
# large file is 1000px, the largest size that still reads sharp.
level 9157463 2150 3450 31 1638x630+480+3080 "$T/e3.png"
enc "$T/e3.png" ekler-kahve-800 800; enc "$T/e3.png" ekler-kahve-1600 1000
# Kırmızı: the front glazed éclair with its meringues, on black. Source-limited -> 1352px.
level 30700723 2175 1233 13 1352x520+1492+965 "$T/e4.png"
enc "$T/e4.png" ekler-kirmizi-800 800; enc "$T/e4.png" ekler-kirmizi-1600 1352

# ── KAPIŞ KAPIŞ ──────────────────────────────────────────────────────────────
# Kova (bucket mask, 400:460): waffle, hazelnut cream, banana and strawberries
# edge to edge; the fork and knife start below the crop.
crop 21832922 1220x1403+680+300 "$T/kova.png"
enc "$T/kova.png" kova-700 700; enc "$T/kova.png" kova-1200 1200
# Kova dondurma (circle mask): scoops and strawberries fill the inscribed
# circle; the waffle bowl's rim closes the bottom.
crop 22484685 1800x1800+900+2150 "$T/kd.png"
enc "$T/kd.png" kova-dondurma-600 600; enc "$T/kd.png" kova-dondurma-1000 1000

# ── KAPAK OLSUN: bento cake in its box (4:5), the box fills the lower two thirds
crop 20156595 2960x3700+0+1220 "$T/pasta.png"
enc "$T/pasta.png" pasta-kutu-700 700; enc "$T/pasta.png" pasta-kutu-1200 1200

# ── KAP!: the last spoon, cut out (transparent WebP) ─────────────────────────
# Worked at half resolution (1871x2807; the content is 1284px wide).
cutout() { # src.jpg -> $T/cut.png
  local d="$T/cut" BG=245 W H S; mkdir -p "$d"
  S=$(( (255-BG)*100/255 ))   # backdrop distance from white, in %
  convert "$1" -resize 50% "$d/src.png"
  read -r W H < <(identify -format "%w %h\n" "$d/src.png")
  convert "$d/src.png" -colorspace gray "$d/L.png"
  convert "$d/src.png" -separate -evaluate-sequence Min "$d/M.png"   # min(R,G,B): how much white is mixed in
  # 1. backdrop = near-white (L>=236). Between the strawberries a pale, out-of-focus
  #    stand (L 200-235) and two enclosed pockets count as backdrop, connected or not.
  convert -size "${W}x${H}" xc:black -fill white \
    -draw "rectangle 995,1560 1100,1925" -draw "rectangle 1030,1212 1067,1255" "$d/rect.png"
  convert "$d/L.png" -threshold 78% "$d/rect.png" -compose Multiply -composite "$d/rectbg.png"
  convert "$d/L.png" -threshold 92.5% "$d/rectbg.png" -compose Lighten -composite "$d/bgc.png"
  # 2. subject = not reachable from the frame edge through backdrop (glossy highlights stay solid)
  convert "$d/bgc.png" -bordercolor white -border 1 -fill gray50 -draw "color 0,0 floodfill" -shave 1x1 \
    -fill white +opaque gray50 -fill black -opaque gray50 \
    \( "$d/rectbg.png" -negate \) -compose Multiply -composite -morphology Open Disk:1 "$d/hard.png"
  # core: deep inside, always solid. seed: pixels surely of the subject's own colour.
  convert "$d/hard.png" -morphology Erode Disk:14 "$d/core.png"
  convert "$d/M.png" -threshold 47% -negate "$d/hard.png" -compose Darken -composite -morphology Erode Disk:1 \
    "$d/core.png" -compose Lighten -composite "$d/seed.png"
  # 3. F = colour of the nearest seed, pushed into the edge band (premultiplied, so no white bleeds in)
  convert "$d/src.png" "$d/seed.png" -compose Multiply -composite -blur 0x8 "$d/Pb.png"
  convert "$d/seed.png" -blur 0x8 -evaluate max 0.2% "$d/Ab.png"
  convert "$d/Pb.png" "$d/Ab.png" -compose Divide_Src -composite "$d/src.png" "$d/seed.png" -compose Over -composite "$d/F.png"
  convert "$d/F.png" -separate -evaluate-sequence Min "$d/MF.png"
  # 4. edge alpha = (BG - M) / (BG - M_F): the share of subject colour in each edge pixel.
  #    This is what removes the light rim the out-of-focus edges carry.
  convert "$d/M.png" -negate -evaluate subtract "$S%" "$d/num.png"
  convert "$d/MF.png" -negate -evaluate subtract "$S%" -evaluate max 1% "$d/den.png"
  convert "$d/num.png" "$d/den.png" -compose Divide_Src -composite -evaluate multiply 1.12 \
    "$d/hard.png" -compose Darken -composite "$d/core.png" -compose Lighten -composite -blur 0x0.6 "$d/a0.png"
  # 5. fade where the subject leaves the frame: the stream at the top, the drip, the handle
  convert -size "${W}x${H}" xc:white \
    \( -size "${W}x180" gradient:black-white \) -geometry +0+0 -compose Multiply -composite \
    \( -size "${W}x160" gradient:white-black \) -geometry +0+$((H-160)) -compose Multiply -composite \
    \( -size "${H}x100" gradient:white-black -rotate -90 \) -geometry +$((W-100))+0 -compose Multiply -composite "$d/fade.png"
  convert "$d/a0.png" "$d/fade.png" -compose Multiply -composite "$d/alpha.png"
  # 6. un-mix the backdrop from edge pixels: C' = BG - (BG - C) / a ; the core keeps its own pixels
  convert "$d/src.png" -negate -evaluate subtract "$S%" "$d/dc.png"
  convert "$d/a0.png" -evaluate max 3% "$d/amax.png"
  convert "$d/dc.png" "$d/amax.png" -compose Divide_Src -composite -negate -evaluate subtract "$S%" "$d/un.png"
  convert "$d/un.png" "$d/src.png" "$d/core.png" -compose Over -composite \
    "$d/alpha.png" -alpha off -compose CopyOpacity -composite "$d/rgba.png"
  convert "$d/rgba.png" -crop "$(convert "$d/alpha.png" -threshold 2% -format "%@" info:)" +repage "$T/cut.png"
}
cutout "$SRC/14145912.jpg"
for w in 600 1000; do
  enc "$T/cut.png" "son-kasik-$w" "$w" 86 -define webp:alpha-quality=90
done

ls -la "$OUT" | awk 'NR>1 && $9 != "." && $9 != ".." {print $5, $9}'
du -ch "$OUT"/*.webp | tail -1

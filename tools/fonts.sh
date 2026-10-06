#!/usr/bin/env bash
# Builds the four self-hosted web fonts in assets/fonts/ from the original
# Google Fonts sources (SIL Open Font License 1.1, see assets/fonts/OFL.txt).
#
#   bash tools/fonts.sh
#
# Needs curl and python3. On first run it makes a venv with fontTools + brotli
# in the cache folder (or set FONT_PY to a python that already has both).
# Sources are cached in $FONT_CACHE (default ~/.cache/cupistan-fonts) and
# checked against the SHA-256 sums below, so a rebuild gives the same bytes.
# assets/fonts/*.woff2 and assets/fonts/OFL.txt are generated: do not edit.
#
# What the site uses, and what each file keeps:
#   coiny-tr.woff2            Coiny 400
#   dm-mono-tr.woff2          DM Mono 400
#   fraunces-tr.woff2         Fraunces roman,  axes opsz 9-144, wght 300-700, WONK 0-1
#   fraunces-italic-tr.woff2  Fraunces italic, axes opsz 9-144, wght 300-700, WONK 0-1
# SOFT is pinned to 100 (the CSS never uses another value). opsz keeps the full
# range because body text is italic at 17-21px with font-optical-sizing auto;
# cutting it to 72-144 saved only ~2-3 KB per file and changes small text.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="${FONT_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/cupistan-fonts}"
OUT="$ROOT/assets/fonts"
GF="https://raw.githubusercontent.com/google/fonts/main/ofl"
mkdir -p "$CACHE/src" "$OUT"
# fontTools stamps head.modified with the build time; fix it so rebuilds are byte-identical.
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1767225600}" # 2026-01-01
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Turkish + English. Code points a font does not draw are skipped (none of the
# three has the arrows U+2190-2199 or U+2665, DM Mono has no U+20BA); the
# browser takes those from the next font in the CSS stack, as it did before.
UNICODES="U+0020-007E,U+00A0-00FF,U+011E-011F,U+0130-0131,U+015E-015F"
UNICODES+=",U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+20BA"
UNICODES+=",U+2190-2199,U+2665"
# None of the fonts has a Turkish locl. rvrn must stay: Fraunces swaps its
# wonky h m n s (roman) and b d h k l v w (italic) for the straight forms
# through rvrn when WONK < 0.5 or opsz < ~22.
FEATURES="kern,liga,calt,rvrn"
# 0-6 plus the licence fields; fvar/STAT axis names are kept automatically.
NAME_IDS="0,1,2,3,4,5,6,13,14"

PY="${FONT_PY:-$CACHE/venv/bin/python}"
if ! "$PY" -I -c 'import fontTools, brotli' 2>/dev/null; then
  python3 -m venv "$CACHE/venv"
  "$CACHE/venv/bin/pip" install -q 'fonttools==4.66.1' 'brotli==1.2.0'
  PY="$CACHE/venv/bin/python"
fi

sha256() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }

get() { # <path under ofl/> <sha256> <cache name>
  local dst="$CACHE/src/$3"
  if [ ! -s "$dst" ]; then
    curl -sfL --retry 3 -o "$dst.part" "$GF/$1"
    mv "$dst.part" "$dst"
  fi
  if [ "$(sha256 "$dst")" != "$2" ]; then
    echo "fonts.sh: $1 does not match its checksum (upstream changed?)." >&2
    echo "Check the new file, then update the sum in tools/fonts.sh or delete $dst." >&2
    exit 1
  fi
}

get 'fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf' \
  177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb Fraunces.ttf
get 'fraunces/Fraunces-Italic%5BSOFT,WONK,opsz,wght%5D.ttf' \
  b24448c43702fac4ee856781d461a0dfba8d8e594b6e8e190234b75fed2c0e01 Fraunces-Italic.ttf
get 'coiny/Coiny-Regular.ttf' \
  ef02d723a54abe4819bea54ea8b2ecf72d77d258010bb336cd4862a37705eac7 Coiny-Regular.ttf
get 'dmmono/DMMono-Regular.ttf' \
  55b4c98f123daebb3ed27947ba47b2af00554fc6284d639a540bcef5e6258ad2 DMMono-Regular.ttf
get 'fraunces/OFL.txt' bdf4c22802eaf804f998195871c6b8938aac2ac14b2d78a8bd66a6f1eced833b OFL-fraunces.txt
get 'coiny/OFL.txt'    5c289da4a19f054ace8e31a144a6a254601898cd7faf9eaa301141afda0adbbe OFL-coiny.txt
get 'dmmono/OFL.txt'   2bada5ea45c3c63b7f1ea1f88ce9672c9e4f0c42b2c3b7378949084fe55a3066 OFL-dmmono.txt

subset() { # <in.ttf> <out name>
  "$PY" -I -m fontTools.subset "$1" \
    --unicodes="$UNICODES" --layout-features="$FEATURES" --name-IDs="$NAME_IDS" \
    --flavor=woff2 --output-file="$TMP/$2"
}

for v in Fraunces:fraunces-tr Fraunces-Italic:fraunces-italic-tr; do
  src="${v%%:*}" name="${v##*:}"
  "$PY" -I -m fontTools.varLib.instancer -q "$CACHE/src/$src.ttf" \
    SOFT=100 wght=300:700 -o "$TMP/$src.ttf"
  subset "$TMP/$src.ttf" "$name.woff2"
done
subset "$CACHE/src/Coiny-Regular.ttf" coiny-tr.woff2
subset "$CACHE/src/DMMono-Regular.ttf" dm-mono-tr.woff2

{
  echo "Fonts in this folder are subsets of the originals, built by tools/fonts.sh:"
  echo "  fraunces-tr.woff2, fraunces-italic-tr.woff2   Fraunces"
  echo "  coiny-tr.woff2                                Coiny"
  echo "  dm-mono-tr.woff2                              DM Mono"
  echo
  for f in fraunces coiny dmmono; do head -n 1 "$CACHE/src/OFL-$f.txt" | tr -d '\r'; done
  tail -n +2 "$CACHE/src/OFL-fraunces.txt" | tr -d '\r'
} > "$TMP/OFL.txt"

# assets/fonts/ holds only what this script makes.
rm -f "$OUT"/*.woff2
mv "$TMP"/*.woff2 "$TMP/OFL.txt" "$OUT/"
ls -l "$OUT"

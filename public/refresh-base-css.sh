#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://javerqa.online}"
OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_FILE="$OUT_DIR/base-site.css"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl no esta instalado" >&2
  exit 1
fi
if ! command -v rg >/dev/null 2>&1; then
  echo "rg (ripgrep) no esta instalado" >&2
  exit 1
fi

echo "[1/3] Leyendo HTML de $BASE_URL"
CSS_URLS=$(curl -s "$BASE_URL" | rg -o '/_next/static/css/[^"'\'' ]+\.css' | sort -u)

if [[ -z "$CSS_URLS" ]]; then
  echo "No se encontraron bundles CSS en $BASE_URL" >&2
  exit 1
fi

echo "[2/3] Descargando y fusionando CSS en $OUT_FILE"
: > "$OUT_FILE"
while IFS= read -r url; do
  echo "/* SOURCE: $BASE_URL$url */" >> "$OUT_FILE"
  curl -s "$BASE_URL$url" >> "$OUT_FILE"
  echo >> "$OUT_FILE"
done <<< "$CSS_URLS"

echo "[3/3] Reescribiendo rutas de assets"
python3 - <<PY
from pathlib import Path
p = Path(r"$OUT_FILE")
css = p.read_text(encoding='utf-8', errors='ignore')
css = css.replace('url(/_next/', f'url({"$BASE_URL"}/_next/')
css = css.replace('url("/_next/', f'url("{"$BASE_URL"}/_next/')
css = css.replace("url('/_next/", f"url('{"$BASE_URL"}/_next/")
css = css.replace('url(../media/', f'url({"$BASE_URL"}/_next/static/media/')
css = css.replace('url("../media/', f'url("{"$BASE_URL"}/_next/static/media/')
css = css.replace("url('../media/", f"url('{"$BASE_URL"}/_next/static/media/")
p.write_text(css, encoding='utf-8')
print('Listo. bytes:', p.stat().st_size)
PY

echo "Completado: $OUT_FILE"

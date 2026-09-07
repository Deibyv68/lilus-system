#!/usr/bin/env bash
#
# Manda la copia diaria a R2. Lo llama el cron; también se puede a mano.
#
# Las credenciales salen de .env.r2 y NO del .env de la aplicación: la
# tienda lee del disco, y solo este respaldo habla con R2. Mezclarlos haría
# que la tienda empezara a depender de la nube sin que nadie lo decidiera.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

[ -f .env.r2 ] || { echo "falta $RAIZ/.env.r2"; exit 1; }
set -a; . ./.env.r2; set +a
DATABASE_URL="$(grep -oP '(?<=^DATABASE_URL=).*' .env | tr -d '"'"'"'"')"
export DATABASE_URL

exec npx tsx scripts/respaldar-en-r2.ts "$@"

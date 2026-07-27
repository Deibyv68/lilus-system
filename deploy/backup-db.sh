#!/usr/bin/env bash
# Respaldo de la base de datos de LILUS.
#
# Usa el comando .backup de sqlite3 (no cp) porque es seguro con la base
# en uso: bloquea, copia consistente y libera. Copiar el archivo a mano
# mientras el servidor escribe puede dejar un respaldo corrupto.
#
# Uso:
#   ./backup-db.sh            → respaldo horario
#   ./backup-db.sh daily      → respaldo diario
#   ./backup-db.sh pre-deploy → respaldo antes de un deploy

set -euo pipefail

KIND="${1:-hourly}"
BACKUP_ROOT="$HOME/lilus-backups"
DEST="$BACKUP_ROOT/$KIND"
STAMP="$(date +%Y%m%d-%H%M%S)"

# Cuántos respaldos conservar de cada tipo
case "$KIND" in
  hourly)     KEEP=24 ;;
  daily)      KEEP=30 ;;
  pre-deploy) KEEP=20 ;;
  *)          KEEP=10 ;;
esac

# Ruta de la base: se lee de DATABASE_URL en .env para que siga
# funcionando si algún día cambiamos dónde vive el archivo.
APP_DIR="$HOME/lilus-system"
ENV_FILE="$APP_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ No existe $ENV_FILE" >&2
  exit 1
fi

DB_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'")
DB_PATH="${DB_URL#file:}"

# Si es relativa, Prisma la resuelve desde prisma/, no desde la raíz
if [[ "$DB_PATH" != /* ]]; then
  DB_PATH="$APP_DIR/prisma/${DB_PATH#./}"
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "✗ La base no existe en: $DB_PATH" >&2
  exit 1
fi

mkdir -p "$DEST"
OUT="$DEST/lilus-$STAMP.db"

# .backup falla con "database is locked" si la app está escribiendo justo en
# ese instante. Con .timeout sqlite espera en vez de rendirse, y aun así
# reintentamos por si la escritura se alarga: un respaldo que falla en
# silencio es peor que uno que tarda unos segundos.
BACKED_UP=0
for attempt in 1 2 3; do
  if sqlite3 "$DB_PATH" ".timeout 10000" ".backup '$OUT'" 2>/tmp/lilus-backup-err; then
    BACKED_UP=1
    break
  fi
  echo "  intento $attempt fallo: $(cat /tmp/lilus-backup-err)" >&2
  sleep 3
done

if [[ "$BACKED_UP" -ne 1 ]]; then
  echo "✗ No se pudo respaldar $DB_PATH tras 3 intentos" >&2
  rm -f "$OUT"
  exit 1
fi

gzip -f "$OUT"
OUT="$OUT.gz"

# Verificar que el respaldo no salió vacío
SIZE=$(stat -c%s "$OUT")
if [[ "$SIZE" -lt 1000 ]]; then
  echo "✗ Respaldo sospechosamente pequeño ($SIZE bytes): $OUT" >&2
  exit 1
fi

# Rotación: borrar los más viejos que excedan KEEP
mapfile -t OLD < <(ls -1t "$DEST"/lilus-*.db.gz 2>/dev/null | tail -n +$((KEEP + 1)))
for f in "${OLD[@]:-}"; do
  [[ -n "$f" ]] && rm -f "$f"
done

echo "✓ $KIND: $(basename "$OUT") ($((SIZE / 1024)) KB) · origen: $DB_PATH"

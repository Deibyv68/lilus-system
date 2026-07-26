#!/usr/bin/env bash
# Aplicar últimos cambios del repo al servidor en producción.
#
# Uso:
#   sudo ./deploy/update.sh

set -euo pipefail

APP_USER="${SUDO_USER:-$USER}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$EUID" -ne 0 ]]; then
  echo "✗ Necesita sudo. Re-ejecuta: sudo ./deploy/update.sh"
  exit 1
fi

cd "$APP_DIR"

# ─────────────────────────────────────────────────────────────
# 0) Respaldo de la base ANTES de tocar nada.
#
# El 25/05/2026 un deploy recreó la base vacía y se perdieron los
# pedidos. Si el respaldo falla, el deploy se aborta: es preferible
# no actualizar a actualizar sin red de seguridad.
# ─────────────────────────────────────────────────────────────
echo "─── 0) Respaldo previo de la base ───"
if ! sudo -u "$APP_USER" "$APP_DIR/deploy/backup-db.sh" pre-deploy; then
  echo ""
  echo "✗ El respaldo falló. Deploy ABORTADO."
  echo "  Revisa deploy/backup-db.sh antes de reintentar."
  exit 1
fi

# Guardamos dónde vive la base y su tamaño para comprobar después
DB_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"'"'")
DB_PATH="${DB_URL#file:}"
[[ "$DB_PATH" != /* ]] && DB_PATH="$APP_DIR/prisma/${DB_PATH#./}"
DB_ROWS_BEFORE=$(sudo -u "$APP_USER" sqlite3 "$DB_PATH" 'SELECT COUNT(*) FROM "Order";' 2>/dev/null || echo "0")
echo "  Base: $DB_PATH ($DB_ROWS_BEFORE pedidos)"

echo ""
echo "─── 1) git pull ───"
sudo -u "$APP_USER" git pull --rebase

echo ""
echo "─── 2) Instalar nuevas dependencias ───"
sudo -u "$APP_USER" npm install --no-audit --no-fund

echo ""
echo "─── 3) Aplicar migraciones (si hay) ───"
sudo -u "$APP_USER" npx prisma migrate deploy
sudo -u "$APP_USER" npx prisma generate

# Comprobación post-migración: si la base perdió pedidos, algo salió mal
DB_ROWS_AFTER=$(sudo -u "$APP_USER" sqlite3 "$DB_PATH" 'SELECT COUNT(*) FROM "Order";' 2>/dev/null || echo "0")
if [[ "$DB_ROWS_AFTER" -lt "$DB_ROWS_BEFORE" ]]; then
  echo ""
  echo "✗ ALERTA: los pedidos bajaron de $DB_ROWS_BEFORE a $DB_ROWS_AFTER."
  echo "  La migración pudo haber recreado la base. Deploy DETENIDO."
  echo "  Restaura con:  ls -t ~/lilus-backups/pre-deploy/ | head -1"
  exit 1
fi
echo "  ✓ Integridad OK ($DB_ROWS_AFTER pedidos)"

echo ""
echo "─── 4) Rebuild ───"
sudo -u "$APP_USER" npm run build

echo ""
echo "─── 5) Reiniciar servicios ───"
systemctl restart lilus.service
# El tunnel no hace falta reiniciarlo, sigue apuntando al mismo puerto

sleep 2
systemctl is-active --quiet lilus.service && echo "✓ LILUS actualizado y corriendo" || (echo "✗ LILUS no arrancó, revisa: journalctl -u lilus.service -n 100"; exit 1)

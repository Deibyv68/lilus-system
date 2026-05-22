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

echo "─── 1) git pull ───"
sudo -u "$APP_USER" git pull --rebase

echo ""
echo "─── 2) Instalar nuevas dependencias ───"
sudo -u "$APP_USER" npm install --no-audit --no-fund

echo ""
echo "─── 3) Aplicar migraciones (si hay) ───"
sudo -u "$APP_USER" npx prisma migrate deploy
sudo -u "$APP_USER" npx prisma generate

echo ""
echo "─── 4) Rebuild ───"
sudo -u "$APP_USER" npm run build

echo ""
echo "─── 5) Reiniciar servicios ───"
systemctl restart lilus.service
# El tunnel no hace falta reiniciarlo, sigue apuntando al mismo puerto

sleep 2
systemctl is-active --quiet lilus.service && echo "✓ LILUS actualizado y corriendo" || (echo "✗ LILUS no arrancó, revisa: journalctl -u lilus.service -n 100"; exit 1)

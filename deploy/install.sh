#!/usr/bin/env bash
# Instalador del sistema LILUS en Linux Mint / Ubuntu / Debian.
# Idempotente: lo puedes correr varias veces sin romper nada.
#
# Uso (desde la carpeta del repo clonado):
#   chmod +x deploy/install.sh
#   ./deploy/install.sh

set -euo pipefail

APP_USER="${SUDO_USER:-$USER}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "▶ Usuario:      $APP_USER"
echo "▶ Carpeta app:  $APP_DIR"
echo ""

if [[ "$EUID" -ne 0 ]]; then
  echo "✗ Este script necesita sudo (apt + systemd). Re-ejecuta con: sudo ./deploy/install.sh"
  exit 1
fi

echo "─── 1) Instalar Node.js 22 LTS si no está ───"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
else
  echo "  ✓ Node ya instalado: $(node -v)"
fi

echo ""
echo "─── 2) Instalar git, build-essential, sqlite3 ───"
apt-get install -y git build-essential sqlite3 ca-certificates curl

echo ""
echo "─── 3) Instalar cloudflared si no está ───"
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
    > /etc/apt/sources.list.d/cloudflared.list
  apt-get update
  apt-get install -y cloudflared
else
  echo "  ✓ cloudflared ya instalado: $(cloudflared --version | head -1)"
fi

echo ""
echo "─── 4) Instalar dependencias npm ───"
cd "$APP_DIR"
sudo -u "$APP_USER" npm install --no-audit --no-fund

echo ""
echo "─── 5) Generar cliente Prisma y aplicar migraciones ───"
sudo -u "$APP_USER" npx prisma generate
sudo -u "$APP_USER" npx prisma migrate deploy
# Seed inicial solo si la BD está vacía
if ! sudo -u "$APP_USER" sqlite3 "$APP_DIR/prisma/dev.db" "SELECT 1 FROM ShippingZone LIMIT 1;" >/dev/null 2>&1; then
  echo "  → BD vacía, ejecutando seed inicial"
  sudo -u "$APP_USER" npm run db:seed || true
fi

echo ""
echo "─── 6) Build de producción ───"
sudo -u "$APP_USER" npm run build

echo ""
echo "─── 7) Instalar servicios systemd ───"
# Reemplazar placeholders en los .service y copiar
sed -e "s|__USER__|$APP_USER|g" -e "s|__APP_DIR__|$APP_DIR|g" \
  "$APP_DIR/deploy/lilus.service" > /etc/systemd/system/lilus.service
sed -e "s|__USER__|$APP_USER|g" -e "s|__APP_DIR__|$APP_DIR|g" \
  "$APP_DIR/deploy/cloudflared.service" > /etc/systemd/system/cloudflared-lilus.service

systemctl daemon-reload
systemctl enable lilus.service
systemctl enable cloudflared-lilus.service
systemctl restart lilus.service
systemctl restart cloudflared-lilus.service

echo ""
echo "─── 8) Verificación ───"
sleep 3
systemctl is-active --quiet lilus.service && echo "  ✓ lilus.service: corriendo" || echo "  ✗ lilus.service: NO está corriendo"
systemctl is-active --quiet cloudflared-lilus.service && echo "  ✓ cloudflared-lilus.service: corriendo" || echo "  ✗ cloudflared-lilus.service: NO está corriendo"

echo ""
echo "════════════════════════════════════════════════════════════"
echo " ✓ LILUS desplegado"
echo "════════════════════════════════════════════════════════════"
echo ""
echo " Local:        http://localhost:3000"
echo ""
echo " URL pública (Cloudflare Tunnel):"
echo " Ejecuta esto para verla:"
echo "   journalctl -u cloudflared-lilus.service -n 50 | grep trycloudflare"
echo ""
echo " Logs en vivo:"
echo "   journalctl -u lilus.service -f"
echo "   journalctl -u cloudflared-lilus.service -f"
echo ""

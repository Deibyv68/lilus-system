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
# Cuenta los pedidos esperando si la base está ocupada. Sin el timeout,
# una consulta contra la base bloqueada devuelve vacío y la comprobación de
# integridad de más abajo dispara una falsa alarma de pérdida de datos.
count_orders() {
  sudo -u "$APP_USER" sqlite3 "$DB_PATH" '.timeout 15000' \
    'SELECT COUNT(*) FROM "Order";' 2>/dev/null
}

DB_ROWS_BEFORE=$(count_orders)
echo "  Base: $DB_PATH ($DB_ROWS_BEFORE pedidos)"

echo ""
echo "─── 1) git pull ───"

# El npm de esta laptop reescribe `package-lock.json` en cada instalación
# —su versión no escribe los campos `libc` que sí escribe la de
# desarrollo— así que el archivo aparece modificado sin que nadie lo haya
# tocado, y el `git pull` se aborta en cuanto un commit lo cambia. Ya
# pasó: dejó el sitio a medias.
#
# Es un archivo generado y el del repositorio es el bueno, así que se
# descarta esa deriva antes de traer nada. Solo ese archivo: cualquier
# otro cambio local sigue frenando el despliegue, que es lo correcto —
# significaría que alguien editó el código aquí y hay que mirarlo.
if ! sudo -u "$APP_USER" git diff --quiet -- package-lock.json; then
  echo "  package-lock.json venía modificado por npm: se descarta"
  sudo -u "$APP_USER" git checkout -- package-lock.json
fi

sudo -u "$APP_USER" git pull --rebase

echo ""
echo "─── 2) Instalar nuevas dependencias ───"
sudo -u "$APP_USER" npm install --no-audit --no-fund

echo ""
echo "─── 3) Aplicar migraciones (si hay) ───"
sudo -u "$APP_USER" npx prisma migrate deploy
sudo -u "$APP_USER" npx prisma generate

# Comprobación post-migración: si la base perdió pedidos, algo salió mal
DB_ROWS_AFTER=$(count_orders)

# Si no pudimos leer, avisamos pero no damos por perdidos los datos: un
# conteo vacío significa que no se pudo consultar, no que haya cero pedidos.
if [[ -z "$DB_ROWS_BEFORE" || -z "$DB_ROWS_AFTER" ]]; then
  echo "  ⚠ No se pudo verificar la integridad (base ocupada)."
  echo "    Revisa a mano:  sqlite3 $DB_PATH 'SELECT COUNT(*) FROM \"Order\";'"
elif [[ "$DB_ROWS_AFTER" -lt "$DB_ROWS_BEFORE" ]]; then
  echo ""
  echo "✗ ALERTA: los pedidos bajaron de $DB_ROWS_BEFORE a $DB_ROWS_AFTER."
  echo "  La migración pudo haber recreado la base. Deploy DETENIDO."
  echo "  Restaura con:  ls -t ~/lilus-backups/pre-deploy/ | head -1"
  exit 1
else
  echo "  ✓ Integridad OK ($DB_ROWS_AFTER pedidos)"
fi

echo ""
echo "─── 3.5) Revisar la configuración de la tienda ───"
# Avisa, no aborta. Que falte el correo no es motivo para dejar el sistema
# sin actualizar: la tienda sigue tomando pedidos igual. Pero tiene que
# decirse en voz alta, porque el sintoma —"no me llegan los avisos"— no
# apunta solo a su causa.
faltan=()
grep -qE '^APP_URL=.+' "$APP_DIR/.env" || faltan+=("APP_URL (los enlaces de los correos salen rotos sin esto)")
grep -qE '^SMTP_HOST=.+' "$APP_DIR/.env" || faltan+=("SMTP_HOST")
grep -qE '^SMTP_USER=.+' "$APP_DIR/.env" || faltan+=("SMTP_USER")
grep -qE '^SMTP_PASS=.+' "$APP_DIR/.env" || faltan+=("SMTP_PASS")

if [[ ${#faltan[@]} -gt 0 ]]; then
  echo "  ⚠ Falta configurar en .env:"
  for f in "${faltan[@]}"; do echo "      - $f"; done
  echo "    Sin esto NO salen los avisos de pedido nuevo, ni al cliente ni a"
  echo "    la dueña. Los pedidos se siguen guardando: hay que mirar el panel."
  echo "    Ver .env.example para el detalle."
else
  echo "  ✓ Correo y APP_URL configurados"
fi

echo ""
echo "─── 4) Rebuild ───"
sudo -u "$APP_USER" npm run build

echo ""
echo "─── 5) Reiniciar servicios ───"
systemctl restart lilus.service
# El tunnel no hace falta reiniciarlo, sigue apuntando al mismo puerto

sleep 2
systemctl is-active --quiet lilus.service && echo "✓ LILUS actualizado y corriendo" || (echo "✗ LILUS no arrancó, revisa: journalctl -u lilus.service -n 100"; exit 1)

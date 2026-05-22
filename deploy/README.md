# Deploy LILUS — Laptop Linux Mint 24/7 + Cloudflare Tunnel

Guía paso a paso para dejar el sistema corriendo siempre, accesible desde
internet con HTTPS, sin pagar nada.

## Lo que vas a tener al final

- La app corriendo como servicio de systemd → arranca sola al prender la laptop
- Cloudflare Tunnel expone tu app con una URL pública tipo
  `https://random-name.trycloudflare.com`
- HTTPS automático, sin abrir puertos en tu router
- Actualizaciones futuras: 1 comando (`sudo ./deploy/update.sh`)

---

## Paso 1 — Subir el código a GitHub (desde tu PC de desarrollo)

Para poder clonar el repo en la laptop necesitamos que viva en GitHub.

### 1.1 Crea un repo privado

1. Entra a <https://github.com/new>
2. **Repository name**: `lilus-system`
3. **Private** ✓
4. NO marques nada más (sin README, sin .gitignore, sin license — ya los tienes)
5. Click *Create repository*

### 1.2 Sube el código (en la PC de desarrollo, en la carpeta del proyecto)

GitHub te muestra los comandos. Son estos (reemplaza `TU-USUARIO`):

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/lilus-system.git
git push -u origin main
```

> Si te pide login y tienes 2FA activado, usa un *Personal Access Token* en
> lugar de la contraseña: <https://github.com/settings/tokens>

---

## Paso 2 — Preparar la laptop Linux Mint

### 2.1 Conéctate por SSH (con Termius como ya haces)

### 2.2 Clona el repo

Vamos a usarlo desde tu home, por ejemplo `~/lilus-system`:

```bash
cd ~
git clone https://github.com/TU-USUARIO/lilus-system.git
cd lilus-system
```

Si el repo es privado, GitHub te va a pedir credenciales. Usa **Personal Access
Token** como contraseña.

### 2.3 Crea el archivo `.env` de producción

```bash
cat > .env <<'EOF'
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="production"
EOF
```

### 2.4 Ejecuta el instalador

```bash
chmod +x deploy/install.sh
sudo ./deploy/install.sh
```

Esto va a:
- Instalar Node.js 22, git, cloudflared
- `npm install` + `prisma migrate deploy` + `next build`
- Crear servicios systemd `lilus.service` y `cloudflared-lilus.service`
- Arrancar ambos servicios

Tardará 3-5 min la primera vez.

---

## Paso 3 — Obtener la URL pública de tu sistema

```bash
journalctl -u cloudflared-lilus.service -n 50 | grep trycloudflare
```

Te mostrará algo así:

```
INF +--------------------------------------------------------------------------------------------+
INF |  Your quick Tunnel has been created! Visit it at:                                          |
INF |  https://random-name-123.trycloudflare.com                                                 |
INF +--------------------------------------------------------------------------------------------+
```

**Esa es la URL** para acceder al sistema desde cualquier lugar.

⚠ La URL de Quick Tunnel **cambia cada vez que se reinicia cloudflared**. Más
abajo te explico cómo dejarla fija con un dominio propio cuando estés listo.

---

## Operación diaria

### Ver logs en vivo

```bash
# Logs de la app
journalctl -u lilus.service -f

# Logs del túnel (URL pública, errores de red)
journalctl -u cloudflared-lilus.service -f
```

### Reiniciar manualmente

```bash
sudo systemctl restart lilus.service
sudo systemctl restart cloudflared-lilus.service
```

### Actualizar con cambios nuevos

Cuando hagas cambios en tu PC de desarrollo:

```bash
# En tu PC:
git add . && git commit -m "..." && git push

# En la laptop Linux:
cd ~/lilus-system
sudo ./deploy/update.sh
```

### Backup de la base de datos

```bash
# Manual
cp ~/lilus-system/prisma/dev.db ~/backups/lilus-$(date +%Y%m%d-%H%M).db

# Backup automático diario con cron
crontab -e
# Pega esta línea:
0 3 * * * cp ~/lilus-system/prisma/dev.db ~/backups/lilus-$(date +\%Y\%m\%d).db
```

También copia periódicamente la carpeta `public/uploads/` (imágenes y PDFs de
etiquetas).

---

## Cambiar a un dominio propio (más adelante)

Cuando tengas un dominio gestionado por Cloudflare (gratis si lo registras
también ahí), reemplazamos el Quick Tunnel por un "Named Tunnel" con URL fija.

Cuando llegue ese momento, dime y te paso los comandos.

---

## Troubleshooting

### "La URL no responde"

```bash
# ¿LILUS está corriendo?
systemctl status lilus.service

# ¿El tunnel está conectado?
systemctl status cloudflared-lilus.service

# Probar local
curl -I http://localhost:3000
```

### "Después de reiniciar la laptop no arranca solo"

```bash
sudo systemctl enable lilus.service
sudo systemctl enable cloudflared-lilus.service
```

### "Quiero ver qué PID está usando el puerto 3000"

```bash
sudo lsof -i :3000
```

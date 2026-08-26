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
cp .env.example .env
nano .env
```

Como mínimo tiene que quedar así:

```env
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="production"

# La dirección pública. Es la que va en los enlaces de los correos, así
# que tiene que ser la URL real por la que entra la gente — no localhost.
APP_URL="https://lo-que-diga-el-tunel.trycloudflare.com"

# Correo. Sin esto la tienda funciona, pero no avisa a nadie cuando entra
# un pedido. Ver .env.example para cómo sacar la contraseña de aplicación
# de Gmail.
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-correo@gmail.com"
SMTP_PASS="la-contraseña-de-aplicación"
MAIL_FROM="LILUS <tu-correo@gmail.com>"
MAIL_ADMIN="tu-correo@gmail.com"
```

> **La contraseña de aplicación no es la de tu cuenta.** Se genera aparte en
> <https://myaccount.google.com/apppasswords> y requiere tener activada la
> verificación en dos pasos. La contraseña normal de Gmail no funciona aquí.

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

Esa URL ahora sirve **dos sitios distintos**:

| Dirección | Qué es | Quién entra |
|---|---|---|
| `https://…/` | La tienda | Cualquiera |
| `https://…/sistema` | El panel | Solo con usuario y contraseña |

El acceso directo que tenga guardado quien usa el sistema tiene que apuntar
a **`/sistema`**, no a la raíz: la raíz ahora es la tienda.

⚠ La URL de Quick Tunnel **cambia cada vez que se reinicia cloudflared**, y
eso ahora duele más que antes:

- Hay que actualizar `APP_URL` en `.env` y reconstruir, o los correos que se
  manden llevarán enlaces a una dirección muerta.
- Los enlaces `/pedido/<token>` que ya se enviaron a clientes **dejan de
  funcionar**. El pedido sigue existiendo, pero esa persona ya no puede
  verlo.

Mientras la tienda no reciba pedidos de verdad, es un inconveniente. En
cuanto empiece a venderse, esto pasa a ser el motivo principal para comprar
el dominio.

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

### Backup

Usa el script, no `cp`:

```bash
~/lilus-system/deploy/backup-db.sh daily
```

**No copies el archivo con `cp` mientras el servidor corre.** SQLite puede
estar a mitad de una escritura y la copia sale corrupta — y lo peor de un
respaldo corrupto es que parece bueno hasta el día que lo necesitas. El
script usa el comando `.backup` de sqlite3, que bloquea, copia consistente
y libera.

Además del archivo de la base, el script guarda **las fotos de productos y
los PDF de etiqueta** en `~/lilus-backups/uploads/`. Esa carpeta es lo único
verdaderamente irreemplazable: la base se puede volver a sembrar, una foto
borrada no vuelve. Se copia sin borrar nada, así que lo que entra ahí se
queda aunque se borre del sitio.

Automático, con cron:

```bash
crontab -e
```

```cron
0 * * * * ~/lilus-system/deploy/backup-db.sh hourly
30 3 * * * ~/lilus-system/deploy/backup-db.sh daily
```

Se conservan 24 respaldos horarios y 30 diarios; los viejos se borran solos.
`deploy/update.sh` hace uno más antes de cada despliegue y **aborta si el
respaldo falla**.

> Todo esto vive en la misma laptop. Si se le muere el disco, se van los
> respaldos con ella. Vale la pena copiar `~/lilus-backups/` a otro lado de
> vez en cuando — un disco externo o Google Drive alcanzan.

---

## Cambiar a un dominio propio

Mientras la tienda esté abierta al público, esto deja de ser opcional: la
URL del Quick Tunnel cambia en cada reinicio y se lleva por delante los
enlaces que ya se mandaron a clientes.

Necesitas el dominio con su DNS gestionado por Cloudflare (si lo registras
ahí ya viene así; si lo compraste en otro lado, se transfiere el DNS gratis).

```bash
# 1) Autorizar cloudflared en tu cuenta. Abre un enlace en el navegador.
cloudflared tunnel login

# 2) Crear el túnel con nombre. Se hace UNA vez.
cloudflared tunnel create lilus

# 3) Apuntar el dominio al túnel.
cloudflared tunnel route dns lilus tudominio.com
```

Luego se le dice al túnel qué servir, en `~/.cloudflared/config.yml`:

```yaml
tunnel: lilus
credentials-file: /home/TU-USUARIO/.cloudflared/<id-del-tunel>.json

ingress:
  - hostname: tudominio.com
    service: http://localhost:3000
  - service: http_status:404
```

Y se cambia el servicio para que use esa configuración en vez de la URL
suelta — en `deploy/cloudflared.service`, reemplaza la línea `ExecStart`:

```ini
ExecStart=/usr/local/bin/cloudflared tunnel run lilus
```

```bash
sudo cp deploy/cloudflared.service /etc/systemd/system/cloudflared-lilus.service
sudo systemctl daemon-reload
sudo systemctl restart cloudflared-lilus.service
```

**No olvides lo último**: cambiar `APP_URL` en `.env` al dominio nuevo y
reconstruir (`sudo ./deploy/update.sh`). Si no, los correos van a seguir
mandando enlaces a la dirección vieja.

### Proteger el panel un nivel más

Con dominio propio puedes poner **Cloudflare Access** delante de `/sistema`:
una pantalla de acceso de Cloudflare *antes* de que la petición llegue a tu
laptop. Se configura en el panel de Cloudflare (Zero Trust → Access →
Applications) sobre la ruta `tudominio.com/sistema`.

La tienda queda abierta y el panel pasa a tener dos puertas en vez de una.
No reemplaza al login del sistema: se suma.

---

## Las dos bases de datos

Esto es lo que más fácil se presta a perder trabajo, así que conviene tenerlo
claro de una vez.

**Hay dos bases y no se hablan entre ellas:**

| | Dónde | Qué tiene |
|---|---|---|
| **Producción** | La laptop, en `~/lilus-system/prisma/dev.db` | Los pedidos de verdad, los clientes de verdad, las fotos de verdad |
| **Desarrollo** | Tu PC, en `prisma/dev.db` | Datos de prueba |

`git pull` mueve **código y migraciones**, nunca datos. Eso es a propósito y
es lo correcto — pero tiene dos consecuencias que sorprenden:

- Las fotos que subas entrando por la URL pública quedan en **la laptop**, y
  en tu PC de desarrollo no aparecen nunca.
- Los productos que crees en tu PC no llegan a producción. Para que existan
  allá, hay que crearlos allá.

### La regla que no se rompe

> **Nunca copies la base de desarrollo hacia producción.**

Copiar `dev.db` de tu PC a la laptop borra todos los pedidos reales. Ya pasó
algo parecido el 25/05/2026 y es la razón de que `update.sh` respalde antes
de tocar nada.

En la dirección contraria sí, cuando quieras trabajar con datos reales:

```bash
# Desde tu PC, traerse una copia de produccion para desarrollar
scp usuario@laptop:~/lilus-system/prisma/dev.db ./prisma/dev.db
scp -r usuario@laptop:~/lilus-system/public/uploads ./public/
```

Eso te deja el catálogo real en local. Lo que hagas ahí no afecta a
producción — es una copia.

### Dónde cargar el catálogo, entonces

En producción, entrando por la URL pública a `/sistema`. Es donde vive el
negocio. Tu PC es para escribir código.

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

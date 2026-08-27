# LILUS para Android

La app del sistema. **No es una copia del panel**: es una ventana al mismo
servidor, con las dos o tres cosas que se hacen de pie hechas en nativo.

```
App
├── Entrar            nativo   ·  el mismo usuario y clave del panel web
├── Pedidos           nativo   ·  lista, aviso de cobro, "marcar pagado"
├── Avisos            nativo   ·  Firebase, conexión propia
└── Todo lo demás     WebView  ·  el panel de siempre, ya con sesión
```

## Por qué existe

La PWA ya recibe avisos, pero por la conexión que mantiene Chrome. En
teléfonos con MIUI, HyperOS o EMUI el sistema mata a Chrome en segundo
plano y con él se va la conexión: el aviso no llega hasta que alguien abre
el navegador.

Esta app tiene su propia conexión con Firebase, registrada a su nombre. Se
le puede dar exención de batería como app, que es lo que el sistema
entiende.

## Lo que NO tiene

**Base de datos.** Ni una tabla. Los pedidos que se ven acaban de llegar
del servidor y se olvidan al cerrar. Una copia local significaría dos
verdades que se pueden separar — el pedido que en el teléfono sigue
pendiente y en la laptop ya está pagado.

**Login propio.** Usa las mismas filas de `Session` que el navegador.
Cerrar la sesión de alguien desde el panel también lo saca de la app.

**Las 33 pantallas del panel.** El recetario, el inventario y la
configuración se usan sentada y con calma: ahí un WebView no se distingue
de lo nativo, y copiarlas sería duplicar meses de trabajo para no ganar
nada.

## Compilar el APK

Hace falta el SDK de Android y un JDK 17+. Si tienes Android Studio
instalado, ya tienes los dos.

```bash
cd app-movil
npm install
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
npx expo prebuild --platform android --no-install
cd android && ./gradlew assembleRelease
```

Sale en `android/app/build/outputs/apk/release/app-release.apk`.

### Instalarlo

Copia el APK al teléfono y ábrelo; Android pedirá permiso para instalar de
origen desconocido. O por cable:

```bash
adb install -r app-release.apk
```

**No hace falta cuenta de Google Play.** El APK va firmado con
`android/app/lilus.keystore`, que está en el repositorio.

> **Esa llave no se puede perder.** Android identifica una app por su
> paquete más su firma. Un APK firmado con otra llave no se instala encima
> del anterior: hay que desinstalar la app primero, y con ella se va la
> sesión y los permisos.

## Los avisos: falta un paso que no puedo dar yo

La app compila y funciona sin esto, pero **no recibirá avisos** hasta que
exista un proyecto de Firebase. Hay que crearlo en la consola de Google —
no se puede generar desde el código.

1. Entra a <https://console.firebase.google.com> y crea un proyecto
2. Añade una app **Android** con el paquete exacto `ec.lilus.sistema`
3. Descarga `google-services.json` y déjalo en `app-movil/`
4. En *Configuración del proyecto → Cuentas de servicio*, genera una clave
   privada nueva. Baja un JSON con `project_id`, `client_email` y
   `private_key`

Del segundo JSON salen tres líneas para el `.env` **del servidor**:

```bash
FCM_PROJECT_ID=...
FCM_CLIENT_EMAIL=...
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

La `private_key` va entre comillas y con los `\n` tal como vienen en el
JSON.

Después:

```bash
# en el servidor
sudo systemctl restart lilus.service

# aquí, para que el APK incluya Firebase
npx expo prebuild --platform android --no-install
cd android && ./gradlew assembleRelease
```

`app.config.js` detecta solo si `google-services.json` existe. No hay que
acordarse de tocar nada más.

## Solo HTTPS

Android bloquea el tráfico sin cifrar y **no se le hizo una excepción a
propósito**: la app lleva un token de sesión en cada petición, y mandarlo
en claro por el wifi del local sería regalarlo.

O sea que la dirección del servidor tiene que empezar por `https://`. La de
Tailscale ya lo cumple, y el dominio propio también lo cumplirá.

## Cambiar de servidor

La dirección se edita desde la pantalla de entrada — *Cambiar servidor*.
Está ahí porque va a cambiar el día que se compre el dominio, y si
estuviera quemada en el código habría que recompilar el APK y reinstalarlo
en cada teléfono.

# LILUS Print Agent

Servicio Windows que pregunta al servidor LILUS si hay etiquetas pendientes
de imprimir, y las envía a la impresora térmica MUNBYN conectada por USB-C.

## Cómo funciona (en 1 minuto)

```
[Usuario en celular]
    ↓ pulsa "Imprimir"
[LILUS en la laptop del 2do piso]
    ↓ guarda PrintJob en la BD
[PC con la impresora ← este agente]
    ↓ pregunta cada 2 seg
    ← recibe job, genera PDF temp, imprime
[MUNBYN] → sale el papel
```

El agente **solo hace salidas**: le pregunta al servidor, el servidor nunca le
toca la puerta. No expone puertos ni hay que tocar el router.

## Varias PCs, una impresora que se muda

Se puede instalar el agente en todas las computadoras que quieras. La regla es
simple: **la etiqueta sale en la PC que tenga la impresora enchufada en ese
momento**. No hay que elegir destino ni cambiar nada al mover el cable.

Funciona así: cada agente revisa cada 10 segundos si ve la MUNBYN por USB, y se
lo dice al servidor. La cola solo le entrega trabajos al que la tiene. El que no
la ve pregunta igual, pero siempre se va con las manos vacías.

Consecuencias prácticas:

- **Mover la impresora** es desenchufar y enchufar. En ~10 segundos la otra PC
  queda a cargo. Se ve en Configuración → Agente de impresión, y en `agent.log`
  aparece `🖨 Impresora conectada aquí`.
- **Las dos PCs pueden estar prendidas** sin pisarse. La que no tiene el cable
  no imprime nada.
- **Si imprimes con la impresora desenchufada de las dos**, el trabajo espera en
  la cola y sale cuando la conectes. Pero solo espera **15 minutos**: pasado ese
  rato se marca como fallido, para que al conectarla mañana no salgan de golpe
  todas las etiquetas de ayer.

El token es el mismo en todas las PCs — es el secreto compartido con el
servidor, no un identificador. Quién es cada una sale del nombre de la
computadora en Windows (o de `LILUS_AGENT_NAME` en el `.env`).

## Instalación automática (lo normal)

En la PC nueva, **PowerShell como administrador**, y pegar esto:

```powershell
irm https://raw.githubusercontent.com/Deibyv68/lilus-system/main/print-agent/instalar.ps1 | iex
```

Instala lo que falte (Node, Git, Tailscale), baja el proyecto, arma el `.env`,
registra el servicio y comprueba que el servidor conteste. Lo único que pide es
el **token**, que se copia de LILUS → Configuración → Agente de impresión.

Se puede volver a correr las veces que haga falta: lo que ya está no lo toca, así
que también sirve para reparar una instalación a medias.

Después queda por hacer a mano una sola cosa: **instalar el driver de la MUNBYN**,
que viene con la impresora y no se puede automatizar.

El resto de este documento es el detalle de lo que hace el script, por si algo
falla o hay que hacerlo a mano.

## Requisitos en la PC

1. **Windows 10/11**
2. **Node.js LTS** instalado (<https://nodejs.org/>)
3. **Driver MUNBYN** instalado y la impresora conectada por USB-C (verifica con
   `Get-Printer` en PowerShell que aparezca `Munbyn RW403B-N`)
4. **nssm.exe** copiado en esta carpeta (descarga de <https://nssm.cc/download>,
   versión `win64/nssm.exe`)
5. **Tailscale** instalado y con la misma cuenta que la laptop del servidor

El punto 5 es el que suele fallar. La PC de la impresora y la laptop del servidor
pueden estar en redes distintas —una en la red del primer piso y otra en la del
segundo— y entonces no se ven aunque las dos tengan internet. Tailscale las pone
en la misma red privada sin importar dónde estén.

## Setup paso a paso

### 1. Configurar `.env`

```cmd
copy .env.example .env
notepad .env
```

Completa:

- `LILUS_SERVER_URL`: la dirección fija de Tailscale del servidor,

  ```
  https://deiby-aspire-v5-123.tailb43ebc.ts.net
  ```

  Esta no cambia cuando se reinicia la laptop, a diferencia de las URLs de
  Cloudflare. Si por lo que sea no responde, la IP de Tailscale
  (`http://100.92.162.24:3000`) hace lo mismo y sirve para descartar si el
  problema es el nombre o la conexión.

- `LILUS_AGENT_TOKEN`: **el mismo que ya está en LILUS**, no uno nuevo. Se ve en
  Configuración → Agente de impresión. Si pones uno distinto, el servidor
  responde 401 y no imprime nada.

  Solo si estás montando el sistema desde cero, genera uno con:
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```
  y pégalo en los dos lados.

### 2. Configurar LILUS

Solo si estás montando el sistema desde cero, o si la impresora nueva tiene otro
nombre en Windows. Si estás mudando el agente a otra PC con la misma impresora,
**este paso no se toca**.

En tu LILUS web, ve a `Configuración → Agente de impresión`:

- ✅ Activar agente
- **Token**: el mismo del `.env`
- **Nombre de impresora**: tiene que ser **exacto** al que devuelve `Get-Printer`
  en la PC nueva. El servidor guarda ese nombre en cada trabajo y el agente se lo
  pasa tal cual al driver: si sobra un espacio o cambia una letra, el trabajo
  sale de la cola pero nunca llega al papel.

### 3. Instalar como servicio Windows

Click derecho sobre `install-service.bat` → **Ejecutar como administrador**.

Hace `npm install` y registra el servicio `LILUS-PrintAgent` que:

- Arranca solo al prender la PC (sin necesidad de login)
- Logs en `agent.log` (en esta carpeta)
- Auto-restart si crashea

### 4. Probar

Primero, en LILUS → `Configuración → Agente de impresión`: la PC nueva tiene que
aparecer en la lista, y con la impresora enchufada debe quedar en verde diciendo
"Tiene la impresora — acá sale la etiqueta".

Después, desde el celular: entra a un pedido → "Imprimir etiqueta de envío". En
1-3 seg sale por la MUNBYN.

Si no sale, abre `agent.log` con Notepad y mira el último error.

**No hace falta apagar el agente de la otra PC.** Pueden quedar las dos
corriendo: solo imprime la que tiene el cable.

### 5. Probar el cambio de PC

Desenchufa la MUNBYN de una y enchúfala en la otra. En unos 10 segundos la lista
de Configuración cambia sola de verde, y en el `agent.log` de cada una se ve el
relevo. Imprime otra vez y confirma que sale por la nueva.

## Comandos útiles

```cmd
REM Ver logs en vivo
type agent.log

REM Detener servicio
nssm stop LILUS-PrintAgent

REM Arrancar servicio
nssm start LILUS-PrintAgent

REM Ver estado
sc query LILUS-PrintAgent

REM Desinstalar completo
uninstall-service.bat
```

## Pruebas manuales (sin servicio)

Si quieres probar sin instalarlo como servicio:

```cmd
node agent.js
```

Verás los logs en vivo. `Ctrl+C` para detenerlo.

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No imprime nada" | Token mal o servicio no corriendo | Revisar `agent.log` y `sc query LILUS-PrintAgent` |
| "Error 401 en logs" | Token desincronizado | Verificar que coincida con LILUS |
| "Error contactando servidor" | URL incorrecta o servidor caído | Probar la URL de Tailscale en el navegador de esa misma PC |
| "Impresora no responde" | MUNBYN apagada o cable desconectado | Reconectar y probar `Get-Date \| Out-Printer "Munbyn RW403B-N"` |
| "No imprime en ninguna PC" | Ninguna ve la impresora | Mirar Configuración: si están las dos en ámbar, el cable no hace contacto o la MUNBYN está apagada |
| "El trabajo salió fallido solo" | Esperó más de 15 min sin impresora | Es a propósito, para que no salgan mañana las etiquetas de hoy. Volver a imprimir con la impresora ya conectada |
| "npm.ps1 ... la ejecución de scripts está deshabilitada" | Política de ejecución restringida en esa PC | Ya está resuelto: el instalador llama a `npm.cmd`, que no pasa por PowerShell. Volvé a correr el comando |
| "Las dos PCs con el mismo nombre" | Hostnames iguales en Windows | Poner `LILUS_AGENT_NAME` distinto en el `.env` de cada una |
| "Error contactando servidor" y Tailscale instalado | Las dos máquinas en redes distintas | `ping 100.92.162.24` desde la PC de la impresora. Si no responde, revisar que Tailscale esté conectado con la misma cuenta en ambas |
| "PDF sale con escala raro" | Tamaño de papel no concuerda | El agente usa `scale: noscale` — verifica que la cola Windows tenga el tamaño 4x6 o 2x1 según el caso |

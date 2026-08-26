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

## Solo puede haber UN agente a la vez

El sistema está hecho para una sola impresora. Hay **un token** y **un nombre de
impresora** en Configuración, y la cola le entrega el trabajo más viejo **al
primero que pregunte**, sin mirar quién es.

Si dos PCs corren el agente con el mismo token, cada etiqueta sale en una u otra
según cuál preguntó primero — es una moneda al aire, no se puede elegir. Instalar
en otra PC sirve para **reemplazar** la actual, no para tener las dos a la vez.

Para imprimir desde dos lugares hay que darle identidad a cada agente y poder
elegir el destino al imprimir. Todavía no está hecho.

## Requisitos en la PC

1. **Windows 10/11**
2. **Node.js 22 LTS** instalado (<https://nodejs.org/>)
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

Desde el celular: entra a un pedido → "Imprimir etiqueta de envío". En 1-3 seg
sale por la MUNBYN.

Si no sale, abre `agent.log` con Notepad y mira el último error.

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
| "Error contactando servidor" | URL incorrecta o internet caído | Probar `curl https://tu-url.trycloudflare.com/api/print-queue?token=XXX` |
| "Impresora no responde" | MUNBYN apagada o cable desconectado | Reconectar y probar `Get-Date \| Out-Printer "Munbyn RW403B-N"` |
| "Imprime a veces sí y a veces no" | Quedó otro agente vivo en la PC vieja | Es la carrera entre dos agentes: `nssm stop LILUS-PrintAgent` en la que ya no se usa |
| "Error contactando servidor" y Tailscale instalado | Las dos máquinas en redes distintas | `ping 100.92.162.24` desde la PC de la impresora. Si no responde, revisar que Tailscale esté conectado con la misma cuenta en ambas |
| "PDF sale con escala raro" | Tamaño de papel no concuerda | El agente usa `scale: noscale` — verifica que la cola Windows tenga el tamaño 4x6 o 2x1 según el caso |

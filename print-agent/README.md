# LILUS Print Agent

Servicio Windows que pregunta al servidor LILUS si hay etiquetas pendientes
de imprimir, y las envía a la impresora térmica MUNBYN conectada por USB-C.

## Cómo funciona (en 1 minuto)

```
[Usuario en celular]
    ↓ pulsa "Imprimir"
[LILUS Cloud (Cloudflare Tunnel)]
    ↓ guarda PrintJob en la BD
[PC 1er piso ← este agente]
    ↓ pregunta cada 2 seg
    ← recibe job, genera PDF temp, imprime
[MUNBYN] → sale el papel
```

El agente **solo necesita salida a internet** (HTTPS hacia tu URL de Cloudflare).
No expone puertos. No requiere reconfigurar tu router.

## Requisitos en la PC

1. **Windows 10/11**
2. **Node.js 22 LTS** instalado (<https://nodejs.org/>)
3. **Driver MUNBYN** instalado y la impresora conectada por USB-C (verifica con
   `Get-Printer` en PowerShell que aparezca `Munbyn RW403B-N`)
4. **nssm.exe** copiado en esta carpeta (descarga de <https://nssm.cc/download>,
   versión `win64/nssm.exe`)

## Setup paso a paso

### 1. Configurar `.env`

```cmd
copy .env.example .env
notepad .env
```

Completa:

- `LILUS_SERVER_URL`: tu URL de Cloudflare (la que ves en el celular)
- `LILUS_AGENT_TOKEN`: cualquier cadena aleatoria larga. Genera una con
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```
  **Anótala** porque la pones también en LILUS → Configuración → Agente de impresión.

### 2. Configurar LILUS

En tu LILUS web, ve a `Configuración → Agente de impresión`:

- ✅ Activar agente
- **Token**: pega el mismo del `.env`
- **Nombre de impresora**: `Munbyn RW403B-N` (o como aparezca en `Get-Printer`)

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
| "PDF sale con escala raro" | Tamaño de papel no concuerda | El agente usa `scale: noscale` — verifica que la cola Windows tenga el tamaño 4x6 o 2x1 según el caso |

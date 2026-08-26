<#
    Instalador del agente de impresión de LILUS.

    Deja una PC lista para imprimir etiquetas: instala lo que falte, baja el
    proyecto, registra el servicio y comprueba que hable con el servidor.

    Se puede volver a correr las veces que haga falta. Lo que ya está no lo
    toca, así que también sirve para reparar una instalación a medias.

    Uso (PowerShell como administrador):
        .\instalar.ps1
#>

[CmdletBinding()]
param(
    # Carpeta donde vive el proyecto. Fuera de Documentos a propósito: si
    # OneDrive sincroniza esa carpeta, mueve archivos por debajo y el
    # servicio se rompe solo.
    [string]$Carpeta = "C:\lilus-system",

    # Dirección del servidor. La fija de Tailscale, que no cambia al
    # reiniciar la laptop.
    [string]$ServidorUrl = "https://deiby-aspire-v5-123.tailb43ebc.ts.net",

    # Token compartido. Si no se pasa, lo pide por pantalla.
    [string]$Token,

    # Nombre de esta PC en la pantalla de Configuración. Vacío = el nombre
    # que ya tiene en Windows.
    [string]$NombrePc = ""
)

# Los comandos externos (winget, git, npm, nssm) escriben avisos por la
# salida de error aunque todo vaya bien. Con "Stop" el script se cortaría
# en el primer aviso inofensivo, así que se revisa cada paso a mano.
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Windows PowerShell 5.1 todavía negocia TLS 1.0 por defecto, y las
# descargas por HTTPS fallan con un error que no dice nada.
try {
    [Net.ServicePointManager]::SecurityProtocol =
    [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11
}
catch {}

$RepoUrl = "https://github.com/Deibyv68/lilus-system.git"
$NssmZipUrl = "https://nssm.cc/release/nssm-2.24.zip"

function Titulo($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
function Bien($t) { Write-Host "  [ok] $t" -ForegroundColor Green }
function Aviso($t) { Write-Host "  [!]  $t" -ForegroundColor Yellow }
function Malo($t) { Write-Host "  [X]  $t" -ForegroundColor Red }
# Lanza en vez de salir. Cuando el script se corre con "irm ... | iex" no
# hay un script del que salir: exit cierra la ventana entera, y el error
# se lo lleva puesto antes de que nadie alcance a leerlo.
function Detener($t) { throw $t }

# Tras instalar algo con winget, el PATH nuevo no existe en esta ventana
# hasta releerlo del registro. Sin esto, "node" no se encuentra aunque
# acabe de instalarse.
function Actualizar-Path {
    $m = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $u = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = (@($m, $u) | Where-Object { $_ }) -join ";"
}

function Existe($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Instalar-Winget($id, $nombre, $comando) {
    if (Existe $comando) {
        Bien "$nombre ya estaba instalado"
        return $true
    }
    if (-not (Existe "winget")) {
        Malo "$nombre no esta, y esta PC no tiene winget para instalarlo."
        Write-Host "       Instalalo a mano y volve a correr el script." -ForegroundColor Yellow
        return $false
    }
    Write-Host "  Instalando $nombre (puede tardar unos minutos)..."
    winget install --id $id --exact --silent `
        --accept-source-agreements --accept-package-agreements | Out-Null
    Actualizar-Path
    if (Existe $comando) { Bien "$nombre instalado"; return $true }
    Malo "$nombre se instalo pero Windows todavia no lo encuentra."
    Write-Host "       Cerra esta ventana, abri otra como administrador" -ForegroundColor Yellow
    Write-Host "       y volve a correr el script." -ForegroundColor Yellow
    return $false
}

function Invoke-Instalacion {
    # ──────────────────────────────────────────────────────────
    Write-Host ""
    Write-Host "  LILUS - Instalador del agente de impresion" -ForegroundColor Magenta
    Write-Host "  ==========================================" -ForegroundColor Magenta

    # ── 0. Permisos ──
    $soyAdmin = ([Security.Principal.WindowsPrincipal] `
            [Security.Principal.WindowsIdentity]::GetCurrent()
    ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if (-not $soyAdmin) {
        Write-Host ""
        Malo "Esta ventana no es de administrador."
        Write-Host ""
        Write-Host "  Cerrala. Busca 'PowerShell' en el menu de inicio," -ForegroundColor Yellow
        Write-Host "  hace clic derecho y elegi 'Ejecutar como administrador'." -ForegroundColor Yellow
        Write-Host "  Despues volve a correr este script." -ForegroundColor Yellow
        Detener "Hacen falta permisos de administrador."
    }
    Bien "Permisos de administrador"

    # ── 1. Programas base ──
    Titulo "1/6  Programas necesarios"
    Actualizar-Path
    $ok = $true
    if (-not (Instalar-Winget "OpenJS.NodeJS.LTS" "Node.js" "node")) { $ok = $false }
    if (-not (Instalar-Winget "Git.Git" "Git" "git")) { $ok = $false }
    if (-not (Instalar-Winget "tailscale.tailscale" "Tailscale" "tailscale")) { $ok = $false }
    if (-not $ok) { Detener "Faltan programas (ver arriba)." }

    # ── 2. Tailscale conectado ──
    Titulo "2/6  Red privada (Tailscale)"
    $estadoTs = (tailscale status | Out-String)
    if ($LASTEXITCODE -ne 0 -or $estadoTs -match "Logged out" -or $estadoTs -match "NeedsLogin") {
        Aviso "Tailscale esta instalado pero sin iniciar sesion."
        Write-Host ""
        Write-Host "  Se va a abrir el navegador. Entra con la MISMA cuenta" -ForegroundColor Yellow
        Write-Host "  que usas en la laptop del servidor." -ForegroundColor Yellow
        Write-Host ""
        Read-Host "  Enter para continuar"
        tailscale up
        if ($LASTEXITCODE -ne 0) { Detener "No se pudo conectar Tailscale." }
    }
    Bien "Tailscale conectado"

    # ── 3. El proyecto ──
    Titulo "3/6  Descargar el proyecto"
    if (Test-Path (Join-Path $Carpeta ".git")) {
        Bien "Ya estaba en $Carpeta, actualizando"
        git -C $Carpeta pull --ff-only | Out-Null
    }
    else {
        if (Test-Path $Carpeta) {
            Detener "$Carpeta ya existe y no es el proyecto. Borrala o pasa -Carpeta otra-ruta."
        }
        Write-Host "  Descargando en $Carpeta..."
        git clone --depth 1 $RepoUrl $Carpeta | Out-Null
        if (-not (Test-Path (Join-Path $Carpeta ".git"))) {
            Detener "No se pudo descargar el proyecto. Hay internet en esta PC?"
        }
        Bien "Descargado"
    }

    $AgentDir = Join-Path $Carpeta "print-agent"
    if (-not (Test-Path $AgentDir)) { Detener "No se encontro la carpeta print-agent." }
    Set-Location $AgentDir

    # ── 4. nssm ──
    Titulo "4/6  Herramienta de servicios (nssm)"
    $nssmPath = Join-Path $AgentDir "nssm.exe"
    if (Test-Path $nssmPath) {
        Bien "nssm.exe ya estaba"
    }
    else {
        $zip = Join-Path $env:TEMP "nssm.zip"
        $tmp = Join-Path $env:TEMP "nssm-extract"
        Write-Host "  Descargando nssm..."
        try {
            Invoke-WebRequest -Uri $NssmZipUrl -OutFile $zip -UseBasicParsing `
                -TimeoutSec 60 -ErrorAction Stop
            if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
            Expand-Archive -Path $zip -DestinationPath $tmp -Force -ErrorAction Stop
        }
        catch {
            Detener "No se pudo bajar nssm: $($_.Exception.Message)"
        }
        $exe = Get-ChildItem $tmp -Recurse -Filter "nssm.exe" |
        Where-Object { $_.FullName -match "win64" } | Select-Object -First 1
        if (-not $exe) { Detener "No se encontro nssm.exe dentro del zip." }
        Copy-Item $exe.FullName $nssmPath -Force
        Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue
        Bien "nssm.exe listo"
    }

    # ── 5. Configuración ──
    Titulo "5/6  Configuracion"
    $envPath = Join-Path $AgentDir ".env"

    if (-not $Token -and (Test-Path $envPath)) {
        $viejo = Select-String -Path $envPath -Pattern "^LILUS_AGENT_TOKEN=(.+)$" `
            -ErrorAction SilentlyContinue
        if ($viejo) {
            $Token = $viejo.Matches[0].Groups[1].Value.Trim()
            Bien "Reusando el token que ya estaba en .env"
        }
    }
    if (-not $Token) {
        Write-Host ""
        Write-Host "  Necesito el token del agente. Se saca de LILUS:" -ForegroundColor Yellow
        Write-Host "    Configuracion -> Agente de impresion -> Token compartido" -ForegroundColor Yellow
        Write-Host "    (toca el ojito para verlo y copialo tal cual)" -ForegroundColor Yellow
        Write-Host ""
        $Token = (Read-Host "  Pega el token aqui").Trim()
    }
    if (-not $Token) { Detener "Sin token no puedo seguir." }

    $lineas = @(
        "LILUS_SERVER_URL=$ServidorUrl",
        "LILUS_AGENT_TOKEN=$Token",
        "LILUS_POLL_INTERVAL_MS=2000"
    )
    if ($NombrePc) { $lineas += "LILUS_AGENT_NAME=$NombrePc" }

    # Sin BOM a propósito: Set-Content -Encoding utf8 en PowerShell 5.1 lo
    # agrega, y esos tres bytes invisibles se pegan al nombre de la primera
    # variable. El agente entonces no encuentra LILUS_SERVER_URL y muere
    # diciendo que falta configuración, con el archivo aparentemente correcto.
    [System.IO.File]::WriteAllLines(
        $envPath, $lineas, (New-Object System.Text.UTF8Encoding($false))
    )
    Bien "Archivo .env escrito"

    # Antes de instalar el servicio, comprobar que el servidor conteste y
    # acepte el token. Es mejor fallar acá con un mensaje claro que dejar un
    # servicio instalado que no imprime y hay que ir a leer en el log.
    Write-Host "  Probando conexion con el servidor..."

    # El nombre se le pregunta a Node, que es lo que va a usar el agente
    # despues. $env:COMPUTERNAME devuelve lo mismo pero en mayusculas, y
    # como para el servidor "ANDREA" y "Andrea" son dos nombres distintos,
    # la PC aparecia duplicada en la lista de computadoras.
    $nombreReal = $NombrePc
    if (-not $nombreReal) {
        $nombreReal = (& node -e "console.log(require('os').hostname())" 2>$null | Select-Object -First 1)
    }
    if (-not $nombreReal) { $nombreReal = $env:COMPUTERNAME }
    $nombreReal = $nombreReal.Trim()
    $prueba = "$ServidorUrl/api/print-queue" +
    "?token=$([uri]::EscapeDataString($Token))" +
    "&agent=$([uri]::EscapeDataString($nombreReal))&printer=instalando"

    # En PowerShell 5.1 un 401 llega como excepción, no como respuesta, así
    # que el código de estado hay que sacarlo de las dos partes.
    $estado = $null
    try {
        $r = Invoke-WebRequest -Uri $prueba -UseBasicParsing -TimeoutSec 25 -ErrorAction Stop
        $estado = [int]$r.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            $estado = [int]$_.Exception.Response.StatusCode
        }
        else {
            Malo "No se pudo contactar al servidor en $ServidorUrl"
            Write-Host "       Abri esa direccion en el navegador de esta PC." -ForegroundColor Yellow
            Write-Host "       Si no abre: Tailscale no esta conectado, o la laptop" -ForegroundColor Yellow
            Write-Host "       del servidor esta apagada." -ForegroundColor Yellow
            Detener "Sin conexion con el servidor."
        }
    }

    if ($estado -eq 401) {
        Malo "El servidor contesta, pero RECHAZA el token."
        Write-Host "       Copialo de nuevo desde Configuracion -> Agente de impresion." -ForegroundColor Yellow
        Detener "Token incorrecto."
    }
    elseif ($estado -eq 200 -or $estado -eq 204) {
        Bien "El servidor contesta y acepta el token"
    }
    else {
        Aviso "Respuesta inesperada del servidor (HTTP $estado). Sigo igual."
    }

    # ── 6. El servicio ──
    Titulo "6/6  Instalar el servicio"
    Write-Host "  Instalando dependencias..."

    # Se llama a npm.cmd y no a npm a propósito.
    #
    # Node instala tres lanzadores: npm.ps1, npm.cmd y npm. Escribir "npm"
    # a secas hace que PowerShell elija el .ps1, y en una PC con la
    # ejecución de scripts restringida —que es lo que Windows trae de
    # fábrica en muchas máquinas— eso falla antes de empezar. El .cmd hace
    # exactamente lo mismo sin pasar por PowerShell.
    #
    # La alternativa sería bajarle la política de seguridad a la PC, y no
    # hace falta tocar eso para instalar una impresora.
    $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $npmCmd) {
        $npmCmd = Join-Path (Split-Path (Get-Command node).Source) "npm.cmd"
    }
    if (-not (Test-Path $npmCmd)) { Detener "No se encuentra npm.cmd junto a Node." }

    # La salida se guarda en vez de tirarse: si npm falla, el motivo está
    # ahí y sin eso solo quedaría un "no dejó las dependencias" sin pistas.
    $salidaNpm = (& $npmCmd install --omit=dev --no-audit --no-fund 2>&1 | Out-String)
    if (-not (Test-Path (Join-Path $AgentDir "node_modules\pdf-to-printer"))) {
        Write-Host ""
        Write-Host "  Lo que dijo npm:" -ForegroundColor Yellow
        Write-Host $salidaNpm
        Detener "npm no pudo instalar las dependencias (ver arriba)."
    }
    Bien "Dependencias instaladas"

    & $nssmPath stop LILUS-PrintAgent 2>&1 | Out-Null
    & $nssmPath remove LILUS-PrintAgent confirm 2>&1 | Out-Null

    $nodeExe = (Get-Command node).Source
    if (-not $nodeExe) { Detener "No se encuentra node.exe aunque Node esta instalado." }

    $salidaNssm = (& $nssmPath install LILUS-PrintAgent $nodeExe (Join-Path $AgentDir "agent.js") 2>&1 | Out-String)
    if (-not (Get-Service LILUS-PrintAgent -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "  Lo que dijo nssm:" -ForegroundColor Yellow
        Write-Host $salidaNssm
        Detener "No se pudo registrar el servicio (ver arriba)."
    }
    & $nssmPath set LILUS-PrintAgent AppDirectory $AgentDir 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent DisplayName "LILUS Print Agent" 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent Description "Imprime las etiquetas de LILUS en la impresora conectada a esta PC." 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent Start SERVICE_AUTO_START 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent AppStdout (Join-Path $AgentDir "agent.log") 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent AppStderr (Join-Path $AgentDir "agent.log") 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent AppRotateFiles 1 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent AppRotateBytes 1048576 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent AppThrottle 5000 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent AppRestartDelay 5000 2>&1 | Out-Null
    & $nssmPath set LILUS-PrintAgent AppExit Default Restart 2>&1 | Out-Null
    & $nssmPath start LILUS-PrintAgent 2>&1 | Out-Null

    Start-Sleep -Seconds 6
    $svc = Get-Service LILUS-PrintAgent -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq "Running") {
        Bien "Servicio corriendo"
    }
    else {
        Malo "El servicio no arranco (estado: $($svc.Status))"
        Write-Host ""
        Write-Host "  Ultimas lineas del log:" -ForegroundColor Yellow
        Get-Content (Join-Path $AgentDir "agent.log") -Tail 15 -ErrorAction SilentlyContinue
        Detener "Revisa el log de arriba."
    }

    # ── Cierre ──
    $impresoras = @(Get-Printer -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "MUNBYN|Munbyn" })

    Write-Host ""
    Write-Host "  ==========================================" -ForegroundColor Green
    Write-Host "   Listo. Esta PC ya es parte del sistema." -ForegroundColor Green
    Write-Host "  ==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Aparece como: $nombreReal"
    Write-Host "   Carpeta:      $AgentDir"
    Write-Host ""

    if ($impresoras.Count -gt 0) {
        Bien "Impresora detectada: $($impresoras[0].Name)"
        Write-Host ""
        Write-Host "   Entra a LILUS -> Configuracion -> Agente de impresion."
        Write-Host "   Esta PC tiene que aparecer en verde en unos segundos."
    }
    else {
        Aviso "No veo ninguna MUNBYN conectada a esta PC."
        Write-Host ""
        Write-Host "   Esta bien si la impresora esta en la otra computadora:" -ForegroundColor Yellow
        Write-Host "   solo imprime la que tenga el cable puesto. Cuando la" -ForegroundColor Yellow
        Write-Host "   enchufes aca, en unos 10 segundos toma el relevo sola." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Si la impresora SI esta enchufada aca, falta el driver" -ForegroundColor Yellow
        Write-Host "   MUNBYN. Instalalo y listo." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "   Ver el log:  Get-Content `"$AgentDir\agent.log`" -Tail 20"
    Write-Host ""
}

# ──────────────────────────────────────────────────────────
# Arranque
#
# Todo queda grabado en un archivo del Escritorio. Un instalador que
# falla y cierra la ventana antes de que se pueda leer el motivo no
# sirve de nada, y eso pasa cada vez que se corre con "irm ... | iex".
# ──────────────────────────────────────────────────────────
$Escritorio = [Environment]::GetFolderPath("Desktop")
if (-not $Escritorio) { $Escritorio = $env:TEMP }
$LogPath = Join-Path $Escritorio "lilus-instalacion.txt"
$DondeEstaba = (Get-Location).Path

try { Stop-Transcript | Out-Null } catch {}
try { Start-Transcript -Path $LogPath -Force | Out-Null } catch {}

$exito = $false
try {
    Invoke-Instalacion
    $exito = $true
}
catch {
    Write-Host ""
    Write-Host "  [X]  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Se detuvo aca. Arriba esta el detalle." -ForegroundColor Yellow
}
finally {
    Set-Location $DondeEstaba
    try { Stop-Transcript | Out-Null } catch {}

    Write-Host ""
    if ($exito) {
        Write-Host "  Todo esto quedo guardado en:" -ForegroundColor DarkGray
    }
    else {
        Write-Host "  MANDALE ESTE ARCHIVO A DEIBY:" -ForegroundColor Cyan
    }
    Write-Host "  $LogPath" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "  Enter para cerrar"
}

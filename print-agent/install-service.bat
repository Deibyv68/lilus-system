@echo off
REM Instalador del agente LILUS como servicio de Windows.
REM Requiere: Node.js instalado (en PATH) y nssm.exe en la misma carpeta.
REM
REM Uso: click derecho > "Ejecutar como administrador"

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo === Instalador LILUS Print Agent ===
echo.

REM Encontrar la ruta real de node.exe (donde sea que esté instalado)
for /f "tokens=*" %%i in ('where node 2^>nul') do set NODE_EXE=%%i
if "%NODE_EXE%"=="" (
  echo [ERROR] Node.js no se encontro en PATH.
  echo Instala Node.js desde https://nodejs.org/ y vuelve a intentar.
  pause
  exit /b 1
)
echo Node detectado: %NODE_EXE%
echo.

REM Verificar nssm.exe
if not exist "nssm.exe" (
  echo [ERROR] Falta nssm.exe en esta carpeta.
  echo Descarga nssm desde https://nssm.cc/download
  echo Copia win64/nssm.exe a esta misma carpeta.
  pause
  exit /b 1
)

REM Verificar .env
if not exist ".env" (
  echo [ERROR] Falta archivo .env
  echo Copia .env.example como .env y edita los valores.
  pause
  exit /b 1
)

REM npm install
echo Instalando dependencias...
call npm install --omit=dev
if errorlevel 1 (
  echo [ERROR] npm install fallo
  pause
  exit /b 1
)

echo.
echo Registrando servicio "LILUS-PrintAgent"...

REM Detener si ya existe
nssm stop LILUS-PrintAgent >nul 2>nul
nssm remove LILUS-PrintAgent confirm >nul 2>nul

REM Instalar usando la ruta dinámica de node
nssm install LILUS-PrintAgent "%NODE_EXE%" "%~dp0agent.js"
nssm set LILUS-PrintAgent AppDirectory "%CD%"
nssm set LILUS-PrintAgent DisplayName "LILUS Print Agent"
nssm set LILUS-PrintAgent Description "Agente local que imprime trabajos de LILUS en la MUNBYN."
nssm set LILUS-PrintAgent Start SERVICE_AUTO_START
nssm set LILUS-PrintAgent AppStdout "%~dp0agent.log"
nssm set LILUS-PrintAgent AppStderr "%~dp0agent.log"
nssm set LILUS-PrintAgent AppRotateFiles 1
nssm set LILUS-PrintAgent AppRotateBytes 1048576
REM Throttling generoso: NSSM espera 5s entre intentos si crashea
nssm set LILUS-PrintAgent AppThrottle 5000
REM Si crashea, esperar 5s y reintentar (sin tope)
nssm set LILUS-PrintAgent AppRestartDelay 5000
nssm set LILUS-PrintAgent AppExit Default Restart

REM Arrancar
nssm start LILUS-PrintAgent

REM Verificar estado real
timeout /t 3 /nobreak >nul
echo.
sc query LILUS-PrintAgent | findstr STATE

echo.
echo ============================================
echo  Servicio instalado
echo ============================================
echo.
echo  Ver logs:  type "%~dp0agent.log"
echo  Estado:    Get-Service LILUS-PrintAgent
echo  Detener:   nssm stop LILUS-PrintAgent
echo  Arrancar:  nssm start LILUS-PrintAgent
echo  Desinstalar: uninstall-service.bat
echo.
pause

@echo off
REM Instalador del agente LILUS como servicio de Windows.
REM Requiere: Node.js instalado y nssm.exe en la misma carpeta.
REM
REM Uso: doble click derecho > "Ejecutar como administrador"

setlocal
cd /d "%~dp0"

echo === Instalador LILUS Print Agent ===
echo.

REM Verificar Node
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado.
  echo Descarga e instala Node.js LTS desde https://nodejs.org/
  pause
  exit /b 1
)

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

REM Instalar
nssm install LILUS-PrintAgent "%PROGRAMFILES%\nodejs\node.exe" "%~dp0agent.js"
nssm set LILUS-PrintAgent AppDirectory "%~dp0"
nssm set LILUS-PrintAgent DisplayName "LILUS Print Agent"
nssm set LILUS-PrintAgent Description "Agente local que imprime trabajos de LILUS en la MUNBYN."
nssm set LILUS-PrintAgent Start SERVICE_AUTO_START
nssm set LILUS-PrintAgent AppStdout "%~dp0agent.log"
nssm set LILUS-PrintAgent AppStderr "%~dp0agent.log"
nssm set LILUS-PrintAgent AppRotateFiles 1
nssm set LILUS-PrintAgent AppRotateBytes 1048576

REM Arrancar
nssm start LILUS-PrintAgent

echo.
echo ============================================
echo  Servicio instalado y corriendo
echo ============================================
echo.
echo  Ver logs:  type "%~dp0agent.log"
echo  Detener:   nssm stop LILUS-PrintAgent
echo  Arrancar:  nssm start LILUS-PrintAgent
echo  Desinstalar: uninstall-service.bat
echo.
pause

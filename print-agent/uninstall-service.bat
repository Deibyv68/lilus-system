@echo off
setlocal
cd /d "%~dp0"
echo Deteniendo y eliminando servicio LILUS-PrintAgent...
nssm stop LILUS-PrintAgent
nssm remove LILUS-PrintAgent confirm
echo Listo.
pause

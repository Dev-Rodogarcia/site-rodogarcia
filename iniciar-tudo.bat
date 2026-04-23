@echo off
setlocal
cd /d "%~dp0"

title Rodogarcia - Ambiente Local

echo [Rodogarcia] Este projeto nao usa json-server separado.
echo [Rodogarcia] O proprio Next.js le e grava os JSONs em server\storage\**.
echo.

echo [Rodogarcia] Encerrando instancias antigas nas portas 5010 e 5410...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 5010,5410 } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {} }" >nul 2>&1
echo.

if not exist "node_modules" (
  echo [Rodogarcia] Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo.
    echo [Rodogarcia] Falha ao instalar dependencias.
    pause
    exit /b 1
  )
  echo.
)

echo [Rodogarcia] Iniciando ambiente local...
echo [Rodogarcia] Site: http://127.0.0.1:5010
echo [Rodogarcia] CMS:  http://127.0.0.1:5010/auth/entrar
echo.

call npm run dev:local

if errorlevel 1 (
  echo.
  echo [Rodogarcia] O servidor foi encerrado com erro.
  pause
  exit /b 1
)

endlocal

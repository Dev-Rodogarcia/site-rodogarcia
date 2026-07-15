@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"

title Rodogarcia - Desenvolvimento

set "ENV_FILE=%RODOGARCIA_ENV_FILE%"
if not defined ENV_FILE (
  if exist ".env.development.local" (
    set "ENV_FILE=.env.development.local"
  ) else (
    set "ENV_FILE=.env"
  )
)

if not exist "%ENV_FILE%" (
  echo [Rodogarcia DEV] Arquivo de ambiente nao encontrado: %ENV_FILE%
  echo Copie .env.development.example para .env.development.local ou configure RODOGARCIA_ENV_FILE.
  exit /b 1
)

call "%~dp0scripts\load-root-env.bat" "%ENV_FILE%"
if errorlevel 1 exit /b 1

rem DEV nao reutiliza destino, proxy ou storage definidos para producao.
set "NODE_ENV=development"
set "HOST=127.0.0.1"
set "PORT=4011"
set "FRONTEND_ORIGIN=http://127.0.0.1:5011"
set "BACKEND_INTERNAL_URL=http://127.0.0.1:4011"
set "BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4011"
set "STORAGE_ROOT=storage"
set "UPLOADS_DIR=storage\uploads"

echo [Rodogarcia DEV] Ambiente: %ENV_FILE%
echo [Rodogarcia DEV] Encerrando processos nas portas 4011 e 5011...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(4011,5011); Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {} }" >nul 2>&1
timeout /t 1 /nobreak >nul

if not exist "backend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do backend...
  pushd backend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

if not exist "frontend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do frontend...
  pushd frontend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

echo [Rodogarcia DEV] Abrindo backend e frontend em janelas separadas...
start "Rodogarcia Backend DEV" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
start "Rodogarcia Frontend DEV" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo [Rodogarcia DEV] Backend:  http://127.0.0.1:4011
echo [Rodogarcia DEV] Frontend: http://127.0.0.1:5011
echo [Rodogarcia DEV] CMS:      http://127.0.0.1:5011/auth/entrar

endlocal

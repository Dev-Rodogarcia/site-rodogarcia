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
set "PORT=4012"
set "FRONTEND_ORIGIN=http://127.0.0.1:5012"
set "BACKEND_INTERNAL_URL=http://127.0.0.1:4012"
set "BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4012"
set "STORAGE_ROOT=storage"
set "UPLOADS_DIR=storage\uploads"
set "LANDING_BUILDER_API_URL=http://127.0.0.1:6110"
set "LANDING_BUILDER_HOST=127.0.0.1"
set "LANDING_BUILDER_PORT=6110"
set "LANDING_BUILDER_PUBLIC_URL=http://127.0.0.1:5112"

if not defined LANDING_BUILDER_SERVICE_TOKEN (
  for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')"`) do set "LANDING_BUILDER_SERVICE_TOKEN=%%T"
  echo [Rodogarcia DEV] Token temporario do Landing Builder gerado para esta execucao.
)

echo [Rodogarcia DEV] Ambiente: %ENV_FILE%
echo [Rodogarcia DEV] Encerrando processos nas portas 4012, 5012, 5112 e 6110...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(4012,5012,5112,6110); Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {} }" >nul 2>&1
timeout /t 1 /nobreak >nul

rem O cache de rotas do Next e gerado no desenvolvimento e pode ficar inconsistente apos interrupcoes.
if exist "frontend\.next" (
  echo [Rodogarcia DEV] Limpando cache de rotas do frontend...
  rmdir /s /q "frontend\.next"
)

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

if not exist "landing-builder\backend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do Landing Builder...
  pushd landing-builder\backend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

if not exist "landing-builder\frontend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do frontend do Landing Builder...
  pushd landing-builder\frontend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

echo [Rodogarcia DEV] Iniciando backend, frontend e Landing Builder neste terminal...
rem /b mantém os processos no console atual (inclusive no terminal integrado do VS Code).
start "Rodogarcia Backend DEV" /b cmd /d /c "cd /d ""%~dp0backend"" && npm run dev"
start "Rodogarcia Frontend DEV" /b cmd /d /c "cd /d ""%~dp0frontend"" && npm run dev"
start "Rodogarcia Landing Builder DEV" /b cmd /d /c "cd /d ""%~dp0landing-builder\backend"" && npm run dev"
start "Rodogarcia Landing Builder Frontend DEV" /b cmd /d /c "cd /d ""%~dp0landing-builder\frontend"" && npm run dev"

echo.
echo [Rodogarcia DEV] Backend:  http://127.0.0.1:4012
echo [Rodogarcia DEV] Frontend: http://127.0.0.1:5012
echo [Rodogarcia DEV] CMS:      http://127.0.0.1:5012/auth/entrar
echo [Rodogarcia DEV] Builder API:      http://127.0.0.1:6110
echo [Rodogarcia DEV] Builder publico:  http://127.0.0.1:5112

endlocal

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
set "CMS_INTERNAL_URL=http://127.0.0.1:5013"
set "CMS_BACKEND_INTERNAL_URL=http://127.0.0.1:4013"
set "CMS_BACKEND_PROXY_URL=http://127.0.0.1:4013"
set "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:5012"
rem O acesso pelo gateway continua same-origin; esta lista cobre somente o CMS aberto direto em 5013.
set "CORS_ORIGINS=http://127.0.0.1:5013,http://localhost:5013"
set "STORAGE_ROOT=storage"
set "UPLOADS_DIR=storage\uploads"
rem O Landing Builder tem ciclo proprio. Este script nao instala, encerra nem inicia seus processos.
rem Valores LANDING_BUILDER_* carregados do ambiente sao preservados para integracao opcional com uma instancia independente.

echo [Rodogarcia DEV] Ambiente: %ENV_FILE%
echo [Rodogarcia DEV] Encerrando processos nas portas 4012, 4013, 5012 e 5013...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(4012,4013,5012,5013); Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {} }" >nul 2>&1
timeout /t 1 /nobreak >nul

rem O cache de rotas do Next e gerado no desenvolvimento e pode ficar inconsistente apos interrupcoes.
if exist "site\frontend\.next" (
  echo [Rodogarcia DEV] Limpando cache de rotas do frontend...
  rmdir /s /q "site\frontend\.next"
)

if exist "cms\frontend\.next" (
  echo [Rodogarcia DEV] Limpando cache de rotas do CMS...
  rmdir /s /q "cms\frontend\.next"
)

if not exist "site\backend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do backend...
  pushd site\backend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

if not exist "cms\backend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do backend do CMS...
  pushd cms\backend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

if not exist "site\frontend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do frontend...
  pushd site\frontend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

if not exist "cms\frontend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do CMS...
  pushd cms\frontend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

echo [Rodogarcia DEV] Iniciando backend, backend do CMS, site e CMS neste terminal...
rem /b mantém os processos no console atual (inclusive no terminal integrado do VS Code).
start "Rodogarcia Backend DEV" /b cmd /d /c "cd /d ""%~dp0site\backend"" && npm run dev"
start "Rodogarcia CMS Backend DEV" /b cmd /d /c "cd /d ""%~dp0cms\backend"" && set PORT=4013 && npm run dev"
start "Rodogarcia Frontend DEV" /b cmd /d /c "cd /d ""%~dp0site\frontend"" && npm run dev"
start "Rodogarcia CMS DEV" /b cmd /d /c "cd /d ""%~dp0cms\frontend"" && npm run dev"

echo.
echo [Rodogarcia DEV] Backend:  http://127.0.0.1:4012
echo [Rodogarcia DEV] CMS API:  http://127.0.0.1:4013
echo [Rodogarcia DEV] Frontend: http://127.0.0.1:5012
echo [Rodogarcia DEV] CMS:      http://127.0.0.1:5012/admin/auth/entrar
echo [Rodogarcia DEV] Landing Builder: gerenciado por fluxo independente.

endlocal

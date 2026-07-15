@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"

title Rodogarcia - Producao

set "ENV_FILE=%RODOGARCIA_ENV_FILE%"
if not defined ENV_FILE (
  if exist ".env.production.local" (
    set "ENV_FILE=.env.production.local"
  ) else (
    set "ENV_FILE=.env"
  )
)

if not exist "%ENV_FILE%" (
  echo [Rodogarcia PROD] Arquivo de ambiente nao encontrado: %ENV_FILE%
  echo Copie .env.production.example para .env.production.local ou configure RODOGARCIA_ENV_FILE.
  exit /b 1
)

call "%~dp0scripts\load-root-env.bat" "%ENV_FILE%"
if errorlevel 1 exit /b 1

rem Os dois processos de producao ficam privados; o tunnel/reverse proxy e a unica borda publica.
set "NODE_ENV=production"
set "HOST=127.0.0.1"
set "PORT=6050"
set "BACKEND_INTERNAL_URL=http://127.0.0.1:6050"
set "BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_PROXY_URL="
set "SECURITY_TEST_BACKEND_PORT=6050"
set "SECURITY_TEST_FRONTEND_PORT=6060"

echo [Rodogarcia PROD] Ambiente: %ENV_FILE%

if not exist "backend\node_modules" (
  echo [Rodogarcia PROD] Instalando dependencias do backend a partir do lockfile...
  pushd backend
  call npm ci
  if errorlevel 1 exit /b 1
  popd
)

if not exist "frontend\node_modules" (
  echo [Rodogarcia PROD] Instalando dependencias do frontend a partir do lockfile...
  pushd frontend
  call npm ci
  if errorlevel 1 exit /b 1
  popd
)

echo [Rodogarcia PROD] Validando e compilando backend...
pushd backend
call npm run typecheck
if errorlevel 1 exit /b 1
rem A suite importa services que carregam env.ts; teste nao deve herdar o hardening do boot PROD.
set "NODE_ENV=test"
call npm test
if errorlevel 1 exit /b 1
set "NODE_ENV=production"
call npm run build
if errorlevel 1 exit /b 1
node --input-type=module --eval "import('./dist/config/env.js')"
if errorlevel 1 exit /b 1
popd

echo [Rodogarcia PROD] Validando frontend...
pushd frontend
call npm run typecheck
if errorlevel 1 exit /b 1
popd

echo [Rodogarcia PROD] Encerrando processos nas portas 6050 e 6060...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(6050,6060); Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {} }" >nul 2>&1
powershell -NoProfile -Command "Start-Sleep -Seconds 1" >nul

echo [Rodogarcia PROD] Recriando artefato standalone em frontend\dist-prod...
pushd frontend
call npm run build:prod
if errorlevel 1 exit /b 1
popd

echo [Rodogarcia PROD] Executando hardening ponta a ponta...
node scripts\tests\test-security-hardening.js
if errorlevel 1 exit /b 1

echo [Rodogarcia PROD] Abrindo backend e frontend compilados em janelas separadas...
start "Rodogarcia Backend PROD" cmd /k "cd /d ""%~dp0backend"" && npm run start"
start "Rodogarcia Frontend PROD" /D "%~dp0frontend" cmd /k "set PORT=6060&&set HOSTNAME=127.0.0.1&&npm run start:prod"

echo.
echo [Rodogarcia PROD] Backend Cloudflare:  https://sitebackend.rodogarcia.com.br ^> http://127.0.0.1:6050
echo [Rodogarcia PROD] Frontend Cloudflare: https://site.rodogarcia.com.br ^> http://127.0.0.1:6060

endlocal

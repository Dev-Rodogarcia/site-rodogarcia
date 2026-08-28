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
set "PORT=31012"
set "FRONTEND_ORIGIN=http://127.0.0.1:35180"
set "BACKEND_INTERNAL_URL=http://127.0.0.1:31012"
set "BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:31012"
set "CMS_INTERNAL_URL=http://127.0.0.1:35013"
set "CMS_BACKEND_INTERNAL_URL=http://127.0.0.1:31013"
set "CMS_BACKEND_PROXY_URL=http://127.0.0.1:31013"
set "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:35180"
rem O gateway aceita o acesso local; origens HTTPS temporarias do Dev Tunnel sao aceitas apenas em desenvolvimento.
set "CORS_ORIGINS=http://127.0.0.1:35180,http://localhost:35180,http://127.0.0.1:35013,http://localhost:35013"
set "STORAGE_ROOT=storage"
set "UPLOADS_DIR=storage\uploads"
set "LANDING_BUILDER_API_URL=http://127.0.0.1:36110"
set "LANDING_BUILDER_PUBLIC_URL=http://127.0.0.1:35112"
set "LANDING_BUILDER_BACKEND_URL=http://127.0.0.1:36110"
set "LANDING_BUILDER_HOST=127.0.0.1"
set "LANDING_BUILDER_SITE_URL=%NEXT_PUBLIC_SITE_URL%"
set "LANDING_BUILDER_ASSET_PREFIX=/landing-assets"
set "LANDING_BUILDER_STORAGE_ROOT="
if not defined LANDING_BUILDER_SERVICE_TOKEN (
  for /f "delims=" %%T in ('node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"') do set "LANDING_BUILDER_SERVICE_TOKEN=%%T"
)
if not defined LANDING_BUILDER_SERVICE_TOKEN (
  echo [Rodogarcia DEV] Nao foi possivel preparar o token privado do Landing Builder.
  exit /b 1
)

echo [Rodogarcia DEV] Ambiente: %ENV_FILE%
echo [Rodogarcia DEV] Encerrando processos nas portas 31012, 31013, 35180, 35013, 36110 e 35112...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(31012,31013,35180,35013,36110,35112); $repoRoot=[IO.Path]::GetFullPath('%~dp0').TrimEnd([char]92); $listeners=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }); $owned=@(); $foreign=@(); foreach ($group in ($listeners | Group-Object OwningProcess)) { $process=Get-CimInstance Win32_Process -Filter ('ProcessId = {0}' -f $group.Name) -ErrorAction SilentlyContinue; $commandLine=[string]$process.CommandLine; $portsInUse=($group.Group | ForEach-Object LocalPort | Sort-Object -Unique) -join ','; if ($commandLine -and $commandLine.IndexOf($repoRoot,[StringComparison]::OrdinalIgnoreCase) -ge 0) { $owned += [int]$group.Name } else { $foreign += ('porta(s) {0}, PID {1}' -f $portsInUse,$group.Name) } }; if ($foreign.Count -gt 0) { Write-Error ('Porta DEV ocupada por outro projeto: ' + ($foreign -join '; ')); exit 2 }; foreach ($processId in ($owned | Select-Object -Unique)) { try { Stop-Process -Id $processId -Force -ErrorAction Stop } catch {} }"
if errorlevel 1 (
  echo [Rodogarcia DEV] Nenhum processo externo foi encerrado. Libere a porta indicada ou altere o outro projeto e execute novamente.
  exit /b 1
)
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

if exist "landing-builder\frontend\.next" (
  echo [Rodogarcia DEV] Limpando cache de rotas do Landing Builder...
  rmdir /s /q "landing-builder\frontend\.next"
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

if not exist "landing-builder\backend\node_modules" (
  echo [Rodogarcia DEV] Instalando dependencias do backend do Landing Builder...
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

echo [Rodogarcia DEV] Iniciando backend, backend do CMS, site, CMS e Landing Builder neste terminal...
rem /b mantém os processos no console atual (inclusive no terminal integrado do VS Code).
start "Rodogarcia Backend DEV" /b cmd /d /c "cd /d ""%~dp0site\backend"" && npm run dev"
start "Rodogarcia CMS Backend DEV" /b cmd /d /c "cd /d ""%~dp0cms\backend"" && set PORT=31013 && npm run dev"
start "Rodogarcia Frontend DEV" /b cmd /d /c "cd /d ""%~dp0site\frontend"" && npm run dev"
start "Rodogarcia CMS DEV" /b cmd /d /c "cd /d ""%~dp0cms\frontend"" && npm run dev"
start "Rodogarcia Landing Builder Backend DEV" /b cmd /d /c "cd /d ""%~dp0landing-builder\backend"" && set LANDING_BUILDER_PORT=36110 && npm run dev"
start "Rodogarcia Landing Builder DEV" /b cmd /d /c "cd /d ""%~dp0landing-builder\frontend"" && npm run dev"

echo.
echo [Rodogarcia DEV] Backend:  http://127.0.0.1:31012
echo [Rodogarcia DEV] CMS API:  http://127.0.0.1:31013
echo [Rodogarcia DEV] Frontend: http://127.0.0.1:35180
echo [Rodogarcia DEV] CMS:      http://127.0.0.1:35180/admin/auth/entrar
echo [Rodogarcia DEV] Dev Tunnel: encaminhe a porta local 35180; a URL publica e temporaria e nao fica salva.
echo [Rodogarcia DEV] Landing API: http://127.0.0.1:36110
echo [Rodogarcia DEV] Landing Builder: http://127.0.0.1:35112

endlocal

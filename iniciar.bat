@echo off
setlocal
cd /d "%~dp0"

title Rodogarcia - Iniciar

set "BACKEND_PORT=4010"
set "FRONTEND_PORT=5010"

echo [Rodogarcia] Inicializador padrao do monorepo.

if exist ".env" (
  echo [Rodogarcia] Carregando variaveis da raiz pelo arquivo .env...
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

if not "%PORT%"=="" set "BACKEND_PORT=%PORT%"

echo [Rodogarcia] Encerrando processos nas portas %BACKEND_PORT% e %FRONTEND_PORT%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(%BACKEND_PORT%,%FRONTEND_PORT%); Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {} }" >nul 2>&1
timeout /t 1 /nobreak >nul
echo.

if not exist "backend\node_modules" (
  echo [Rodogarcia] Instalando dependencias do backend...
  pushd backend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

if not exist "frontend\node_modules" (
  echo [Rodogarcia] Instalando dependencias do frontend...
  pushd frontend
  call npm install
  if errorlevel 1 exit /b 1
  popd
)

echo [Rodogarcia] Abrindo backend em uma janela separada...
start "Rodogarcia Backend" cmd /k "cd /d ""%~dp0backend"" && npm run dev"

echo [Rodogarcia] Abrindo frontend em uma janela separada...
start "Rodogarcia Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo [Rodogarcia] Backend:  http://127.0.0.1:%BACKEND_PORT%
echo [Rodogarcia] Frontend: http://127.0.0.1:%FRONTEND_PORT%
echo [Rodogarcia] CMS:      http://127.0.0.1:%FRONTEND_PORT%/auth/entrar
echo.
echo [Rodogarcia] Servidores iniciando em janelas externas.

endlocal

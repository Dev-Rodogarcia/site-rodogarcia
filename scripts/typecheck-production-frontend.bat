@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "ERRORLEVEL="

if "%~1"=="" (
  echo [Rodogarcia PROD] Diretorio do frontend ausente para typecheck.
  exit /b 1
)
if "%~2"=="" (
  echo [Rodogarcia PROD] Nome do frontend ausente para typecheck.
  exit /b 1
)

echo [Rodogarcia PROD] Executando typecheck do %~2...
pushd "%~1"
call npm run typecheck
set "COMMAND_EXIT_CODE=%ERRORLEVEL%"
if not "%COMMAND_EXIT_CODE%"=="0" (
  popd
  exit /b 1
)
popd
exit /b 0

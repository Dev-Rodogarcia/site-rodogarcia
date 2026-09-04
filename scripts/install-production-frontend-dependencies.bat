@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "ERRORLEVEL="

if "%~1"=="" (
  echo [Rodogarcia PROD] Diretorio do frontend ausente para npm ci.
  exit /b 1
)
if "%~2"=="" (
  echo [Rodogarcia PROD] Nome do frontend ausente para npm ci.
  exit /b 1
)

echo [Rodogarcia PROD] npm ci com dependencias de build em %~2...
pushd "%~1"
call npm ci --include=dev
set "COMMAND_EXIT_CODE=%ERRORLEVEL%"
if not "%COMMAND_EXIT_CODE%"=="0" (
  popd
  exit /b 1
)
popd
exit /b 0

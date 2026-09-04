@echo off
setlocal EnableExtensions DisableDelayedExpansion

if "%~1"=="" goto :invalid_arguments
if "%~2"=="" goto :invalid_arguments
if "%~3"=="" goto :invalid_arguments
if not exist "%~1\mvnw.cmd" goto :missing_wrapper

set "BACKEND_DIRECTORY=%~1"
set "PORT=%~2"
set "HOST=127.0.0.1"

if /I "%~3"=="landing-builder" (
  set "LANDING_BUILDER_HOST=127.0.0.1"
  set "LANDING_BUILDER_PORT=%~2"
)

if /I "%~4"=="--dry-run" (
  echo [Rodogarcia DEV] %~3: HOST=%HOST%, PORT=%PORT%
  if /I "%~3"=="landing-builder" echo [Rodogarcia DEV] landing-builder: LANDING_BUILDER_HOST=%LANDING_BUILDER_HOST%, LANDING_BUILDER_PORT=%LANDING_BUILDER_PORT%
  exit /b 0
)

pushd "%BACKEND_DIRECTORY%"
call mvnw.cmd spring-boot:run
if errorlevel 1 (
  popd
  exit /b 1
)
popd
exit /b 0

:missing_wrapper
echo [Rodogarcia DEV] Maven Wrapper nao encontrado em %~1.
exit /b 1

:invalid_arguments
echo [Rodogarcia DEV] Parametros invalidos para iniciar backend Spring.
exit /b 1

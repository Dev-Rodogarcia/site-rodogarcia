@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "ERRORLEVEL="

if "%~1"=="" (
  echo [Rodogarcia PROD] Diretorio do backend ausente para Maven verify.
  exit /b 1
)
if "%~2"=="" (
  echo [Rodogarcia PROD] Nome do backend ausente para Maven verify.
  exit /b 1
)
if not exist "%~1\mvnw.cmd" (
  echo [Rodogarcia PROD] Maven Wrapper nao encontrado para %~2.
  exit /b 1
)

echo [Rodogarcia PROD] Executando Maven verify do %~2...
pushd "%~1"
call mvnw.cmd -B -ntp clean verify
set "COMMAND_EXIT_CODE=%ERRORLEVEL%"
if not "%COMMAND_EXIT_CODE%"=="0" (
  popd
  exit /b 1
)
popd
exit /b 0

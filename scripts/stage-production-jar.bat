@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "ERRORLEVEL="

if "%~1"=="" (
  echo [Rodogarcia PROD] Diretorio do JAR ausente.
  exit /b 1
)
if "%~2"=="" (
  echo [Rodogarcia PROD] Destino de staging do JAR ausente.
  exit /b 1
)
if not exist "%~1\target\server.jar" (
  echo [Rodogarcia PROD] JAR verificado ausente: %~1\target\server.jar
  exit /b 1
)

if exist "%~2" rmdir /s /q "%~2"
if exist "%~2" exit /b 1
mkdir "%~2"
if not "%ERRORLEVEL%"=="0" exit /b 1
copy /y "%~1\target\server.jar" "%~2\server.jar" >nul
if not "%ERRORLEVEL%"=="0" exit /b 1
exit /b 0

@echo off
setlocal EnableExtensions DisableDelayedExpansion

if "%~1"=="" exit /b 1
if "%~2"=="" exit /b 1
if "%~3"=="" exit /b 1
if "%~4"=="" exit /b 1
if not exist "%~1\package.json" exit /b 1

set "NEXT_BUILD_DIST_DIR=%~3"
set "PROD_ARTIFACT_DIR=%~4"
set "RODOGARCIA_ISOLATED_PREFLIGHT=%~5"

pushd "%~1"
if not "%ERRORLEVEL%"=="0" (
  endlocal & exit /b 1
)

call npm run build:prod
set "BUILD_EXIT_CODE=%ERRORLEVEL%"
popd

if not "%BUILD_EXIT_CODE%"=="0" (
  endlocal & exit /b 1
)

endlocal & exit /b 0

@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "MISSING_ACTIVE_ARTIFACTS="
for %%A in (
  "site\backend\dist\server.jar"
  "cms\backend\dist\server.jar"
  "site\frontend\dist-prod\server.js"
  "cms\frontend\dist-prod\server.js"
) do (
  if not exist "%%~A" set "MISSING_ACTIVE_ARTIFACTS=1"
)

if not defined MISSING_ACTIVE_ARTIFACTS exit /b 0
if "%~1"=="1" exit /b 0

echo [Rodogarcia PROD] Artefatos ativos de Site/CMS ausentes. Este e um rollout inicial.
echo [Rodogarcia PROD] Execute com RODOGARCIA_INITIAL_PROD_ROLLOUT=1 somente apos backup e revisao final.
exit /b 1

@echo off
setlocal EnableExtensions DisableDelayedExpansion

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0assert-production-preflight-isolated.ps1"
set "ASSERT_EXIT_CODE=%ERRORLEVEL%"

if not "%ASSERT_EXIT_CODE%"=="0" (
  endlocal & exit /b 1
)

endlocal & exit /b 0

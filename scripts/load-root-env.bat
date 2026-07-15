@echo off
rem Carrega um arquivo .env simples no processo chamador. Nao use setlocal aqui:
rem as variaveis precisam continuar disponiveis para o script que fez o call.
if "%~1"=="" exit /b 1
if not exist "%~1" exit /b 1

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~1") do (
  if not "%%A"=="" set "%%A=%%B"
)

exit /b 0

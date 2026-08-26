@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"

title Rodogarcia - Producao

set "ENV_FILE=%RODOGARCIA_ENV_FILE%"
if not defined ENV_FILE (
  if exist ".env.production.local" (
    set "ENV_FILE=.env.production.local"
  ) else (
    set "ENV_FILE=.env"
  )
)

if not exist "%ENV_FILE%" (
  echo [Rodogarcia PROD] Arquivo de ambiente nao encontrado: %ENV_FILE%
  echo Copie .env.production.example para .env.production.local ou configure RODOGARCIA_ENV_FILE.
  exit /b 1
)

call "%~dp0scripts\load-root-env.bat" "%ENV_FILE%"
if errorlevel 1 exit /b 1
set "RODOGARCIA_ENV_FILE=%ENV_FILE%"

where pm2 >nul 2>&1
if errorlevel 1 (
  echo [Rodogarcia PROD] PM2 nao encontrado. Instale com: npm install -g pm2
  exit /b 1
)

rem Os quatro processos de producao ficam privados; o tunnel/reverse proxy e a unica borda publica.
rem O Landing Builder e independente: este script nao instala, interrompe, valida nem inicia seus processos.
rem LANDING_BUILDER_PUBLIC_URL e mantida apenas como fallback opcional de slugs no site publico.
set "NODE_ENV=production"
set "HOST=127.0.0.1"
set "PORT=6050"
set "BACKEND_INTERNAL_URL=http://127.0.0.1:6050"
set "CMS_BACKEND_INTERNAL_URL=http://127.0.0.1:6051"
set "CMS_INTERNAL_URL=http://127.0.0.1:6061"
set "CMS_BACKEND_PROXY_URL=http://127.0.0.1:6051"
if not defined NEXT_PUBLIC_SITE_URL set "NEXT_PUBLIC_SITE_URL=https://site.rodogarcia.com.br"
set "PRODUCTION_SITE_URL=%NEXT_PUBLIC_SITE_URL%"
set "PRODUCTION_PUBLIC_BACKEND_URL=%NEXT_PUBLIC_BACKEND_URL%"
set "PRODUCTION_LANDING_BUILDER_PUBLIC_URL=%LANDING_BUILDER_PUBLIC_URL%"

rem O hardening preserva as portas isoladas padrao (4010/5411/5413/5414).
rem Nao aponte SECURITY_TEST_* para os processos ativos de producao.
set "SECURITY_TEST_BACKEND_PORT="
set "SECURITY_TEST_FRONTEND_PORT="
set "SECURITY_TEST_CMS_BACKEND_PORT="
set "SECURITY_TEST_CMS_PORT="
set "SECURITY_TEST_BACKEND_ARTIFACT_DIR=site\backend\dist.test"
set "SECURITY_TEST_CMS_BACKEND_ARTIFACT_DIR=cms\backend\dist.test"
set "SECURITY_TEST_FRONTEND_ARTIFACT_DIR=site\frontend\dist-prod.test"
set "SECURITY_TEST_CMS_ARTIFACT_DIR=cms\frontend\dist-prod.test"

echo [Rodogarcia PROD] Ambiente: %ENV_FILE%
echo [Rodogarcia PROD] Pre-flight iniciado; os processos PM2 ativos permanecem atendendo.

echo [Rodogarcia PROD] Instalando dependencias exatas a partir dos lockfiles...
call :install_locked "site\backend" "backend"
if errorlevel 1 goto :preflight_failed
call :install_locked "cms\backend" "backend do CMS"
if errorlevel 1 goto :preflight_failed
call :install_locked "site\frontend" "site"
if errorlevel 1 goto :preflight_failed
call :install_locked "cms\frontend" "CMS"
if errorlevel 1 goto :preflight_failed

echo [Rodogarcia PROD] Sincronizando e validando uploads no volume persistente...
node scripts\sync-production-uploads.js --env-file "%ENV_FILE%" --apply
if errorlevel 1 goto :preflight_failed

echo [Rodogarcia PROD] Validando backend...
pushd site\backend
call npm run typecheck
if errorlevel 1 (
  popd
  goto :preflight_failed
)
rem A suite importa services que carregam env.ts; teste nao deve herdar o hardening do boot PROD.
set "NODE_ENV=test"
call npm test
if errorlevel 1 (
  set "NODE_ENV=production"
  popd
  goto :preflight_failed
)
set "NODE_ENV=production"
popd

echo [Rodogarcia PROD] Validando backend do CMS...
pushd cms\backend
call npm run typecheck
if errorlevel 1 (
  popd
  goto :preflight_failed
)
rem A suite do CMS também carrega env.ts; mantenha o ambiente de teste isolado do boot PROD.
set "NODE_ENV=test"
call npm test
if errorlevel 1 (
  set "NODE_ENV=production"
  popd
  goto :preflight_failed
)
set "NODE_ENV=production"
popd

echo [Rodogarcia PROD] Validando site publico...
pushd site\frontend
call npm run typecheck
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Validando CMS...
pushd cms\frontend
call npm run typecheck
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Gerando artefato isolado de teste do backend em site\backend\dist.test...
call :configure_test_build
pushd site\backend
call npm run build -- --outDir dist.test
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Gerando artefato isolado de teste do backend do CMS em cms\backend\dist.test...
pushd cms\backend
call npm run build -- --outDir dist.test
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Gerando artefato isolado de teste do site em site\frontend\dist-prod.test...
pushd site\frontend
call npm run build:prod
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Gerando artefato isolado de teste do CMS em cms\frontend\dist-prod.test...
pushd cms\frontend
call npm run build:prod
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Executando hardening ponta a ponta em portas isoladas...
node scripts\tests\test-security-hardening.js
if errorlevel 1 goto :preflight_failed

set "SECURITY_TEST_FRONTEND_ARTIFACT_DIR="
set "SECURITY_TEST_CMS_ARTIFACT_DIR="
set "SECURITY_TEST_BACKEND_ARTIFACT_DIR="
set "SECURITY_TEST_CMS_BACKEND_ARTIFACT_DIR="
echo [Rodogarcia PROD] Gerando artefato candidato do backend em site\backend\dist.next...
call :configure_production_build
pushd site\backend
call npm run build -- --outDir dist.next
if errorlevel 1 (
  popd
  goto :preflight_failed
)
node --input-type=module --eval "import('./dist.next/config/env.js')"
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Gerando artefato candidato do backend do CMS em cms\backend\dist.next...
pushd cms\backend
call npm run build -- --outDir dist.next
if errorlevel 1 (
  popd
  goto :preflight_failed
)
node --input-type=module --eval "import('./dist.next/config/env.js')"
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Gerando artefato candidato do site em site\frontend\dist-prod.next...
pushd site\frontend
call npm run build:prod
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Gerando artefato candidato do CMS em cms\frontend\dist-prod.next...
pushd cms\frontend
call npm run build:prod
if errorlevel 1 (
  popd
  goto :preflight_failed
)
popd

echo [Rodogarcia PROD] Validando os artefatos candidatos de producao...
node scripts\promote-production-artifacts.js --verify
if errorlevel 1 goto :preflight_failed

set "PROD_ARTIFACT_DIR="
echo [Rodogarcia PROD] Pre-flight aprovado. Iniciando a curta troca dos processos PM2...

rem So processos PM2 conhecidos sao interrompidos. Nao mate processos desconhecidos que usem as portas.
call pm2 delete rodogarcia-backend-prod >nul 2>&1
call pm2 delete rodogarcia-cms-backend-prod >nul 2>&1
call pm2 delete rodogarcia-frontend-prod >nul 2>&1
call pm2 delete rodogarcia-cms-prod >nul 2>&1
call :wait_for_ports_free
if errorlevel 1 goto :restore_previous_processes

echo [Rodogarcia PROD] Promovendo os artefatos candidatos...
node scripts\promote-production-artifacts.js --promote
if errorlevel 1 goto :restore_previous_processes

echo [Rodogarcia PROD] Iniciando backend, backend do CMS, site e CMS com PM2...
if not exist "logs" mkdir "logs"
call pm2 startOrReload ecosystem.config.js --env production --update-env
if errorlevel 1 goto :rollback

call :wait_for_release
if errorlevel 1 goto :rollback

call pm2 save
if errorlevel 1 (
  echo [Rodogarcia PROD] Os processos estao saudaveis, mas pm2 save falhou. Corrija antes de reiniciar a VM.
  endlocal
  exit /b 1
)

echo.
echo [Rodogarcia PROD] Backend Cloudflare:  https://sitebackend.rodogarcia.com.br ^> http://127.0.0.1:6050
echo [Rodogarcia PROD] CMS API privada:    http://127.0.0.1:6051
echo [Rodogarcia PROD] Frontend Cloudflare: https://site.rodogarcia.com.br ^> http://127.0.0.1:6060
echo [Rodogarcia PROD] CMS privado:        http://127.0.0.1:6061 ^> https://site.rodogarcia.com.br/admin
echo [Rodogarcia PROD] Status: pm2 status rodogarcia-backend-prod rodogarcia-cms-backend-prod rodogarcia-frontend-prod rodogarcia-cms-prod

endlocal
exit /b 0

:install_locked
echo [Rodogarcia PROD] npm ci em %~2...
pushd "%~1"
call npm ci
set "INSTALL_EXIT=%ERRORLEVEL%"
popd
exit /b %INSTALL_EXIT%

:configure_test_build
set "BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_PROXY_URL="
set "BACKEND_INTERNAL_URL=http://127.0.0.1:4010"
set "CMS_BACKEND_INTERNAL_URL=http://127.0.0.1:5414"
set "CMS_INTERNAL_URL=http://127.0.0.1:5413"
set "CMS_BACKEND_PROXY_URL=http://127.0.0.1:5414"
set "NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4010"
set "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:5411"
rem O hardening isolado nao deve depender de uma instancia externa do Landing Builder.
set "LANDING_BUILDER_API_URL="
set "LANDING_BUILDER_SERVICE_TOKEN="
set "LANDING_BUILDER_PUBLIC_URL="
set "PROD_ARTIFACT_DIR=dist-prod.test"
exit /b 0

:configure_production_build
set "BACKEND_PROXY_URL="
set "NEXT_PUBLIC_BACKEND_PROXY_URL="
set "BACKEND_INTERNAL_URL=http://127.0.0.1:6050"
set "CMS_BACKEND_INTERNAL_URL=http://127.0.0.1:6051"
set "CMS_INTERNAL_URL=http://127.0.0.1:6061"
set "CMS_BACKEND_PROXY_URL=http://127.0.0.1:6051"
set "NEXT_PUBLIC_BACKEND_URL=%PRODUCTION_PUBLIC_BACKEND_URL%"
set "NEXT_PUBLIC_SITE_URL=%PRODUCTION_SITE_URL%"
set "LANDING_BUILDER_PUBLIC_URL=%PRODUCTION_LANDING_BUILDER_PUBLIC_URL%"
set "PROD_ARTIFACT_DIR=dist-prod.next"
exit /b 0

:wait_for_ports_free
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(6050,6051,6060,6061); $deadline=(Get-Date).AddSeconds(20); do { $listeners=Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort }; if (-not $listeners) { exit 0 }; Start-Sleep -Milliseconds 500 } while ((Get-Date) -lt $deadline); $listeners | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize | Out-String | Write-Error; exit 1"
exit /b %ERRORLEVEL%

:wait_for_release
echo [Rodogarcia PROD] Verificando os backends e gateway do CMS...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$urls=@('http://127.0.0.1:6050/health','http://127.0.0.1:6051/health','http://127.0.0.1:6060/admin/auth/entrar'); $deadline=(Get-Date).AddSeconds(30); do { $ready=$true; foreach ($url in $urls) { try { $response=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5; if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) { $ready=$false; break } } catch { $ready=$false; break } }; if ($ready) { exit 0 }; Start-Sleep -Milliseconds 500 } while ((Get-Date) -lt $deadline); Write-Error 'Backend, backend do CMS ou gateway CMS indisponivel.'; exit 1"
exit /b %ERRORLEVEL%

:restore_previous_processes
echo [Rodogarcia PROD] Nenhum artefato candidato foi ativado; tentando restaurar os processos anteriores...
call pm2 startOrReload ecosystem.config.js --env production --update-env
if errorlevel 1 (
  echo [Rodogarcia PROD] Nao foi possivel restaurar os processos anteriores automaticamente.
  endlocal
  exit /b 1
)
call :wait_for_release
if errorlevel 1 (
  echo [Rodogarcia PROD] A restauracao automatica nao passou no health do backend ou gateway.
  endlocal
  exit /b 1
)
call pm2 save >nul 2>&1
echo [Rodogarcia PROD] Processos anteriores restaurados; nenhum artefato candidato foi publicado.
endlocal
exit /b 1

:rollback
echo [Rodogarcia PROD] A nova versao nao passou no health; revertendo para os artefatos anteriores...
call pm2 delete rodogarcia-backend-prod >nul 2>&1
call pm2 delete rodogarcia-cms-backend-prod >nul 2>&1
call pm2 delete rodogarcia-frontend-prod >nul 2>&1
call pm2 delete rodogarcia-cms-prod >nul 2>&1
call :wait_for_ports_free
if errorlevel 1 (
  echo [Rodogarcia PROD] As portas continuam ocupadas; rollback automatico interrompido.
  endlocal
  exit /b 1
)
node scripts\promote-production-artifacts.js --rollback
if errorlevel 1 (
  echo [Rodogarcia PROD] Nao foi possivel restaurar os artefatos anteriores automaticamente.
  endlocal
  exit /b 1
)
call pm2 startOrReload ecosystem.config.js --env production --update-env
if errorlevel 1 (
  echo [Rodogarcia PROD] Os artefatos anteriores foram restaurados, mas o PM2 nao iniciou.
  endlocal
  exit /b 1
)
call :wait_for_release
if errorlevel 1 (
  echo [Rodogarcia PROD] Rollback aplicado, mas o backend ou gateway anterior nao passou no health.
  endlocal
  exit /b 1
)
call pm2 save >nul 2>&1
echo [Rodogarcia PROD] Rollback concluido; a versao candidata foi preservada para diagnostico.
endlocal
exit /b 1

:preflight_failed
set "PROD_ARTIFACT_DIR="
set "SECURITY_TEST_BACKEND_ARTIFACT_DIR="
set "SECURITY_TEST_CMS_BACKEND_ARTIFACT_DIR="
set "SECURITY_TEST_FRONTEND_ARTIFACT_DIR="
set "SECURITY_TEST_CMS_ARTIFACT_DIR="
echo [Rodogarcia PROD] Pre-flight interrompido; os processos PM2 ativos nao foram alterados.
endlocal
exit /b 1

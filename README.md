# Site Rodogarcia Transportes

Monorepo com site público, CMS separado e dois backends por ownership:

- `site/frontend/`: Next.js, React e TypeScript do site público; encaminha `/admin/*` ao CMS privado.
- `cms/frontend/`: Next.js, React e TypeScript do painel administrativo, com `basePath: "/admin"`.
- `cms/backend/`: Express, autenticação, administração, conteúdo, mídia, uploads, sessões e demais dados do CMS.
- `site/backend/`: Express público para ESL e consultas de CEP/CNPJ.

## Raiz do repositorio

A raiz fica reservada para arquivos globais:

- `.env.development.local` e `.env.production.local`: configuracoes locais ignoradas pelo Git.
- `.env.development.example`, `.env.production.example` e `.env.example`: modelos de ambiente.
- `docs/`: documentacao tecnica curta.
- `scripts/`: testes e automacoes globais.
- `site/frontend/`, `site/backend/`, `cms/frontend/` e `cms/backend/`: projetos isolados.
- `shared/`: contratos e helpers reutilizados por site e CMS, sem dependência de app.

Mantenha a raiz apenas para entradas globais: não deixe código de app, `node_modules`, builds ou arquivos temporários soltos. Backups e logs de operação ficam exclusivamente em `backups/` e `logs/`, ambos ignorados pelo Git.

## Desenvolvimento Local

Instale as dependencias separadamente:

```powershell
cd site\backend
cmd /c npm install

cd ..\frontend
cmd /c npm install

cd ..\..\cms\frontend
cmd /c npm install

cd ..\backend
cmd /c npm install
```

Configure o ambiente de desenvolvimento:

```powershell
Copy-Item .env.development.example .env.development.local
```

Suba os serviços de desenvolvimento:

```powershell
cmd /c iniciar-dev.bat
```

O modo DEV é iniciado manualmente pelo responsável. `iniciar-dev.bat` usa somente portas de cinco dígitos e encerra exclusivamente processos identificados como deste repositório; se alguma delas pertencer a outro projeto, ele aborta sem encerrar nada. Depois limpa os caches gerados do Next e inicia backend público, API CMS, site, painel CMS, API do Landing Builder e renderizador de campanhas no terminal atual. O token entre CMS e Builder é privado; se não existir no ambiente, o script gera um token forte apenas para a sessão atual.

URLs padrao:

- Frontend: `http://127.0.0.1:35180`
- Backend público: `http://127.0.0.1:31012`
- API CMS privada: `http://127.0.0.1:31013`
- CMS pelo gateway: `http://127.0.0.1:35180/admin/auth/entrar`
- CMS direto, somente para desenvolvimento: `http://127.0.0.1:35013/admin/auth/entrar`
- API do Landing Builder: `http://127.0.0.1:36110`
- Landing Builder: `http://127.0.0.1:35112`

Para ver o DEV em outra máquina, crie um Dev Tunnel para a porta local `35180`. A URL pública é temporária e não deve ser salva no `.env`; em desenvolvimento, apenas hosts HTTPS válidos de `*.devtunnels.ms` são aceitos nas mutações.

## Producao local e tunnel

O site não pode ser exportado como HTML estático: ele usa Server Components, rewrites para as APIs e o CMS. Em produção, há seis artefatos privados: `site/backend/dist`, `cms/backend/dist`, `site/frontend/dist-prod`, `cms/frontend/dist-prod`, `landing-builder/backend/dist` e `landing-builder/frontend/dist-prod`.

Copie `.env.production.example` para `.env.production.local`, preencha segredos, origens HTTPS e o volume persistente. A execução é exclusivamente manual pela equipe responsável, em janela autorizada:

```powershell
cmd /c iniciar-prod.bat
```

O script executa `npm ci` pelos lockfiles, valida ambiente, typecheck, testes dos três backends, builds e hardening dos quatro artefatos centrais antes de interromper os processos ativos. Após o pre-flight, gera os candidatos do Builder, promove os seis artefatos, inicia os processos privados e reverte os artefatos anteriores se algum health falhar. Antes do primeiro rollout da topologia, a equipe precisa conferir os artefatos ativos ou aprovar um fluxo inicial explícito; um processo sem versão anterior remove somente sua candidata no rollback:

- Site Next: `127.0.0.1:41060`
- Backend público Express: `127.0.0.1:41050`
- API CMS Express: `127.0.0.1:41051`
- CMS Next privado: `127.0.0.1:41061`
- API do Landing Builder: `127.0.0.1:41110`
- Landing Builder: `127.0.0.1:41112`

O Cloudflare publica somente o hostname do site em `41060`; `/admin` é encaminhado internamente para o CMS em `41061`. Consulte `docs/operacao-producao.md` para o contrato de ambiente, storage e tunnel.

## Estrutura

- `site/backend/src`: API pública de ESL, CEP/CNPJ e seus limites operacionais.
- `cms/backend/src/controllers`, `services`, `repositories` e `security`: API administrativa, sessão, CSRF, ACL, mídia/uploads e escritor único do storage administrativo.
- `site/frontend/src/app`: rotas públicas do site.
- `cms/frontend/src/app/auth` e `cms/frontend/src/app/developer`: painel CMS sob `/admin`.

## Persistencia

O storage inicial continua em JSON, agora dentro de `site/backend/storage`.
Arquivos privados ficam em `site/backend/storage/private`.
Não há cópia de storage para `cms/backend`: ele usa o mesmo volume físico e é o único writer de suas coleções. O backend público não grava conteúdo, uploads, sessões ou dados administrativos. Os inicializadores carregam primeiro `.env.development.local` ou `.env.production.local`, cujos valores prevalecem no processo iniciado.

Arquivos novos de operacao:

- `site/backend/storage/media-library.json`: indice da biblioteca de midia do CMS.
- `site/backend/storage/media-slots.json`: slots de midia usados pelo site.
- `site/backend/storage/private/cookie-consents.json`: registros LGPD de consentimento.
- `site/backend/storage/private/tracking-events.json`: eventos agregados e anonimizados.

Backups e restore do storage local:

```powershell
node scripts/backup-storage.js
node scripts/restore-storage.js --backup backups/storage-... --confirm-restore
```

Runbook completo: `docs/backup-restore-json.md`.

## Midia e Uploads

Toda imagem selecionada pelo CMS deve vir da biblioteca. Campos de midia do painel usam picker e o backend rejeita `http://`, `https://`, `data:`, `javascript:`, path traversal e arquivos nao existentes.

Uploads de imagem aceitam PNG, JPG, WebP e AVIF, validam assinatura real do arquivo e geram WebP principal, thumbnail, medium e large. Variaveis opcionais:

```env
MEDIA_WEBP_QUALITY=82
MEDIA_WEBP_THUMB_QUALITY=72
MEDIA_WEBP_MEDIUM_WIDTH=960
MEDIA_WEBP_LARGE_WIDTH=1440
MEDIA_WEBP_OPTIMIZED_WIDTH=1920
```

Videos continuam como MP4, WebM ou Ogg. Eles nao sao convertidos para WebP; posters devem ser imagens WebP selecionadas da biblioteca.

## LGPD, Cookies e Analytics

O banner grava consentimento em `localStorage`, permite reabrir preferencias e remove cookies opcionais conhecidos quando o usuario rejeita ou revoga analytics/marketing. Scripts externos de analytics so carregam apos consentimento.

O CMS possui o modulo `Developer > Consentimentos`, que consulta `/api/admin/cookie-consents` com filtros por status e device. O endpoint publico `/api/consent-events` registra decisao, categorias, versao, user agent, device, IP mascarado, scripts carregados e falhas.

Eventos internos suportados incluem page view, scroll depth, clique, CTA, outbound link, download, formulario start/submit/success/fail, tempo na pagina e sessao.

## Verificacao

```powershell
cd site\backend
cmd /c npm run typecheck
cmd /c npm run build
cmd /c npm test

cd ..\frontend
cmd /c npm run typecheck
cmd /c npm run build

cd ..\..\cms\frontend
cmd /c npm run typecheck
cmd /c npm run build

cd ..\backend
cmd /c npm run typecheck
cmd /c npm run build
cmd /c npm test
```

Auditoria de dependencias:

```powershell
cd site\backend
cmd /c npm audit --audit-level=moderate

cd ..\frontend
cmd /c npm audit --audit-level=moderate
```

O teste de seguranca global sobe servidores em storage temporario:

O hardening só aceita os artefatos isolados preparados pelo pré-flight; ele recusa
`.next` e artefatos ativos para não atingir dados ou processos de produção.

```powershell
$env:SECURITY_TEST_BACKEND_ARTIFACT_DIR = "site/backend/dist.test"
$env:SECURITY_TEST_CMS_BACKEND_ARTIFACT_DIR = "cms/backend/dist.test"
$env:SECURITY_TEST_FRONTEND_ARTIFACT_DIR = "site/frontend/dist-prod.test"
$env:SECURITY_TEST_CMS_ARTIFACT_DIR = "cms/frontend/dist-prod.test"
node scripts/tests/test-security-hardening.js
```

## Deploy

Antes de publicar, confirme:

- `JWT_SECRET` ou `SESSION_SECRET` forte, `ADMIN_SETUP_CODE` forte, `ESL_OPERATION_SECRET` forte e distinto, `FRONTEND_ORIGIN` HTTPS e `CORS_ORIGINS` HTTPS configurados.
- `STORAGE_ROOT` apontando para volume persistente.
- `UPLOADS_DIR` persistente e servido apenas como arquivo estatico com `nosniff`.
- Nenhum script de analytics configurado sem banner de consentimento ativo.
- Backups dos JSON privados antes de migracoes ou deploys grandes.
- Execução manual via `iniciar-prod.bat` ou gerenciador de processos equivalente, sempre com site, painel CMS, API CMS, backend público e os dois processos do Landing Builder ligados apenas em `127.0.0.1`; a API e o painel CMS não recebem hostname público próprio.

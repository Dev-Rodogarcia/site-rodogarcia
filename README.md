# Site Rodogarcia Transportes

Monorepo do site institucional, CMS interno e Landing Builder:

- `site/frontend/`: Next.js, React e TypeScript do site público; encaminha `/admin/*` ao CMS privado.
- `site/backend/`: Java 21/Spring Boot MVC da API pública de ESL e consultas de CEP/CNPJ.
- `cms/frontend/`: Next.js, React e TypeScript do painel administrativo, com `basePath: "/admin"`.
- `cms/backend/`: Java 21/Spring Boot MVC da API administrativa, incluindo autenticação, CMS, mídia, uploads e dados operacionais.
- `landing-builder/frontend/` e `landing-builder/backend/`: renderizador e API Spring MVC isolados de campanhas.

## Raiz do repositório

A raiz é reservada para arquivos globais:

- `.env.development.example`, `.env.production.example` e `.env.example`: modelos de ambiente.
- `docs/`: documentação técnica e operacional.
- `scripts/`: automações globais, backups e testes isolados.
- `site/`, `cms/`, `landing-builder/` e `shared/`: aplicações e contratos do monorepo.

Não deixe código de aplicação, `node_modules`, builds, logs, backups ou arquivos temporários soltos na raiz. Backups e logs operacionais ficam em diretórios ignorados pelo Git.

## Desenvolvimento local

Instale Java 21 e as dependências Node dos frontends. Os três backends Spring usam Maven Wrapper:

```powershell
cd site\backend
cmd /c mvnw.cmd -B clean verify

cd ..\..\cms\backend
cmd /c mvnw.cmd -B clean verify

cd ..\frontend
cmd /c npm ci

cd ..\..\cms\frontend
cmd /c npm ci

cd ..\..\landing-builder\backend
cmd /c mvnw.cmd -B clean verify

cd ..\frontend
cmd /c npm ci
```

Configure o ambiente de desenvolvimento:

```powershell
Copy-Item .env.development.example .env.development.local
```

O fluxo integrado é iniciado manualmente pelo responsável com `iniciar-dev.bat`. Ele usa Spring nas APIs pública (`31012`) e CMS (`31013`), mantendo site (`35180`), CMS Next (`35013`) e Builder (`36110`/`35112`) nas mesmas portas privadas.

URLs locais:

- Site: `http://127.0.0.1:35180`
- API pública: `http://127.0.0.1:31012/health`
- CMS pelo gateway: `http://127.0.0.1:35180/admin/auth/entrar`
- CMS direto, somente para diagnóstico DEV: `http://127.0.0.1:35013/admin/auth/entrar`
- API CMS: `http://127.0.0.1:31013/health`
- API e frontend do Landing Builder: `http://127.0.0.1:36110` e `http://127.0.0.1:35112`

## Produção e tunnel

O site não pode ser exportado como HTML estático: usa Server Components, headers e rewrites internos. Os seis artefatos privados são:

- `site/backend/dist/server.jar`
- `cms/backend/dist/server.jar`
- `site/frontend/dist-prod/server.js`
- `cms/frontend/dist-prod/server.js`
- `landing-builder/backend/dist/server.jar`
- `landing-builder/frontend/dist-prod/server.js`

Copie `.env.production.example` para `.env.production.local`, preencha segredos, origens HTTPS, `FFMPEG_PATH` dos backends CMS e Landing Builder e os volumes persistentes. A execução de `iniciar-prod.bat` e qualquer operação de PM2 pertence exclusivamente à equipe responsável em janela autorizada.

Os binds de produção são `6050` (API pública Spring), `6051` (API CMS Spring), `6060` (site), `6061` (CMS), `41110` (API Builder Spring) e `41112` (frontend Builder). O Cloudflare publica o site em `6060` e, quando necessário, a API pública em `6050`; API e painel CMS permanecem privados.

## Estrutura e persistência

`site/backend/storage` é o volume JSON canônico. A API CMS Spring é a única escritora de conteúdo, SEO, mídia/uploads, formulários, sessões, auditoria e coleções administrativas; a API pública Spring grava somente seu rate limit operacional. Não copie o storage para os diretórios de runtime.

Os principais dados privados continuam em `site/backend/storage/private/**` e uploads em `site/backend/storage/uploads/**`; ambos ficam fora do Git. Backups e restore usam:

```powershell
node scripts/backup-storage.js --source "<STORAGE_ROOT absoluto>"
node scripts/restore-storage.js --backup backups/storage-... --target "<STORAGE_ROOT absoluto>" --confirm-restore
```

O runbook completo está em `docs/backup-restore-json.md`.

## Verificação

```powershell
cd site\backend
cmd /c mvnw.cmd -B clean verify

cd ..\..\cms\backend
cmd /c mvnw.cmd -B clean verify

cd ..\frontend
cmd /c npm run typecheck
cmd /c npm run build

cd ..\..\cms\frontend
cmd /c npm run typecheck
cmd /c npm run build

cd ..\..\landing-builder\backend
cmd /c mvnw.cmd -B clean verify

cd ..\frontend
cmd /c npm run typecheck
cmd /c npm run build
```

O hardening global usa somente artefatos isolados: `site/backend/dist.test/server.jar`, `cms/backend/dist.test/server.jar`, `site/frontend/dist-prod.test` e `cms/frontend/dist-prod.test`. Consulte `scripts/README.md` antes de executá-lo.

## Deploy

Antes de publicar, confirme:

- `JWT_SECRET` ou `SESSION_SECRET`, `ADMIN_SETUP_CODE` e `ESL_OPERATION_SECRET` fortes e distintos;
- `FRONTEND_ORIGIN` e `CORS_ORIGINS` HTTPS;
- `STORAGE_ROOT` e `UPLOADS_DIR` apontando para volume persistente;
- `FFMPEG_PATH` absoluto, existente e fora do repositório para os backends Spring do CMS e Landing Builder;
- consentimento ativo antes de qualquer script opcional de analytics;
- backup conferido antes de migrações ou deploys grandes.

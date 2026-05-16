# Site Rodogarcia Transportes

Monorepo separado em dois projetos independentes:

- `frontend/`: Next.js, React, TypeScript, UI publica e painel CMS.
- `backend/`: Node.js, Express, TypeScript, APIs, autenticacao, regras de negocio, storage JSON e seguranca.

## Raiz do repositorio

A raiz fica reservada para arquivos globais:

- `.env` e `.env.example`: configuracao local do monorepo.
- `docs/`: documentacao tecnica curta.
- `scripts/`: testes e automacoes globais.
- `frontend/` e `backend/`: projetos isolados.

Nao mantenha codigo de app, `node_modules`, builds, backups, guias de agente ou arquivos temporarios na raiz.

## Desenvolvimento Local

Instale as dependencias separadamente:

```powershell
cd backend
cmd /c npm install

cd ..\frontend
cmd /c npm install
```

Configure o ambiente:

```powershell
Copy-Item .env.example .env
```

Suba os dois servidores:

```powershell
cd backend
cmd /c npm run dev

cd ..\frontend
cmd /c npm run dev
```

Tambem e possivel usar `iniciar.bat` a partir da raiz. Ele encerra processos antigos nas portas padrao e abre backend e frontend em janelas separadas.

URLs padrao:

- Frontend: `http://127.0.0.1:5010`
- Backend: `http://127.0.0.1:4010`
- CMS: `http://127.0.0.1:5010/auth/entrar`

## Estrutura

- `backend/src/controllers`: entrada HTTP.
- `backend/src/services`: regras de negocio.
- `backend/src/repositories`: persistencia JSON.
- `backend/src/security`: sessao, CSRF, CORS, rate limit e auth.
- `frontend/src/app/developer`: painel visual do CMS.
- `frontend/src/app`: rotas publicas e auth.

## Persistencia

O storage inicial continua em JSON, agora dentro de `backend/storage`.
Arquivos privados ficam em `backend/storage/private`.
O backend carrega `.env` da raiz como fonte local padrao.

Arquivos novos de operacao:

- `backend/storage/media-library.json`: indice da biblioteca de midia do CMS.
- `backend/storage/media-slots.json`: slots de midia usados pelo site.
- `backend/storage/private/cookie-consents.json`: registros LGPD de consentimento.
- `backend/storage/private/tracking-events.json`: eventos agregados e anonimizados.

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
cd backend
cmd /c npm run typecheck
cmd /c npm run build
cmd /c npm test

cd ..\frontend
cmd /c npm run typecheck
cmd /c npm run build
```

Auditoria de dependencias:

```powershell
cd backend
cmd /c npm audit --audit-level=moderate

cd ..\frontend
cmd /c npm audit --audit-level=moderate
```

O teste de seguranca global sobe servidores em storage temporario:

```powershell
node scripts/tests/test-security-hardening.js
```

## Deploy

Antes de publicar, confirme:

- `JWT_SECRET`, `SESSION_SECRET`, `FRONTEND_ORIGIN` e `CORS_ORIGINS` configurados.
- `STORAGE_ROOT` apontando para volume persistente.
- `UPLOADS_DIR` persistente e servido apenas como arquivo estatico com `nosniff`.
- Nenhum script de analytics configurado sem banner de consentimento ativo.
- Backups dos JSON privados antes de migracoes ou deploys grandes.


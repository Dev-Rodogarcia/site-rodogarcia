# CMS Rodogarcia

O CMS é composto pelo painel Next em `cms/frontend` e pela API Java 21/Spring Boot MVC em `cms/backend`. O navegador continua vendo somente o hostname do site e o prefixo `/admin`.

## Desenvolvimento

O modo integrado é iniciado manualmente pelo responsável com `iniciar-dev.bat`. As APIs pública e CMS usam Spring em `31012` e `31013`; site, CMS Next e Landing Builder permanecem em `35180`, `35013`, `36110` e `35112`.

| Serviço | Endereço DEV | Uso |
| --- | --- | --- |
| Site público | `http://127.0.0.1:35180` | Host normal do navegador e gateway. |
| CMS pelo gateway | `http://127.0.0.1:35180/admin/auth/entrar` | Fluxo administrativo normal. |
| CMS direto | `http://127.0.0.1:35013/admin/auth/entrar` | Diagnóstico local do painel. |
| API CMS | `http://127.0.0.1:31013/health` | Serviço privado. |
| API Landing Builder | `http://127.0.0.1:36110` | Integração privada autenticada por token. |
| Landing Builder | `http://127.0.0.1:35112` | Renderizador de campanhas e prévias. |

Validação local:

```bat
cd cms\backend
mvnw.cmd -B clean verify

cd ..\frontend
npm ci
npm run typecheck
npm run build
```

## Variáveis privadas

- `CMS_INTERNAL_URL` encaminha `/admin/*` do site ao painel CMS.
- `CMS_BACKEND_INTERNAL_URL` encaminha APIs e uploads do CMS à porta `31013` no DEV e `6051` no PROD.
- `CMS_BACKEND_PROXY_URL` é usada somente pelo painel aberto diretamente em DEV.
- `CMS_STORAGE_ROOT` e `CMS_UPLOADS_DIR`, quando definidos, apontam para o volume persistente; por padrão ele é `site/backend/storage`.
- `FFMPEG_PATH` é obrigatório em produção e aponta para um executável absoluto, estável e externo ao repositório.
- `NEXT_PUBLIC_SITE_URL` é pública e serve apenas para links, logo, prévias e assets do site.

`cms/backend` é o único escritor de conteúdo, SEO, mídia, uploads, formulários/leads, consentimentos, analytics, popup, melhorias, sessões, usuários, auditoria e scheduler administrativo. O backend público conserva ESL e as consultas de CEP/CNPJ. Não copie JSON, uploads ou sessões para o diretório do CMS.

## Produção

Em produção, a equipe responsável opera seis processos privados:

| Processo | Bind | Artefato |
| --- | --- | --- |
| Backend público Spring | `127.0.0.1:6050` | `site/backend/dist/server.jar` |
| API CMS Spring | `127.0.0.1:6051` | `cms/backend/dist/server.jar` |
| Site Next | `127.0.0.1:6060` | `site/frontend/dist-prod/server.js` |
| CMS Next | `127.0.0.1:6061` | `cms/frontend/dist-prod/server.js` |
| API Landing Builder Spring | `127.0.0.1:41110` | `landing-builder/backend/dist/server.jar` |
| Next Landing Builder | `127.0.0.1:41112` | `landing-builder/frontend/dist-prod/server.js` |

O site encaminha `/admin/*` ao CMS em `6061`, as rotas de ownership administrativo à API em `6051`, e assets, mídia e slugs de campanha ao Builder. Não existe hostname público próprio para API ou painel CMS. Consulte `docs/operacao-producao.md` para backup, hardening e rollout manual.

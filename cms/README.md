# CMS Rodogarcia

O CMS é composto por duas aplicações físicas: o painel Next em `cms/frontend` e sua API Express em `cms/backend`. O navegador continua vendo somente o hostname do site e o prefixo `/admin`.

## Desenvolvimento

O modo integrado é iniciado manualmente pelo responsável com `iniciar-dev.bat`. Ele sobe seis processos locais, todos em portas de cinco dígitos: backend público (`31012`), API do CMS (`31013`), site (`35180`), painel CMS (`35013`), API do Landing Builder (`36110`) e renderizador de campanhas (`35112`).

| Serviço | Endereço DEV | Uso |
| --- | --- | --- |
| Site público | `http://127.0.0.1:35180` | Host normal do navegador e gateway. |
| CMS pelo gateway | `http://127.0.0.1:35180/admin/auth/entrar` | Fluxo administrativo normal. |
| API do Landing Builder | `http://127.0.0.1:36110` | Integração privada autenticada pelo token de serviço. |
| Landing Builder | `http://127.0.0.1:35112` | Renderizador interno de prévias, mídia e campanhas. |
| CMS direto | `http://127.0.0.1:35013/admin/auth/entrar` | Diagnóstico local do painel. |
| API do CMS | `http://127.0.0.1:31013/health` | Serviço privado; não é uma URL de uso do navegador. |
| Backend público | `http://127.0.0.1:31012/health` | ESL e consultas públicas de CEP/CNPJ. |

Para instalar ou validar os projetos separadamente:

```bat
cd cms\backend
npm ci
npm run typecheck

cd ..\frontend
npm ci
npm run typecheck
```

Variáveis privadas:

- `CMS_INTERNAL_URL` encaminha `/admin/*` do site ao painel CMS.
- `CMS_BACKEND_INTERNAL_URL` encaminha, a partir do site, as APIs e uploads de ownership do CMS à API em `31013` no DEV e `41051` no PROD.
- `CMS_BACKEND_PROXY_URL` é usada somente pelo painel aberto diretamente em DEV; aponta para a mesma API do CMS.
- `CMS_STORAGE_ROOT` e `CMS_UPLOADS_DIR`, quando definidos, devem apontar para o mesmo volume persistente do CMS. Na configuração padrão, o root físico continua `site/backend/storage`.
- `NEXT_PUBLIC_SITE_URL` é pública e serve apenas para links, logo, prévias e assets do site.

O `cms/backend` é o único escritor de conteúdo, SEO, mídia, uploads, formulários/leads, consentimentos, analytics, popup, melhorias, sessões, usuários, auditoria e o scheduler administrativo. O backend público conserva ESL e as consultas públicas de CEP/CNPJ. Não copie JSON, uploads ou sessões para `cms/backend`; a separação é de código e processo, não de volume.

## Produção

Esta mudança não inicia nem publica produção. Quando houver janela autorizada, a equipe responsável opera seis processos privados:

| Processo | Bind | Artefato |
| --- | --- | --- |
| Backend público | `127.0.0.1:41050` | `site/backend/dist/server.js` |
| API do CMS | `127.0.0.1:41051` | `cms/backend/dist/server.js` |
| Site Next | `127.0.0.1:41060` | `site/frontend/dist-prod/server.js` |
| CMS Next | `127.0.0.1:41061` | `cms/frontend/dist-prod/server.js` |
| API Landing Builder | `127.0.0.1:41110` | `landing-builder/backend/dist/server.js` |
| Next Landing Builder | `127.0.0.1:41112` | `landing-builder/frontend/dist-prod/server.js` |

O site em `41060` encaminha `/admin/*` ao painel em `41061`, as rotas de ownership do CMS à API em `41051` e os assets, mídia e slugs de campanha ao Builder em `41112`. Não existe hostname, túnel ou CORS público próprio para a API do CMS. Consulte `docs/operacao-producao.md` para o rollout manual, backup e hardening isolado.

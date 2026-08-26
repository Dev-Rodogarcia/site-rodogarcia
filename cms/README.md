# CMS Rodogarcia

O CMS é composto por duas aplicações físicas: o painel Next em `cms/frontend` e sua API Express em `cms/backend`. O navegador continua vendo somente o hostname do site e o prefixo `/admin`.

## Desenvolvimento

O modo integrado é iniciado manualmente pelo responsável com `iniciar-dev.bat`. Ele sobe quatro processos locais: backend público (`4012`), API do CMS (`4013`), site (`5012`) e painel CMS (`5013`).

| Serviço | Endereço DEV | Uso |
| --- | --- | --- |
| Site público | `http://127.0.0.1:5012` | Host normal do navegador e gateway. |
| CMS pelo gateway | `http://127.0.0.1:5012/admin/auth/entrar` | Fluxo administrativo normal. |
| CMS direto | `http://127.0.0.1:5013/admin/auth/entrar` | Diagnóstico local do painel. |
| API do CMS | `http://127.0.0.1:4013/health` | Serviço privado; não é uma URL de uso do navegador. |
| Backend público | `http://127.0.0.1:4012/health` | ESL e consultas públicas de CEP/CNPJ. |

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
- `CMS_BACKEND_INTERNAL_URL` encaminha, a partir do site, as APIs e uploads de ownership do CMS à API em `4013` no DEV e `6051` no PROD.
- `CMS_BACKEND_PROXY_URL` é usada somente pelo painel aberto diretamente em DEV; aponta para a mesma API do CMS.
- `CMS_STORAGE_ROOT` e `CMS_UPLOADS_DIR`, quando definidos, devem apontar para o mesmo volume persistente do CMS. Na configuração padrão, o root físico continua `site/backend/storage`.
- `NEXT_PUBLIC_SITE_URL` é pública e serve apenas para links, logo, prévias e assets do site.

O `cms/backend` é o único escritor de conteúdo, SEO, mídia, uploads, formulários/leads, consentimentos, analytics, popup, melhorias, sessões, usuários, auditoria e o scheduler administrativo. O backend público conserva ESL e as consultas públicas de CEP/CNPJ. Não copie JSON, uploads ou sessões para `cms/backend`; a separação é de código e processo, não de volume.

## Produção

Esta mudança não inicia nem publica produção. Quando houver janela autorizada, a equipe responsável opera quatro processos privados:

| Processo | Bind | Artefato |
| --- | --- | --- |
| Backend público | `127.0.0.1:6050` | `site/backend/dist/server.js` |
| API do CMS | `127.0.0.1:6051` | `cms/backend/dist/server.js` |
| Site Next | `127.0.0.1:6060` | `site/frontend/dist-prod/server.js` |
| CMS Next | `127.0.0.1:6061` | `cms/frontend/dist-prod/server.js` |

O site em `6060` encaminha `/admin/*` ao painel em `6061` e as rotas de ownership do CMS à API em `6051`. Não existe hostname, túnel ou CORS público próprio para a API do CMS. Consulte `docs/operacao-producao.md` para o rollout manual, backup e hardening isolado.

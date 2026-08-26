# Operação de produção

Este documento descreve o rollout manual futuro. A separação de código para `cms/backend` não inicia, reinicia nem publica produção por si só.

## Fronteiras e processos

O Rodogarcia não é uma SPA estática: o site Next renderiza Server Components, aplica headers, encaminha `/admin/*` ao painel e roteia APIs pelo mesmo hostname público. Em uma janela autorizada, a equipe responsável opera quatro processos privados:

| Componente | Bind local | Função |
| --- | --- | --- |
| Express público (`site/backend/dist/server.js`) | `127.0.0.1:6050` | ESL e consultas públicas de CEP/CNPJ. |
| Express do CMS (`cms/backend/dist/server.js`) | `127.0.0.1:6051` | Auth, admin, conteúdo, SEO, mídia, uploads, formulários, consentimento, analytics, popup, leads, sessões e scheduler. |
| Next do site (`site/frontend/dist-prod/server.js`) | `127.0.0.1:6060` | Site público, headers e gateway interno. |
| Next do CMS (`cms/frontend/dist-prod/server.js`) | `127.0.0.1:6061` | Painel com `basePath: /admin`. |

O site em `6060` encaminha `/admin/*` ao painel em `6061`. Também encaminha ao backend do CMS em `6051` as rotas de auth/admin, conteúdo/SEO/mídia, uploads, consentimento, tracking, analytics, popup, formulários, leads e melhorias. ESL, CEP e CNPJ continuam no backend público em `6050`.

Não existe hostname ou ingresso público para a API do CMS. O navegador usa `/api/*` e `/uploads/*` no hostname do site; a escolha do destino é interna ao gateway. O hostname `sitebackend.rodogarcia.com.br`, quando usado, aponta somente ao backend público.

## Persistência e escritor único

O volume canônico permanece em `site/backend/storage`; não copie JSON, uploads, sessões ou logs privados para `cms/backend`. A API do CMS aponta para esse volume por `STORAGE_ROOT` ou, quando necessário, `CMS_STORAGE_ROOT`, e é o único escritor das coleções administrativas. O backend público não grava conteúdo, uploads, usuários, sessões, auditoria ou dados de CMS.

Os rate limits também não concorrem: a API do CMS usa `site/backend/storage/private/cms-rate-limits.json`; o backend público mantém apenas seu arquivo de limite operacional. Antes de backup, restore ou alteração manual do storage, pare os writers autorizados na janela de manutenção; nunca exponha `site/backend/storage/private/**` ou uploads por canais públicos.

## Ambiente

Na VM, crie `.env.production.local` a partir de `.env.production.example`. O arquivo é ignorado pelo Git. Preencha ao menos:

- `FRONTEND_ORIGIN` e `CORS_ORIGINS` com origens HTTPS canônicas.
- `ADMIN_SETUP_CODE`, `SESSION_SECRET` ou `JWT_SECRET` e `ESL_OPERATION_SECRET` com valores fortes e distintos.
- `STORAGE_ROOT` e `UPLOADS_DIR` com caminhos absolutos no volume persistente.
- `TRUST_PROXY=1` quando o Next/tunnel for o salto confiável até os Express.
- `BACKEND_INTERNAL_URL=http://127.0.0.1:6050` para a API pública.
- `CMS_BACKEND_INTERNAL_URL=http://127.0.0.1:6051` e `CMS_BACKEND_PROXY_URL=http://127.0.0.1:6051` para a API do CMS.
- `CMS_INTERNAL_URL=http://127.0.0.1:6061` para o painel CMS.
- `NEXT_PUBLIC_SITE_URL=https://site.rodogarcia.com.br`, variável pública usada somente para links, previews e assets do site.

O `cms/backend` rejeita no boot segredos fracos, placeholders e origens locais ou não HTTPS; o backend público aplica o hardening de origem, mas não recebe segredos de sessão/setup. Variáveis `CMS_*_INTERNAL_URL`, `CMS_BACKEND_PROXY_URL`, secrets e caminhos de storage são privadas; nenhuma delas pode receber prefixo `NEXT_PUBLIC_`.

## DEV manual

O desenvolvimento integrado usa `127.0.0.1:4012` (backend público), `4013` (API CMS), `5012` (site) e `5013` (CMS Next). O responsável inicia esse fluxo manualmente; o endereço normal do painel é `http://127.0.0.1:5012/admin/auth/entrar`, enquanto `5013` serve apenas ao diagnóstico direto do painel.

## PM2 e rollout manual

O `ecosystem.config.js` define `rodogarcia-backend-prod`, `rodogarcia-cms-backend-prod`, `rodogarcia-frontend-prod` e `rodogarcia-cms-prod`, todos com bind local. Ele lê `.env.production.local` (ou o caminho em `RODOGARCIA_ENV_FILE`) sem versionar valores sensíveis.

Somente a equipe responsável, em janela autorizada, pode executar o rollout. Antes disso, ela deve criar e conferir backup manual com `node scripts/backup-storage.js`, migrar e conferir o artefato ativo do site em `site/frontend/dist-prod/server.js` (ou aprovar um fluxo inicial explícito), validar os quatro artefatos candidatos e conferir os health checks de `http://127.0.0.1:6050/health`, `http://127.0.0.1:6051/health` e `http://127.0.0.1:6060/admin/auth/entrar`. O fluxo de promoção preserva `*.previous`, deixa candidata falha em `*.failed` e restaura os artefatos anteriores se o start ou health falhar. No primeiro rollout, como ainda não há `cms/backend/dist` anterior, o rollback remove somente a candidata da API CMS e religa os processos que tinham artefato ativo.

## Cloudflare Tunnel

O arquivo do `cloudflared` pertence à infraestrutura, não ao repositório. O contrato mínimo é:

```yaml
ingress:
  - hostname: site.rodogarcia.com.br
    service: http://127.0.0.1:6060
  - hostname: sitebackend.rodogarcia.com.br
    service: http://127.0.0.1:6050
```

Não crie ingressos para `6051` ou `6061`. No Cloudflare, não faça cache de HTML, `/api/*`, autenticação, CMS ou uploads mutáveis; cache longo cobre somente assets com hash. Bloqueie caminhos de desenvolvimento que não fazem parte do Next de produção, como `/src/*`, `/node_modules/*`, `/@vite/*`, `/@react-refresh/*` e `/@fs/*`.

## Artefatos e hardening isolado

O pré-flight produz quatro artefatos isolados, sem tocar os ativos:

| Artefato | Porta de hardening |
| --- | --- |
| `site/backend/dist.test` | `4010` |
| `cms/backend/dist.test` | `5414` |
| `site/frontend/dist-prod.test` | `5411` |
| `cms/frontend/dist-prod.test` | `5413` |

O hardening só aceita esses diretórios pelas variáveis `SECURITY_TEST_BACKEND_ARTIFACT_DIR`, `SECURITY_TEST_CMS_BACKEND_ARTIFACT_DIR`, `SECURITY_TEST_FRONTEND_ARTIFACT_DIR` e `SECURITY_TEST_CMS_ARTIFACT_DIR`; ele recusa `.next` e artefatos ativos. Depois do hardening aprovado, os quatro candidatos são gerados como `dist.next` ou `dist-prod.next` nas portas privadas `6050`/`6051`/`6060`/`6061`. Nenhum teste deve apontar para processos ou storage de produção.

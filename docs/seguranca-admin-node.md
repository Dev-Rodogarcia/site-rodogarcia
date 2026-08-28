# Checklist de seguranca do CMS

## O que ja esta implementado

- sessao em cookie `HttpOnly`
- `SameSite=Strict`
- `Secure` em producao
- protecao CSRF por `X-CSRF-Token`
- validacao same-origin em rotas mutaveis
- hash de senha novo com `bcrypt`; hashes `PBKDF2` legados continuam verificáveis durante a migração
- rate limit local separado para login e endpoints de captura do CMS (`cms-rate-limits.json`)
- rotas administrativas protegidas por sessao admin
- API CMS isolada em `127.0.0.1:41051` e CMS Next em `127.0.0.1:41061`, expostos apenas pelo gateway same-origin do site
- `.env` centralizado na raiz, fora do versionamento

## Rotas criticas

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/register`
- `/api/admin/**`
- `/api/analytics/config`
- `/api/analytics/stats`
- `/api/leads`
- `/uploads/*`

## Recomendacoes para producao

- usar HTTPS
- rotacionar `ADMIN_SETUP_CODE`
- manter o escritor único: somente `cms/backend` pode gravar usuários, sessões, conteúdo, uploads e dados administrativos no volume do CMS
- adicionar trilha de auditoria para alteracoes no CMS
- manter `site/backend/storage/private/**` fora de qualquer publicacao estatica

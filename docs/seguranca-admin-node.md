# Checklist de seguranca do CMS

## O que ja esta implementado

- sessao em cookie `HttpOnly`
- `SameSite=Strict`
- `Secure` em producao
- protecao CSRF por `X-CSRF-Token`
- validacao same-origin em rotas mutaveis
- hash de senha com `PBKDF2`
- rate limit local para login e endpoints de captura
- rotas administrativas protegidas por sessao admin
- `.env` centralizado na raiz, fora do versionamento

## Rotas criticas

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/register`
- `/api/admin/**`
- `/api/analytics/config`
- `/api/analytics/stats`
- `/api/leads`

## Recomendacoes para producao

- usar HTTPS
- rotacionar `ADMIN_SETUP_CODE`
- mover usuarios, sessoes e rate limit para storage dedicado
- adicionar trilha de auditoria para alteracoes no CMS
- manter `backend/storage/private/**` fora de qualquer publicacao estatica

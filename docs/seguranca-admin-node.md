# Checklist de segurança do CMS

## O que já está implementado

- sessão em cookie `HttpOnly`
- `SameSite=Strict`
- `Secure` em produção
- proteção CSRF por `X-CSRF-Token`
- validação same-origin em rotas mutáveis
- hash de senha com `PBKDF2`
- rate limit local para login e endpoints de captura
- rotas administrativas protegidas por sessão admin

## Rotas críticas

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/register`
- `/api/admin/**`
- `/api/analytics/config`
- `/api/analytics/stats`
- `/api/leads`

## Recomendações para produção

- usar HTTPS
- rotacionar `ADMIN_SETUP_CODE`
- mover usuários, sessões e rate limit para storage dedicado
- adicionar trilha de auditoria para alterações no CMS
- manter `server/storage/private/**` fora de qualquer publicação estática

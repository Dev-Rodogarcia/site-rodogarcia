# Persistência local

Esta pasta concentra os JSONs usados pela aplicação Next.js.

## Arquivos

- `server/storage/content.json`
- `server/storage/site-texts.json`
- `server/storage/popup-config.json`
- `server/storage/popup-leads.json`
- `server/storage/popup-events.json`
- `server/storage/private/users.json`
- `server/storage/private/sessions.json`
- `server/storage/private/analytics.json`
- `server/storage/private/analytics-config.json`
- `server/storage/private/rate-limits.json`

## Regras

- `server/storage/private/**` é área sensível e não deve ser publicada.
- Em produção, o ideal é migrar usuários, sessões e rate limit para stores dedicados.
- Todos os caminhos podem ser sobrescritos por variáveis de ambiente para testes e isolamento local.

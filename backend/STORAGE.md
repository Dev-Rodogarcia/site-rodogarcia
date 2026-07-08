# Persistencia Local

Esta pasta concentra os JSONs usados pelo backend Express.

## Arquivos

- `backend/storage/content.json`
- `backend/storage/site-texts.json`
- `backend/storage/popup-config.json`
- `backend/storage/popup-leads.json`
- `backend/storage/popup-events.json`
- `backend/storage/private/users.json`
- `backend/storage/private/sessions.json`
- `backend/storage/private/analytics.json`
- `backend/storage/private/analytics-config.json`
- `backend/storage/seo-settings.json`
- `backend/storage/consent-settings.json`
- `backend/storage/leads.json`
- `backend/storage/private/tracking-events.json`
- `backend/storage/private/audit-log.json`
- `backend/storage/media-library.json`
- `backend/storage/media-slots.json`
- `backend/storage/private/rate-limits.json`
- `backend/storage/uploads/*`

## Regras

- `backend/storage/private/**` e `backend/storage/uploads/**` nao devem ser publicados no repositorio.
- O backend aceita overrides por variavel de ambiente para testes e deploy.
- Em producao, usuarios, sessoes e rate limit podem migrar para banco/store dedicado sem alterar o frontend.
- Backups completos devem ser feitos com `node scripts/backup-storage.js` a partir da raiz e restaurados com `node scripts/restore-storage.js --backup backups/storage-... --confirm-restore`.
- O runbook operacional fica em `docs/backup-restore-json.md`.

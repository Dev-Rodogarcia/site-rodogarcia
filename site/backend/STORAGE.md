# Persistencia Local

Esta pasta concentra o volume JSON canônico usado pelo backend público e pela API CMS.

## Arquivos

- `site/backend/storage/content.json`
- `site/backend/storage/site-texts.json`
- `site/backend/storage/popup-config.json`
- `site/backend/storage/popup-leads.json`
- `site/backend/storage/popup-events.json`
- `site/backend/storage/private/users.json`
- `site/backend/storage/private/sessions.json`
- `site/backend/storage/private/analytics.json`
- `site/backend/storage/private/analytics-config.json`
- `site/backend/storage/private/cookie-consents.json`
- `site/backend/storage/seo-settings.json`
- `site/backend/storage/consent-settings.json`
- `site/backend/storage/leads.json`
- `site/backend/storage/private/tracking-events.json`
- `site/backend/storage/private/audit-log.json`
- `site/backend/storage/media-library.json`
- `site/backend/storage/media-slots.json`
- `site/backend/storage/private/rate-limits.json`
- `site/backend/storage/private/cms-rate-limits.json`
- `site/backend/storage/uploads/*`
- `site/backend/storage/users.example.json`

## Regras

- `site/backend/storage/private/**` e `site/backend/storage/uploads/**` nao devem ser publicados no repositorio.
- Os backends aceitam overrides por variavel de ambiente para testes e deploy; a API CMS deve continuar apontando para este mesmo volume e é a única escritora das coleções administrativas.
- Em producao, usuarios, sessoes e rate limit podem migrar para banco/store dedicado sem alterar o frontend.
- Backups completos devem ser feitos com `node scripts/backup-storage.js` a partir da raiz e restaurados com `node scripts/restore-storage.js --backup backups/storage-... --confirm-restore`.
- O runbook operacional fica em `docs/backup-restore-json.md`.

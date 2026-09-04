# Persistência local

Esta pasta concentra o volume JSON canônico usado pela API pública Spring e pela API CMS Spring.

## Arquivos relevantes

- `content.json` e `site-texts.json`: conteúdo público canônico.
- `private/users.json`, `private/sessions.json`, `private/analytics.json`, `private/cookie-consents.json` e `private/audit-log.json`: dados administrativos privados.
- `media-library.json`, `media-slots.json` e `uploads/*`: biblioteca e arquivos públicos validados pelo CMS.
- `private/rate-limits.json`: exclusivo da API pública.
- `private/cms-rate-limits.json`: exclusivo da API CMS.

## Regras

- `site/backend/storage/private/**` e `site/backend/storage/uploads/**` não devem ser versionados.
- A API pública Spring e a API CMS Spring aceitam overrides por variável de ambiente para testes e deploy; ambas usam este volume, porém escrevem coleções distintas.
- `site/backend` grava somente seu rate limit operacional. `cms/backend` é o único escritor de conteúdo, uploads, sessões e demais coleções administrativas.
- O Landing Builder mantém volume próprio e nunca grava no storage do site/CMS.
- Escritas JSON passam pelos repositories/armazenamento atômico do runtime; não edite JSON operacional manualmente com writers em execução.
- Backups usam `node scripts/backup-storage.js --source "<STORAGE_ROOT absoluto>"`; restores usam `node scripts/restore-storage.js --backup ... --target "<STORAGE_ROOT absoluto>" --confirm-restore`.

O runbook completo está em `docs/backup-restore-json.md`.

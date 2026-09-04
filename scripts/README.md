# Scripts globais do monorepo

## Testes

- `node scripts/tests/test-security-hardening.js` executa somente com artefatos isolados e storage temporário.
- `node scripts/tests/test-production-operations.js` valida promoção e rollback de artefatos em diretórios temporários.

O hardening usa `site/backend/dist.test/server.jar`, `cms/backend/dist.test/server.jar`, `site/frontend/dist-prod.test` e `cms/frontend/dist-prod.test`. Ele recusa `.next`, artefatos ativos, portas e storage de produção.

## Backup e restore

- `node scripts/backup-storage.js --source "<STORAGE_ROOT absoluto>"`
- `node scripts/restore-storage.js --backup backups/storage-... --target "<STORAGE_ROOT absoluto>" --confirm-restore`

Em produção, writers devem estar parados e o backup precisa receber `--source` explícito. O comando sem source aponta ao storage local. Veja `docs/backup-restore-json.md`.

## Uploads de produção

`node scripts/sync-production-uploads.js --env-file .env.production.local` valida referências de uploads no volume alvo. Use `--apply` somente na janela autorizada para copiar arquivos ausentes sem sobrescrever os existentes.

## Observação

O teste de segurança sobe as APIs Spring e os frontends Next em processos isolados, verifica o gateway `/admin` e lê `routes-manifest.json`. ESL/CEP/CNPJ devem apontar para `127.0.0.1:42010`; rotas CMS e `/uploads/*` para `127.0.0.1:42514`; `/admin/*` para `127.0.0.1:42513`.

O Landing Builder também usa Spring MVC e é validado pelo Maven Wrapper próprio. Ele ainda não participa do hardening dos quatro artefatos centrais; quando houver `next dev` manual, use `NEXT_BUILD_DIST_DIR=.next.test` para não tocar no cache ativo.

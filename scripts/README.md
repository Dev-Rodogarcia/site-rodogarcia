# Scripts globais do monorepo

## Testes

- `node scripts/tests/test-security-hardening.js`

## Backup e restore

- `node scripts/backup-storage.js`
- `node scripts/restore-storage.js --backup backups/storage-... --confirm-restore`

Detalhes operacionais: `docs/backup-restore-json.md`.

## Observacao

O teste de seguranca sobe `backend/` e `frontend/` como processos separados. Antes de executar, rode `npm run build` dentro de cada projeto.

O teste usa um `STORAGE_ROOT` temporario e nao reutiliza o storage configurado no ambiente chamador.

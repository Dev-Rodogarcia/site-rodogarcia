# Scripts globais do monorepo

## Testes

- `node scripts/tests/test-security-hardening.js`

## Backup e restore

- `node scripts/backup-storage.js`
- `node scripts/restore-storage.js --backup backups/storage-... --confirm-restore`

Detalhes operacionais: `docs/backup-restore-json.md`.

## Conversão de imagens para WebP

- `node backend/scripts/migrate-images-to-webp.js` mostra a migração planejada sem alterar arquivos.
- `node backend/scripts/migrate-images-to-webp.js --apply` converte PNG/JPG/JPEG/AVIF em `frontend/public` e `backend/storage/uploads`, atualiza referências conhecidas e remove os originais após validar o WebP gerado.

## Conversão de vídeos para WebM

- O backend instala o FFmpeg compatível como dependência; `FFMPEG_PATH` é opcional e permite sobrescrever esse executável em ambientes operacionais específicos.
- `node backend/scripts/migrate-videos-to-webm.js` mostra a migração planejada sem alterar arquivos.
- `node backend/scripts/migrate-videos-to-webm.js --apply` converte MP4/Ogg em `frontend/public` e `backend/storage/uploads`, atualiza referências conhecidas e remove os originais após validar o WebM gerado.

## Observacao

O teste de seguranca sobe `backend/` e `frontend/` como processos separados. Antes de executar, rode `npm run build` dentro de cada projeto.

O teste usa um `STORAGE_ROOT` temporario e nao reutiliza o storage configurado no ambiente chamador.

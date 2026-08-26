# Scripts globais do monorepo

## Testes

- `node scripts/tests/test-security-hardening.js` — somente com os artefatos isolados e variáveis `SECURITY_TEST_*_ARTIFACT_DIR` descritos abaixo.

## Backup e restore

- `node scripts/backup-storage.js`
- `node scripts/restore-storage.js --backup backups/storage-... --confirm-restore`

Detalhes operacionais: `docs/backup-restore-json.md`.

## Conversão de imagens para WebP

- `node site/backend/scripts/migrate-images-to-webp.js` mostra a migração planejada sem alterar arquivos.
- `node site/backend/scripts/migrate-images-to-webp.js --apply` converte PNG/JPG/JPEG/AVIF em `site/frontend/public` e `site/backend/storage/uploads`, atualiza referências conhecidas e remove os originais após validar o WebP gerado.

## Conversão de vídeos para WebM

- O backend instala o FFmpeg compatível como dependência; `FFMPEG_PATH` é opcional e permite sobrescrever esse executável em ambientes operacionais específicos.
- `node site/backend/scripts/migrate-videos-to-webm.js` mostra a migração planejada sem alterar arquivos.
- `node site/backend/scripts/migrate-videos-to-webm.js --apply` converte MP4/Ogg em `site/frontend/public` e `site/backend/storage/uploads`, atualiza referências conhecidas e remove os originais após validar o WebM gerado.

## Observacao

O teste de segurança sobe `site/backend/`, `cms/backend/`, `site/frontend/` e `cms/frontend/` como processos separados e verifica o gateway `/admin`. Ele **nunca deve ser executado sem os quatro artefatos isolados**: `site/backend/dist.test`, `cms/backend/dist.test`, `site/frontend/dist-prod.test` e `cms/frontend/dist-prod.test`. O comando exige, respectivamente, `SECURITY_TEST_BACKEND_ARTIFACT_DIR=site/backend/dist.test`, `SECURITY_TEST_CMS_BACKEND_ARTIFACT_DIR=cms/backend/dist.test`, `SECURITY_TEST_FRONTEND_ARTIFACT_DIR=site/frontend/dist-prod.test` e `SECURITY_TEST_CMS_ARTIFACT_DIR=cms/frontend/dist-prod.test`; qualquer outro caminho, inclusive `.next`, `site/backend/dist`, `cms/backend/dist` ou `dist-prod` ativo, é recusado antes de iniciar processos. Quando houver `next dev` manual em execução, gere os dois artefatos Next com `NEXT_BUILD_DIST_DIR=.next.test`; o cache `.next` ativo não é tocado e os scripts de preparação leem esse diretório isolado.

Além da presença dos servidores standalone, o teste lê `site/frontend/dist-prod.test/.next/routes-manifest.json` e exige que ESL/CEP/CNPJ apontem para `127.0.0.1:4010`, as rotas de ownership do CMS e `/uploads/*` apontem para `127.0.0.1:5414` e `/admin/*` para `127.0.0.1:5413`. Assim, valores de rewrite definidos no build não podem redirecionar o hardening para processos de desenvolvimento ou produção.

O pré-flight de produção cria esses artefatos com as URLs isoladas `4010`/`5414`/`5411`/`5413`, exporta as quatro variáveis e só então executa o hardening. Os candidatos `dist.next`/`dist-prod.next` são recompilados com `6050`/`6051`/`6060`/`6061` depois do hardening. Para um diagnóstico manual, gere primeiro os quatro artefatos `.test` com esse mesmo contrato e use as variáveis acima na mesma sessão de terminal.

O teste usa um `STORAGE_ROOT` temporario e nao reutiliza o storage configurado no ambiente chamador.

# Checklist tecnico rapido

## 1. Build

- [ ] `cmd /c npm run build` conclui sem erro em `site/backend/`.
- [ ] `cmd /c npm run build` conclui sem erro em `cms/backend/`.
- [ ] `cmd /c npm run build` conclui sem erro em `site/frontend/`.
- [ ] `cmd /c npm run build` conclui sem erro em `cms/frontend/`.

## 2. Encoding

- [ ] Nenhum mojibake em `site/backend/src`, `cms/backend/src`, `site/frontend/src`, `cms/frontend/src`, `docs` e `README.md`.
- [ ] Textos visiveis em portugues estao revisados.

Comando:

```powershell
rg -n --pcre2 "[^\x00-\x7F]" site/backend/src cms/backend/src site/frontend/src cms/frontend/src docs README.md -S
```

## 3. CMS

- [ ] `/admin/auth/entrar` abre normalmente pelo site público.
- [ ] `/admin/developer` exige sessão e o CMS direto em `5013` só é usado em DEV.
- [ ] `/admin`, `/auth/*` e `/developer/*` legados encaminham para `/admin/...`.
- [ ] `/admin/_next/*` responde com assets do CMS.
- [ ] `/api/admin/**` exige admin.
- [ ] O gateway roteia auth/admin, conteúdo, mídia/uploads, formulários, consentimento, analytics, popup e tracking à API CMS `4013`; ESL, CEP e CNPJ permanecem no backend público `4012`.

## 4. Dados locais

- [ ] `site/backend/storage/private/**` nao esta sendo versionado.
- [ ] `site/backend/storage/uploads/` nao contem lixo de teste.
- [ ] Não há cópia de storage em `cms/backend`; ele é o escritor único das coleções administrativas do volume canônico.
- [ ] Nao ha duplicacao de assets sem uso.
- [ ] A raiz não contém backups ou logs soltos fora de `backups/` e `logs/`, nem docs ou pastas de agente fora dos locais previstos.

## 5. SEO tecnico

- [ ] `/sitemap.xml` responde.
- [ ] `/robots.txt` responde.
- [ ] URLs canonicas apontam para rotas atuais.

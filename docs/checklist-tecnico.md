# Checklist técnico rápido

## 1. Build

- [ ] `cmd /c mvnw.cmd -B clean verify` conclui sem erro em `site/backend/`.
- [ ] `cmd /c mvnw.cmd -B clean verify` conclui sem erro em `cms/backend/`.
- [ ] Typecheck e build concluem sem erro em `site/frontend/` e `cms/frontend/`.
- [ ] `cmd /c mvnw.cmd -B clean verify` conclui sem erro em `landing-builder/backend/`; typecheck e build concluem sem erro em `landing-builder/frontend/`.

## 2. Encoding

- [ ] Nenhum mojibake em `site/backend/src`, `cms/backend/src`, `site/frontend/src`, `cms/frontend/src`, `landing-builder`, `docs` e `README.md`.
- [ ] Textos visíveis em português estão revisados.

```powershell
rg -n --pcre2 "[^\x00-\x7F]" site/backend/src cms/backend/src site/frontend/src cms/frontend/src landing-builder/backend/src landing-builder/frontend/src docs README.md -S
```

## 3. CMS

- [ ] `/admin/auth/entrar` abre normalmente pelo site público.
- [ ] `/admin/developer` exige sessão e o CMS direto em `35013` só é usado em DEV.
- [ ] `/admin`, `/auth/*` e `/developer/*` legados encaminham para `/admin/...`.
- [ ] `/admin/_next/*` responde com assets do CMS.
- [ ] `/api/admin/**` exige admin.
- [ ] O gateway roteia auth/admin, conteúdo, mídia/uploads, formulários, consentimento, analytics, popup e tracking à API CMS `31013`; ESL, CEP e CNPJ permanecem no backend público `31012`.

## 4. Dados locais

- [ ] `site/backend/storage/private/**` não está sendo versionado.
- [ ] `site/backend/storage/uploads/` não contém lixo de teste.
- [ ] Não há cópia de storage nos diretórios de runtime; `cms/backend` é o único escritor das coleções administrativas do volume canônico.
- [ ] Não há duplicação de assets sem uso.
- [ ] A raiz não contém backups ou logs soltos fora de `backups/` e `logs/`.

## 5. SEO técnico

- [ ] `/sitemap.xml` responde.
- [ ] `/robots.txt` responde.
- [ ] URLs canônicas apontam para rotas atuais.

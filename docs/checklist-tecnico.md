# Checklist tecnico rapido

## 1. Build

- [ ] `cmd /c npm run build` conclui sem erro em `backend/`.
- [ ] `cmd /c npm run build` conclui sem erro em `frontend/`.

## 2. Encoding

- [ ] Nenhum mojibake em `backend/src`, `frontend/src`, `docs` e `README.md`.
- [ ] Textos visiveis em portugues estao revisados.

Comando:

```powershell
rg -n --pcre2 "[^\x00-\x7F]" backend/src frontend/src docs README.md -S
```

## 3. CMS

- [ ] `/auth/entrar` abre normalmente.
- [ ] `/auth/criar-conta` so serve para setup inicial.
- [ ] `/developer` exige sessao.
- [ ] `/api/admin/**` exige admin.

## 4. Dados locais

- [ ] `backend/storage/private/**` nao esta sendo versionado.
- [ ] `backend/storage/uploads/` nao contem lixo de teste.
- [ ] Nao ha duplicacao de assets sem uso.
- [ ] A raiz nao contem backups, logs soltos, docs aleatorios ou pastas de agente.

## 5. SEO tecnico

- [ ] `/sitemap.xml` responde.
- [ ] `/robots.txt` responde.
- [ ] URLs canonicas apontam para rotas atuais.

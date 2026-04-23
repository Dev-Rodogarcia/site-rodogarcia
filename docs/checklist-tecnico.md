# Checklist técnico rápido

## 1. Build

- [ ] `cmd /c npm run build` conclui sem erro.

## 2. Encoding

- [ ] Nenhum mojibake em `src`, `server`, `docs` e `README.md`.
- [ ] Textos visíveis em português com acentuação correta.

Comando:

```powershell
rg -n 'Ã|Â|ï¿½|�|â€”|â€|â†' src server docs README.md -S
```

## 3. CMS

- [ ] `/auth/entrar` abre normalmente.
- [ ] `/auth/criar-conta` só serve para setup inicial.
- [ ] `/developer` exige sessão.
- [ ] `/api/admin/**` exige admin.

## 4. Dados locais

- [ ] `server/storage/private/**` não está sendo versionado.
- [ ] `public/uploads/` não contém lixo de teste.
- [ ] Não há duplicação de assets sem uso.

## 5. SEO técnico

- [ ] `/sitemap.xml` responde.
- [ ] `/robots.txt` responde.
- [ ] URLs canônicas apontam para rotas atuais.

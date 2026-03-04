# Checklist tecnico rapido

## 1) Estrutura

- [ ] Nenhum HTML vazio em `src/`.
- [ ] Nenhum arquivo legado de componentizacao runtime (`src/components/`, `load-components.js`).
- [ ] Nenhum asset CSS/JS obsoleto sem uso nas paginas publicas.

Comandos:

```powershell
Get-ChildItem src -Filter *.html | Where-Object { $_.Length -eq 0 }
rg -n "load-components\\.js|components/header\\.html|components/footer\\.html|src/components|main\\.css" src README.md vercel.json
```

## 2) Encoding

- [ ] Nenhum mojibake (texto quebrado em acentuacao).
- [ ] Arquivos de texto salvos em UTF-8.

Comando:

```powershell
rg -nP "\\x{00C3}[^\\x00-\\x7F]|\\x{FFFD}" src package.json README.md
```

## 3) SEO tecnico

- [ ] `sitemap.xml` contem todas as paginas publicas reais.
- [ ] `robots.txt` aponta para o sitemap correto.

Comandos:

```powershell
npm run sitemap:generate
Get-Content sitemap.xml
```

## 4) Rotas e ambiente

- [ ] Rotas locais em `server.js` alinhadas com `vercel.json`.
- [ ] URL local principal documentada como `http://localhost:3000/`.

Comandos:

```powershell
Get-Content server.js
Get-Content vercel.json
```

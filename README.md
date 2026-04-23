<!-- PORTFOLIO-FEATURED
title: Site Institucional Rodogarcia Transportes
description: Aplicação Next.js com site público, CMS interno, autenticação administrativa e persistência local em JSON.
technologies: Next.js, React, TypeScript, Tailwind CSS
demo: https://site-rodogarcia.vercel.app/
highlight: true
image: public/imagem.png
-->

<p align="center">
  <img src="public/imagem.png" alt="Capa do projeto Rodogarcia" width="1200">
</p>

# Site Rodogarcia Transportes

Aplicação Next.js da Rodogarcia com site público, CMS interno, autenticação administrativa e persistência local em JSON.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## Rotas principais

- `/`
- `/servicos`
- `/sobre`
- `/cotacao`
- `/fale-conosco`
- `/trabalhe-conosco`
- `/auth/entrar`
- `/auth/criar-conta`
- `/developer`

## Execução local

No Windows com PowerShell restrito:

```powershell
cmd /c npm run dev
```

Build e start:

```powershell
cmd /c npm run build
cmd /c npm run start
```

## Setup admin

- Se ainda não existir usuário em `server/storage/private/users.json`, acesse `/auth/criar-conta`.
- O primeiro cadastro exige `ADMIN_SETUP_CODE`.
- Depois do primeiro admin, o acesso passa a ser feito por `/auth/entrar`.

## Persistência local

- `server/storage/content.json`
- `server/storage/site-texts.json`
- `server/storage/popup-config.json`
- `server/storage/popup-leads.json`
- `server/storage/popup-events.json`
- `server/storage/private/users.json`
- `server/storage/private/sessions.json`
- `server/storage/private/analytics.json`

Todos os stores aceitam override por variável de ambiente.

## Segurança

- cookie `HttpOnly`
- `SameSite=Strict`
- CSRF em rotas mutáveis autenticadas
- validação same-origin
- rate limit local
- rotas administrativas protegidas por admin

## Observações

- `/sitemap.xml` e `/robots.txt` são gerados pelo App Router.
- Rotas legadas como `/admin` e `*.html` continuam redirecionando para os caminhos atuais.

## Licença

Uso interno da Rodogarcia.

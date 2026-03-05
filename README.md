<!-- PORTFOLIO-FEATURED
title: Site Institucional Rodogarcia Transportes
description: Site institucional estatico focado em geracao de contatos, solicitacao de cotacao e reforco de marca, com SEO tecnico, performance e seguranca no deploy via Vercel.
technologies: HTML5, CSS3, JavaScript ES Modules, Node.js, Vercel
demo: https://site-rodogarcia.vercel.app/
highlight: true
image: public/imagem.png
-->

<p align="center">
  <img src="public/imagem.png" alt="Capa do projeto Rodogarcia" width="1200">
</p>

# Site Rodogarcia Transportes

Site institucional estatico da Rodogarcia, pensado para converter visitas em contato comercial, cotacao e rastreio.

## Demo

- Producao: `https://site-rodogarcia.vercel.app/`
- Rastreio (externo): `https://rodogarcia.eslcloud.com.br/recipient_tracking`

## Navegacao publica

| Categoria | Item | URL amigavel | URL canonica |
| --- | --- | --- | --- |
| Institucional | Inicio | `/inicio` | `/` |
| Institucional | Quem somos | `/quem-somos` | `/sobre.html` |
| Institucional | Trabalhe Conosco | `/trabalhe-conosco` | `/trabalhe-conosco.html` |
| Institucional | Imprensa | `/imprensa` | `/imprensa.html` |
| Servicos | Servicos | `/servicos` | `/servicos.html` |
| Servicos | Nossos Servicos | `/nossos-servicos` | `/servicos.html` |
| Servicos | Solicitar Cotacao | `/solicitar-cotacao` | `/cotacao.html` |
| Servicos | Rastrear Encomenda | `/rastrear-encomenda` | externo |
| Servicos | Para empresas | `/para-empresas` | `/para-empresas.html` |
| Ajuda | Central de Ajuda | `/ajuda` | `/central-ajuda.html` |
| Ajuda | Fale Conosco | `/fale-conosco` | `/fale-conosco.html` |
| Ajuda | Termos de Uso | `/termos-de-uso` | `/termos-de-uso.html` |

Observacao: as rotas amigaveis e canonicas sao controladas por `vercel.json` (producao) e espelhadas em `server.js` (local).

## Stack

- HTML5
- CSS3 (base, layout, components, pages)
- JavaScript ES Modules
- Node.js (servidor local simples para desenvolvimento)
- Vercel (rewrites, redirects, headers e cache)

## Arquitetura do projeto

```text
site-rodogarcia/
|-- public/
|   |-- imagem.png
|   |-- manifest.json
|   `-- ...
|-- server/
|   |-- config/
|   |-- middleware/
|   |-- repositories/
|   |-- routes/
|   |-- storage/
|   |   `-- private/
|   |-- validation/
|   `-- README.md
|-- src/
|   |-- auth/
|   |   |-- css/
|   |   |-- js/
|   |   |-- entrar.html
|   |   `-- criar-conta.html
|   |-- css/
|   |   |-- base/
|   |   |-- components/
|   |   |-- layout/
|   |   `-- pages/
|   |-- developer/
|   |-- js/
|   |   |-- analytics/
|   |   `-- mapas/
|   |-- index.html
|   |-- servicos.html
|   |-- sobre.html
|   |-- cotacao.html
|   |-- trabalhe-conosco.html
|   |-- imprensa.html
|   |-- para-empresas.html
|   |-- central-ajuda.html
|   |-- fale-conosco.html
|   `-- termos-de-uso.html
|-- robots.txt
|-- sitemap.xml
|-- data/
|   |-- analytics.json
|   `-- analytics-config.json
|-- vercel.json
|-- server.js
|-- scripts/
|   |-- maintenance/
|   |   `-- generate-sitemap.js
|   `-- tests/
|       `-- test-basic.js
|-- docs/
|   |-- checklist-tecnico.md
|   `-- seguranca-admin-node.md
`-- package.json
```

## Executando localmente

Sem build step: o projeto e estatico.

### Opcao 1: servidor Node local

```bash
npm start
```

ou

```bash
node server.js
```

Acesse:
- `http://localhost:5010/`

### Area restrita (Node backend)

- Login: `http://localhost:5010/auth/entrar.html`
- Cadastro controlado: `http://localhost:5010/auth/criar-conta.html`
- Painel oficial: `http://localhost:5010/developer/index.html`
- Analytics no painel oficial: `http://localhost:5010/developer/index.html?page=analytics-dashboard`
- Exit Intent no painel oficial: `http://localhost:5010/developer/index.html?page=popup-exit`
- Compatibilidade legado: `/admin`, `/admin/index.html`, `/admin/dashboard.html`, `/admin/carrosseis.html` e `/admin/vagas.html` redirecionam para `/developer/*`

Configuracao inicial:

```bash
# copie .env.example para .env e ajuste os valores
# (PORT, NODE_ENV e ADMIN_SETUP_CODE)
# opcional para dev sem setup code: ALLOW_INSECURE_DEV_SETUP=true
npm start
```

O `server.js` carrega o arquivo `.env` automaticamente, sem dependencias externas.

### Opcao 2: Vercel Dev (mais proximo de producao)

```bash
npx vercel dev
```

Acesse:
- `http://localhost:3000/` (ou a porta exibida no terminal)

## Qualidade tecnica aplicada

### SEO

- `title`, `meta description` e `canonical` por pagina
- Open Graph e Twitter Cards
- JSON-LD (Organization, LocalBusiness, Service, Breadcrumb e FAQ quando aplicavel)
- `robots.txt` e `sitemap.xml` na raiz

### Performance

- Imagens com atributos para reduzir CLS
- `preconnect` para origens criticas
- `defer` em scripts externos
- Cache configurado por tipo de asset no `vercel.json`

### Analytics e LGPD

- Sistema proprio de eventos: `click`, `scroll`, `form_submit`, `download`, `cta_click`, `popup_open`, `popup_submit`, `page_view`, `session_start`, `session_end`
- Endpoints locais: `/api/analytics/event`, `/api/analytics/session`, `/api/analytics/stats`
- Configuracao no CMS: `/developer/index.html?page=analytics-dashboard`
- Consentimento LGPD por categorias (`necessarios`, `analytics`, `marketing`, `performance`) antes de carregar scripts externos

### Seguranca (headers)

- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

## Mapa interativo

Modulo em `src/js/mapas/`.

Arquivos principais:
- `src/js/mapas/config.js`
- `src/js/mapas/filiais.js`
- `src/js/mapas/mapeamento.js`
- `src/js/mapas/interacoes.js`
- `src/js/mapas/carregamento.js`
- `src/js/mapas/mapa.js`

Documentacao especifica:
- `src/js/mapas/README.md`

## Deploy

Deploy recomendado: Vercel.

Arquivos-chave:
- `vercel.json`
- `robots.txt`
- `sitemap.xml`

## Manutencao rapida

- Gerar sitemap a partir da lista oficial de paginas publicas:

```bash
npm run sitemap:generate
```

- Executar testes basicos de backend (rotas, auth, upload e CRUD Hero):

```bash
npm run test:basic
```

- Checklist tecnico interno: `docs/checklist-tecnico.md`

## Licenca

Uso interno do projeto Rodogarcia Transportes.


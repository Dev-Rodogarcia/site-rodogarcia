# Backend Node para Area Restrita

Esta pasta concentra o backend da area autenticada.

## Estrutura

- `server/routes/`: rotas protegidas da area developer.
- `server/middleware/`: middleware de autenticacao/autorizacao.
- `server/config/`: validacoes de bootstrap e ambiente.
- `server/repositories/`: camada de persistencia.
- `server/validation/`: validacoes de payload e upload.
- `server/storage/content.json`: dados de Hero, DNA, Vagas e Feedbacks.
- `server/storage/site-texts.json`: textos editaveis do painel.
- `server/storage/popup-config.json`: configuracao do Exit Intent Popup.
- `server/storage/popup-leads.json`: leads enviados pelo popup.
- `server/storage/popup-events.json`: eventos de analytics do popup.
- `data/analytics.json`: eventos/sessoes do tracking proprio do site.
- `data/analytics-config.json`: configuracao de consentimento, tracking e providers externos.
- `server/storage/users.example.json`: exemplo de estrutura de usuarios.
- `server/storage/private/users.json`: usuarios administrativos (nao versionado).

## Variaveis de ambiente

- `PORT`: porta do servidor (padrao `5010`).
- `NODE_ENV`: `production` para habilitar `Secure` no cookie e HSTS.
- `ADMIN_SETUP_CODE`: codigo exigido para criar a primeira conta admin.
- `ALLOW_INSECURE_DEV_SETUP`: somente desenvolvimento; gera codigo temporario caso `ADMIN_SETUP_CODE` esteja ausente.
- `USERS_STORE_PATH`: caminho customizado para o store de usuarios.
- `CONTENT_STORE_PATH`: caminho customizado do arquivo de conteudo.
- `SITE_TEXTS_STORE_PATH`: caminho customizado do arquivo de textos.
- `POPUP_CONFIG_STORE_PATH`: caminho customizado do arquivo de configuracao do popup.
- `POPUP_LEADS_STORE_PATH`: caminho customizado do arquivo de leads do popup.
- `POPUP_EVENTS_STORE_PATH`: caminho customizado do arquivo de eventos do popup.
- `ANALYTICS_STORE_PATH`: caminho customizado do arquivo de eventos/sessoes de analytics.
- `ANALYTICS_CONFIG_PATH`: caminho customizado do arquivo de configuracao de analytics.

## Observacoes

- Nunca publique `server/storage/private/users.json` em repositorios publicos.
- Use backup seguro e criptografado para os JSONs em ambiente real.
- Em producao, substitua persistencia em JSON por banco de dados com trilha de auditoria.

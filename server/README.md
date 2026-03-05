# Backend Node para Area Restrita

Esta pasta concentra o backend da area autenticada.

## Estrutura

- `server/routes/`: rotas protegidas da area developer.
- `server/middleware/`: middleware de autenticacao/autorizacao.
- `server/config/`: validacoes de bootstrap e ambiente.
- `server/repositories/`: camada de persistencia.
- `server/validation/`: validacoes de payload e upload.
- `server/storage/content.json`: dados de Hero, DNA e Vagas.
- `server/storage/site-texts.json`: textos editaveis do painel.
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

## Observacoes

- Nunca publique `server/storage/private/users.json` em repositorios publicos.
- Use backup seguro e criptografado para os JSONs em ambiente real.
- Em producao, substitua persistencia em JSON por banco de dados com trilha de auditoria.

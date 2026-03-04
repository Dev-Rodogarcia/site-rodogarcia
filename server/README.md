# Backend Node para Area Restrita

Esta pasta contem a persistencia local da area administrativa.

## Estrutura

- `server/data/content.json`: dados de Hero, DNA e Vagas.
- `server/data/users.json`: usuarios administrativos (hash de senha com PBKDF2).

## Variaveis de ambiente

- `PORT`: porta do servidor (padrao `3000`).
- `NODE_ENV`: `production` para habilitar `Secure` no cookie e HSTS.
- `ADMIN_SETUP_CODE`: codigo exigido para criar a primeira conta admin.

## Observacoes

- Nao publique `server/data/users.json` em repositorios publicos.
- Use backup seguro e criptografado para os JSONs em ambiente real.
- Em producao, substitua persistencia em JSON por banco de dados com trilha de auditoria.

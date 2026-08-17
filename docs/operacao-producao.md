# Operacao de producao

## Fronteiras

O Rodogarcia nao e uma SPA estatica: o frontend Next.js renderiza Server Components, aplica headers e faz rewrites de `/api` e `/uploads`. Em producao, execute dois processos privados:

| Componente | Bind local | Funcao |
| --- | --- | --- |
| Next.js standalone (`frontend/dist-prod/server.js`) | `127.0.0.1:6060` | Site publico, CMS, headers e proxy interno de API/uploads |
| Express (`node dist/server.js`) | `127.0.0.1:6050` | API, autenticacao, JSON e uploads |

Use `iniciar-prod.bat` para validar, compilar e iniciar esses processos pelo PM2. Ele fixa `NODE_ENV=production`, `HOST=127.0.0.1`, `PORT=6050` e `BACKEND_INTERNAL_URL=http://127.0.0.1:6050`.

O desenvolvimento usa `127.0.0.1:5012` (frontend), `127.0.0.1:4012` (backend), `127.0.0.1:6110` (backend do Landing Builder) e `127.0.0.1:5112` (frontend público do Landing Builder) por `iniciar-dev.bat`. Esse script limpa proxies de producao e o cache gerado `.next`, usa o storage local do repositório e mantém os logs dos quatro serviços no mesmo terminal que o iniciou. Sem `LANDING_BUILDER_SERVICE_TOKEN`, ele cria um token temporário seguro para a execução atual; um token privado configurado no ambiente deve ser usado quando a integração precisar persistir entre reinicializações.

## Ambiente

Na VM, crie `.env.production.local` a partir de `.env.production.example`. O arquivo é ignorado pelo Git. Preencha ao menos:

- `FRONTEND_ORIGIN` com a origem HTTPS canônica da interface.
- `CORS_ORIGINS` com eventuais origens HTTPS adicionais, separadas por vírgula.
- `ADMIN_SETUP_CODE` e `SESSION_SECRET` ou `JWT_SECRET` com valores aleatórios fortes.
- `STORAGE_ROOT` e `UPLOADS_DIR` com caminhos absolutos em volume persistente fora do repositório.
- `TRUST_PROXY=1` quando o Next/tunnel for o salto confiável até o Express.

O boot do backend rejeita automaticamente segredos fracos, placeholders e origens locais ou não HTTPS em produção. O script também faz essa verificação antes de iniciar serviços.

## PM2

O `ecosystem.config.js` versionado inicia `rodogarcia-backend-prod` e `rodogarcia-frontend-prod`, com reinício automático, logs ignorados em `logs/` e bind apenas local nas portas `6050` e `6060`. Ele lê `.env.production.local` no start (ou o caminho relativo informado em `RODOGARCIA_ENV_FILE`), sem versionar segredos no ecosystem.

Instale o PM2 uma única vez na VM com `npm install -g pm2`. Depois de cada publicação, execute `iniciar-prod.bat`; ele recria o artefato, executa o hardening, aplica `pm2 startOrReload ecosystem.config.js --env production --update-env` e salva a lista de processos. O ecosystem também define esse mesmo ambiente como padrão, portanto `pm2 restart ecosystem.config.js --update-env` mantém as portas `6050` e `6060`. Para consultar, use `pm2 status`; para acompanhar logs, use `pm2 logs rodogarcia-backend-prod` ou `pm2 logs rodogarcia-frontend-prod`.

Antes da primeira publicação, restaure ou copie para o volume os JSONs e uploads autorizados. O `iniciar-prod.bat` executa `node scripts/sync-production-uploads.js --env-file .env.production.local --apply` antes de interromper processos: ele cria `UPLOADS_DIR`, copia somente uploads ausentes da origem local (ou de `PRODUCTION_UPLOADS_SEED_DIR`) e falha se um JSON público referenciar mídia inexistente. Ele nunca sobrescreve nem remove arquivos já persistidos. Use `node scripts/backup-storage.js` antes de migrações e siga `docs/backup-restore-json.md` para restores; não copie storage privado por canais públicos.

## Cloudflare Tunnel

O arquivo do `cloudflared` pertence à infraestrutura, não ao repositório. O contrato mínimo é encaminhar o hostname público do site ao Next local:

```yaml
ingress:
  - hostname: site.rodogarcia.com.br
    service: http://127.0.0.1:6060
  - hostname: sitebackend.rodogarcia.com.br
    service: http://127.0.0.1:6050
```

Mantenha `FRONTEND_ORIGIN` e `CORS_ORIGINS` em `https://site.rodogarcia.com.br`; use `https://sitebackend.rodogarcia.com.br` somente em `NEXT_PUBLIC_BACKEND_URL`. O fluxo normal do site continua por `/api` e `/uploads` no hostname do frontend, que o Next reencaminha internamente.

No Cloudflare, não faça cache de HTML, `/api/*`, autenticação, CMS ou uploads mutáveis. Cache longo deve cobrir somente assets com hash. Bloqueie caminhos de desenvolvimento que não fazem parte do Next de produção, como `/src/*`, `/node_modules/*`, `/@vite/*`, `/@react-refresh/*` e `/@fs/*`.

## Artefato e verificação

O `npm run build:prod` produz e recria integralmente `frontend/dist-prod` a cada execução. A pasta contém o servidor standalone do Next, `.next/static`, `public` e `build-info.json`; ela é o artefato que `iniciar-prod.bat` inicia. Source maps de navegador permanecem desabilitados e o cabeçalho `X-Powered-By` do Next foi removido.

Este projeto não pode publicar somente `index.html` e `/assets`: Server Components, rotas dinâmicas, headers, CMS e rewrites para API exigem o servidor Next presente no artefato. O JavaScript entregue ao navegador é necessariamente visível, mas o repositório, arquivos TSX, `.env`, segredos e storage privado não são publicados.

`iniciar-prod.bat` valida backend e frontend antes de parar os processos produtivos. Em seguida, recria `dist-prod`, roda `node scripts/tests/test-security-hardening.js` contra esse artefato na porta privada da API e só então abre a nova versão. Isso evita que o teste deixe o artefato apontando para portas temporárias.

# Estado Atual do Sistema - Site Rodogarcia

## Stack Tecnológica

- Monorepo do site institucional Rodogarcia com frontend público, painel CMS interno e backend API.
- Frontend: Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/base-nova, Radix UI, Base UI, Phosphor Icons, lucide-react, Framer Motion, Recharts, React Hook Form e Zod.
- Backend: Node.js, Express 5, TypeScript ESM, Helmet, CORS, cookie-parser, multer, Sharp, Zod, bcryptjs, jsonwebtoken, dotenv e Vitest.
- Persistência atual: arquivos JSON locais em `backend/storage`, com privados em `backend/storage/private` e uploads em `backend/storage/uploads`.
- Ambiente DEV: backend em `127.0.0.1:4012`, frontend em `127.0.0.1:5012`, CMS em `/auth/entrar` e painel em `/developer`. Ambiente PROD: backend privado em `127.0.0.1:6050`, publicado em `https://sitebackend.rodogarcia.com.br`, e frontend Next privado em `127.0.0.1:6060`, publicado em `https://site.rodogarcia.com.br`.
- Configuração local usa `.env.development.local` ou `.env.production.local`, a partir de seus respectivos exemplos; `.env` e `.env.example` permanecem como compatibilidade. O backend ainda carrega `.env` da raiz, mas os inicializadores injetam primeiro o arquivo do modo escolhido.
- Operação Windows separada por `iniciar-dev.bat` e `iniciar-prod.bat`; não existe mais inicializador genérico.

## Arquitetura e Padrões

- A raiz do repositório é reservada para arquivos globais, documentação curta, scripts e os diretórios `backend/` e `frontend/`.
- Frontend usa App Router: páginas públicas ficam em `frontend/src/app`, autenticação em `frontend/src/app/auth` e CMS em `frontend/src/app/developer`.
- `ShellLayout` monta o chrome público com header, footer, busca, analytics e popup apenas fora das rotas auth/admin.
- `frontend/src/lib/routes.ts` é a fonte central de rotas públicas, rotas admin, endpoints de API, URLs externas, sitemap, redirects e navegação.
- Páginas públicas usam fallbacks locais e conteúdo do CMS via `/api/public/content`; SEO editável usa `/api/public/seo` por `buildCmsMetadata`.
- O CMS usa `SessionProvider`, `DeveloperAuthGate`, `DeveloperShell`, `DevSidebar`, `DevTopbar`, hooks administrativos e componentes compartilhados de `components/developer` e `components/ui`.
- `frontend/src/lib/cmsHelp.ts` concentra as fichas de ajuda do CMS. Os templates específicos descrevem controle, origem, área pública real afetada, efeito do salvamento e, quando aplicável, contrato técnico; os fallbacks usam perfis reais das rotas e categorias concretas de campo, sem frases genéricas de preenchimento. Toda mudança de lógica, validação, destino, schema ou fluxo de um controle exige a revisão da ficha correspondente no mesmo commit.
- Cada ficha de ajuda começa pelo bloco `Resumo`, em linguagem leiga: explica o que a pessoa ajusta, o que muda e em qual área o visitante percebe o resultado. Os campos técnicos permanecem abaixo para consulta detalhada.
- Mutação client-side no CMS passa por `useApiRequest`, que injeta `X-CSRF-Token` automaticamente para métodos inseguros.
- Cache leve de recursos administrativos fica em `useAdminResource`; coleções CRUD ordenáveis usam `useAdminCollection`.
- Backend Express é montado em `createApp`, com Helmet, CORS restrito, JSON limit `2mb` para JSON e uploads multipart separados, cookie parser, `/uploads` estático com `nosniff`, router `/api` e `/health`.
- O frontend aplica headers globais em `frontend/next.config.js`, incluindo CSP, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` e HSTS somente em produção.
- O frontend de produção usa o artefato standalone `frontend/dist-prod`, recriado por `npm run build:prod` a cada inicialização de produção. A pasta reúne servidor Next, `.next/static`, `public` e `build-info.json`; Server Components, headers, rewrites de API/uploads e CMS impedem exportação estática segura apenas com HTML/JS. O Next remove `X-Powered-By` e mantém source maps de navegador desabilitados.
- A produção é supervisionada pelo PM2 via `ecosystem.config.js`: `rodogarcia-backend-prod` executa `backend/dist/server.js` em `127.0.0.1:6050` e `rodogarcia-frontend-prod` executa `frontend/dist-prod/server.js` em `127.0.0.1:6060`. O ecosystem lê o arquivo local `.env.production.local` (ou `RODOGARCIA_ENV_FILE`) no start, sem versionar valores sensíveis, e mantém essas portas tanto no ambiente padrão quanto em `--env production`.
- O preview responsivo do CMS abre somente rotas públicas listadas com `?preview=cms`; nessa combinação, CSP e `X-Frame-Options` permitem frame apenas pela mesma origem. Rotas administrativas, de autenticação, APIs e o acesso público comum permanecem com bloqueio total de framing.
- Controllers são finos; services concentram regra de negócio; repositories encapsulam JSON; `security` guarda sessão, auth, CSRF, origin e rate limit; `validators` guarda validação de borda; `utils` guarda helpers puros.
- `readJsonFile` retorna default apenas para arquivo ausente; corrupção, permissão e I/O falham fechados com cópia de preservação para JSON inválido. `writeJsonFile` escreve em arquivo temporário e renomeia para reduzir risco de arquivo truncado.
- Conteúdo público canônico versionado fica em `backend/storage/content.json` e `backend/storage/site-texts.json`.
- JSONs privados/runtime como usuários, sessões, consentimentos, analytics, auditoria, rate limits, leads, contatos, quotes, popup, biblioteca de mídia e uploads são ignorados pelo Git conforme `.gitignore`.
- O `.gitignore` cobre ambientes locais, caches de package managers, arquivos de IDE/OS, logs, builds, coverage, artefatos de testes, backups compactados, storage runtime e temporários de escrita JSON.
- O repositório não possui banco de dados, migrations Flyway, Java, Spring Boot ou dashboards analíticos.

## Clean Code e Manutenibilidade

- O monorepo preserva responsabilidades por camada: controllers traduzem HTTP, services concentram regras de negócio, repositories persistem JSON, validators/types/utils mantêm contratos puros e reaproveitáveis.
- Entrada externa deve ser tratada como dado não confiável até validação/sanitização explícita; payloads de `req.body`, query string, CMS, formulários públicos e uploads não devem ser propagados crus.
- Mudanças de schema precisam manter sincronizados tipos backend/frontend, sanitizadores, normalizadores públicos, telas do CMS, defaults/migração de leitura e testes quando aplicável.
- Rotas, navegação, URLs externas, endpoints, limites, textos canônicos e regras de mídia devem usar fontes centrais existentes, evitando literais duplicados em páginas, services ou componentes.
- Componentes React devem ficar focados em renderização, estado de UI e interação; transformação pesada de dados deve ir para hooks, helpers locais ou camada de API já existente.
- Novas abstrações só entram quando reduzem duplicação real, isolam regra compartilhada ou seguem padrão já presente no projeto.
- Evitar `any`; para dados dinâmicos, usar `unknown`, type guards, Zod, sanitizadores e tipos compartilhados.
- Bordas HTTP do backend devem usar `HttpError` e `asyncHandler`, com mensagens seguras e sem vazamento de segredos, paths privados, hashes, sessão, CSRF ou IP bruto.
- Comentários devem explicar decisões ou contratos não óbvios; não registrar comentários narrando código evidente.
- Testes acompanham risco: alterações em services, security, media, storage, validators e contratos compartilhados exigem cobertura próxima da mudança.

## Fluxo de Dados e Integrações

- Fluxo público: Server Component Next.js -> `fetchPublicContent`/`serverFetch` -> rewrite `/api` do Next -> backend Express -> services -> repositories JSON -> DTO público sanitizado -> componentes React.
- Fluxo CMS: usuário admin -> `/auth/entrar` -> cookie `sid` HttpOnly -> `SessionProvider` consulta `/api/auth/session` -> `DeveloperAuthGate` protege `/developer` -> hooks admin chamam `/api/admin/**` com CSRF.
- Rewrites do Next encaminham `/api/:path*` e `/uploads/:path*` para `BACKEND_INTERNAL_URL`, `BACKEND_PROXY_URL` ou `NEXT_PUBLIC_BACKEND_URL`. Valores vazios de proxy são ignorados tanto pelos rewrites quanto pelo fetch de Server Components, que usam a próxima URL configurada (em produção, `BACKEND_INTERNAL_URL` privado).
- Em produção, `iniciar-prod.bat` fixa o backend interno em `127.0.0.1:6050` e o frontend em `127.0.0.1:6060`; o Cloudflare deve encaminhar `sitebackend.rodogarcia.com.br` para a API e `site.rodogarcia.com.br` para o Next por HTTPS. O fluxo normal usa `/api` e `/uploads` no domínio do site, sem expor o repositório, `.env` ou storage.
- Endpoints públicos principais: `/api/public/content`, `/api/public/seo`, `/api/public/media-slots`, `/api/consent-settings`, `/api/consent-events`, `/api/tracking/event`, `/api/contact`, `/api/quote`, `/api/popup-config`, `/api/popup-events` e `/api/leads`.
- Endpoints de auth: `/api/auth/session`, `/api/auth/me`, `/api/auth/setup`, `/api/auth/login`, `/api/auth/logout` e `/api/auth/register`.
- Endpoints admin: conteúdo, home, serviços, páginas CMS, footer links, textos do site, imagens, media slots, SEO, consent settings, cookie consents, leads, tracking events, audit log, usuários e entidades como `units`.
- Conteúdo editável cobre Home, Serviços, Sobre, Para Empresas, Fale Conosco, Trabalhe Conosco, Cotação, footer links, unidades, SEO, LGPD/cookies, popup de saída, mídia e usuários.
- Uploads administrativos usam `multer` em memória e `mediaService`: imagens são validadas por assinatura real e convertidas em variantes WebP; vídeos são validados e persistidos sem conversão.
- Biblioteca de mídia cruza arquivos em `frontend/public`, uploads e referências existentes para indicar uso no CMS.
- O rastreamento operacional externo aponta para `https://rodogarcia.eslcloud.com.br/recipient_tracking`.
- Sitemap e robots são gerados por `frontend/src/app/sitemap.ts` e `frontend/src/app/robots.ts` a partir de `routes.ts`.
- Backups completos do storage local são criados por `node scripts/backup-storage.js` em `backups/storage-<data>/`; restores usam `node scripts/restore-storage.js --backup ... --confirm-restore`, preservando o storage anterior em `backups/pre-restore-<data>/storage`.
- O runbook de backup/restore fica em `docs/backup-restore-json.md`; backups devem ser tratados como sensíveis e copiados para local externo protegido.
- Em 2026-07-15, o storage de produção `C:\Rodogarcia\storage-prod` foi inicializado com os JSONs públicos canônicos `content.json`, `site-texts.json`, `media-library.json`, `consent-settings.json` e `popup-config.json`; o backup anterior está em `backups/pre-public-content-migration-2026-07-15`. Dados privados e operacionais não foram migrados.
- Antes de cada publicação, `iniciar-prod.bat` sincroniza e valida `UPLOADS_DIR` pelo script `scripts/sync-production-uploads.js`: a operação cria o diretório, traz somente arquivos ausentes de `backend/storage/uploads` (ou de `PRODUCTION_UPLOADS_SEED_DIR`), preserva o volume persistente e bloqueia a publicação quando referências `/uploads/...` dos JSONs públicos não existirem.

## Segurança e Regras de Negócio Consolidadas

- Sessão administrativa usa cookie `sid` HttpOnly, `SameSite=Strict`, `Secure` em produção e TTL renovado de 8 horas.
- CSRF é gerado por sessão e exigido em mutações administrativas.
- Rotas admin exigem usuário ativo com role `admin`; o frontend também bloqueia `/developer` por `DeveloperAuthGate`.
- Primeiro usuário admin só pode ser criado se não existir usuário e se `ADMIN_SETUP_CODE` conferir; stores ilegíveis impedem o setup em vez de serem tratados como vazios.
- Após o setup, o `owner` persistido é o usuário supremo. Instalações legadas promovem de forma determinística o primeiro admin ativo ao primeiro gravar o store; o owner não pode ser rebaixado, inativado ou excluído. Somente ele pode conceder ou revogar permissões individuais de usuários.
- As permissões individuais de administradores são `createUsers` e `deleteUsers`, ajustadas no menu de três pontos de cada card em `/developer/usuarios`. Elas permitem, respectivamente, criar contas com senha temporária e excluir contas não supremas; não permitem editar contas nem delegar permissões. Administradores sem a permissão correspondente não acessam a operação, e ninguém pode excluir a própria conta ou o usuário supremo.
- Na listagem de usuários do CMS, status, perfil e menu de permissões usam badges compactos com contraste próprio; o menu de três pontos abre um painel amplo, com opções em linhas clicáveis e adaptação à largura de tela.
- Contas não proprietárias exigem troca de senha antes de acessar o CMS. Registros legados sem `mustChangePassword` são tratados como pendentes por compatibilidade; novas contas e redefinições feitas pelo usuário supremo recebem senha temporária e ficam pendentes até a própria pessoa confirmar uma nova senha forte. A rota autenticada `/api/auth/change-password` exige origem permitida, JSON e CSRF; `requireAdmin` bloqueia o painel enquanto a pendência existir.
- O usuário proprietário de `admin@rodogarcia.com.br` está identificado como `Administrador - Lucas Andrade` no storage de produção.
- Senhas novas usam bcrypt; hashes legados `pbkdf2$` ainda são verificados. Senha válida tem 10 a 72 caracteres, letra minúscula, letra maiúscula e número.
- Em produção, o backend falha no boot se `JWT_SECRET` ou `SESSION_SECRET` for fraco/placeholder, se `ADMIN_SETUP_CODE` for fraco/placeholder, ou se `FRONTEND_ORIGIN`/`CORS_ORIGINS` não usarem HTTPS e origem não local.
- CORS aceita `FRONTEND_ORIGIN` e valores extras em `CORS_ORIGINS`; em desenvolvimento também aceita a variação localhost/127.0.0.1 e a origem local do backend. O IP do cliente vem de `req.ip`; `TRUST_PROXY` define explicitamente se o Express deve confiar no proxy.
- Mutação pública ou administrativa deve validar origem com `requireAllowedOrigin`; payload JSON deve passar por `requireJson`.
- Rate limits locais estão aplicados a setup, consentimento, login, leads, popup events, tracking e analytics; login bloqueia excesso de falhas por IP e por e-mail normalizado.
- O backend não deve retornar segredos, hashes, sessão, CSRF, IP bruto ou arquivos privados em endpoints públicos.
- Consentimento LGPD registra decisão, categorias, versão, device, user agent, scripts carregados/falhos e IP mascarado; localização aproximada só é persistida se permitida.
- O banner de cookies remove cookies opcionais conhecidos e storage de analytics quando consentimento é rejeitado ou revogado.
- Scripts externos de analytics/marketing só devem carregar após consentimento compatível.
- Campos de mídia do CMS aceitam somente URLs internas válidas. Referências externas, `data:`, `javascript:`, path traversal e arquivos inexistentes são proibidos.
- Ao alterar schema de conteúdo, atualizar tipos backend/frontend, sanitizadores, normalizadores públicos, telas CMS, defaults/migração de leitura, testes e este estado.
- Ao criar ou renomear rota pública, atualizar `routes.ts`, redirects/rewrites em `next.config.js` quando necessário, sitemap, robots, navegação, footer e SEO CMS.
- O build do Next executa a checagem TypeScript; o CI também roda typecheck, testes, builds e hardening ponta a ponta antes da entrega.
- `iniciar-dev.bat` encerra apenas `4012`/`5012` e bloqueia proxies/URLs de backend produtivos. `iniciar-prod.bat` valida backend e typecheck frontend, encerra `6050`/`6060`, recria `frontend/dist-prod`, executa hardening nessas portas contra esse artefato e então aplica o ecosystem no PM2 com `startOrReload` e `pm2 save`. Nenhum desses scripts deve ser executado automaticamente por IA sem pedido explícito.

## Verificação Operacional

- Backend:
  - `cd backend && cmd /c npm run typecheck`
  - `cd backend && cmd /c npm run build`
  - `cd backend && cmd /c npm test`
- Frontend:
  - `cd frontend && cmd /c npm run typecheck`
  - `cd frontend && cmd /c npm run build`
- Segurança fim a fim:
  - após builds, `node scripts/tests/test-security-hardening.js`
- Checklist técnico complementar em `docs/checklist-tecnico.md`.
- Checklist de segurança do CMS em `docs/seguranca-admin-node.md`.

## Auditoria de Segurança e Exposição

- Auditoria aplicada em 2026-07-14 ao frontend Next.js, backend Express, rotas, Client Components, configuração, storage versionado, arquivos públicos, histórico Git, bundles, respostas HTTP, CI e dependências.
- Variáveis públicas permitidas: `NEXT_PUBLIC_BACKEND_URL` e `NEXT_PUBLIC_BACKEND_PROXY_URL`, ambas exclusivamente para endereço público/proxy do backend e sem credenciais. Não há propriedade `env` em `frontend/next.config.js`.
- Não foram encontradas assinaturas de credenciais no worktree ou no histórico Git; `.env` e variações, storage privado, uploads, logs, builds, backups e caches permanecem ignorados. Nenhum arquivo sensível foi encontrado em `frontend/public`.
- Client Components não importam módulos de servidor; não há Server Actions ou App Route Handlers no código atual. Os bundles de produção não contêm `SESSION_SECRET`, `JWT_SECRET`, `ADMIN_SETUP_CODE`, hashes de senha, URL interna local ou source maps públicos.
- Endpoints administrativos e operacionais sensíveis respondem `401` sem sessão; endpoints públicos verificados retornam DTOs públicos mínimos. CORS não concede acesso a origem não confiável, e a configuração pública de analytics expõe apenas identificadores GA4/Clarity, nunca Sentry ou segredos.
- Correção aplicada: tracking e analytics públicos não aceitam, persistem nem retornam `userId` enviado pelo cliente; identificadores de sessão pseudônimos continuam sendo a única chave de agregação pública. Registros legados com esse campo são omitidos nas respostas administrativas.
- Correção aplicada: dependências de desenvolvimento do backend atualizadas de forma compatível para `tsx` 4.23.1 e `vitest` 4.1.10, corrigindo os alertas de Vite/esbuild no lockfile.
- Validações da auditoria: `npm audit --omit=dev --audit-level=high` no backend e frontend sem vulnerabilidades; auditoria completa do frontend sem vulnerabilidades; backend typecheck, testes e build; frontend typecheck e build; teste de hardening em portas isoladas; validação HTTP de autenticação, DTO de sessão, analytics público e CORS.

## Protocolo de Planejamento e Execução

- Antes de qualquer mudança, ler `AGENTS.md` e este `states.md`.
- Se a requisição for de implementação, editar diretamente os arquivos necessários e validar conforme o risco.
- Preservar contratos reais do código acima de documentação antiga ou copiada de outro projeto.
- Não introduzir dependência de banco de dados, Java, Spring, Flyway, dashboards ou ETL neste monorepo.
- Manter `Tarefas Pendentes` como lista operacional de trabalho aberto, com itens acionáveis e vinculados ao código real; não usar texto genérico de auditoria que não se aplique à arquitetura atual.
- Ao finalizar alterações, atualizar este arquivo para refletir o estado presente do sistema.
- A resposta final deve ser curta, objetiva e mencionar validações executadas ou pendências reais.

## Tarefas Pendentes

Nenhuma pendência acionável registrada no momento.

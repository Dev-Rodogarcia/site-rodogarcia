# Estado Atual do Sistema - Site Rodogarcia

## Stack Tecnológica

- Monorepo do site institucional Rodogarcia com frontend público, painel CMS interno e backend API.
- Frontend: Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/base-nova, Radix UI, Base UI, Phosphor Icons, lucide-react, Framer Motion, Recharts, React Hook Form e Zod.
- Backend: Node.js, Express 5, TypeScript ESM, Helmet, CORS, cookie-parser, multer, Sharp, Zod, bcryptjs, jsonwebtoken, dotenv e Vitest.
- Persistência atual: arquivos JSON locais em `backend/storage`, com privados em `backend/storage/private` e uploads em `backend/storage/uploads`.
- Ambiente local padrão: backend em `127.0.0.1:4010`, frontend em `127.0.0.1:5010`, CMS em `/auth/entrar` e painel em `/developer`.
- Configuração local centralizada na raiz por `.env` e `.env.example`; o backend carrega `.env` da raiz em `backend/src/config/env.ts`.
- Operação Windows com comandos npm por projeto e script opcional `iniciar.bat`.

## Arquitetura e Padrões

- A raiz do repositório é reservada para arquivos globais, documentação curta, scripts e os diretórios `backend/` e `frontend/`.
- Frontend usa App Router: páginas públicas ficam em `frontend/src/app`, autenticação em `frontend/src/app/auth` e CMS em `frontend/src/app/developer`.
- `ShellLayout` monta o chrome público com header, footer, busca, analytics e popup apenas fora das rotas auth/admin.
- `frontend/src/lib/routes.ts` é a fonte central de rotas públicas, rotas admin, endpoints de API, URLs externas, sitemap, redirects e navegação.
- Páginas públicas usam fallbacks locais e conteúdo do CMS via `/api/public/content`; SEO editável usa `/api/public/seo` por `buildCmsMetadata`.
- O CMS usa `SessionProvider`, `DeveloperAuthGate`, `DeveloperShell`, `DevSidebar`, `DevTopbar`, hooks administrativos e componentes compartilhados de `components/developer` e `components/ui`.
- Mutação client-side no CMS passa por `useApiRequest`, que injeta `X-CSRF-Token` automaticamente para métodos inseguros.
- Cache leve de recursos administrativos fica em `useAdminResource`; coleções CRUD ordenáveis usam `useAdminCollection`.
- Backend Express é montado em `createApp`, com Helmet, CORS restrito, JSON limit `8mb`, cookie parser, `/uploads` estático com `nosniff`, router `/api` e `/health`.
- O frontend aplica headers globais em `frontend/next.config.js`, incluindo CSP, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` e HSTS somente em produção.
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
- Rewrites do Next encaminham `/api/:path*` e `/uploads/:path*` para `BACKEND_INTERNAL_URL`, `BACKEND_PROXY_URL` ou `NEXT_PUBLIC_BACKEND_URL`.
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

## Segurança e Regras de Negócio Consolidadas

- Sessão administrativa usa cookie `sid` HttpOnly, `SameSite=Strict`, `Secure` em produção e TTL renovado de 8 horas.
- CSRF é gerado por sessão e exigido em mutações administrativas.
- Rotas admin exigem usuário ativo com role `admin`; o frontend também bloqueia `/developer` por `DeveloperAuthGate`.
- Primeiro usuário admin só pode ser criado se não existir usuário e se `ADMIN_SETUP_CODE` conferir; stores ilegíveis impedem o setup em vez de serem tratados como vazios.
- Após o setup, gerenciamento de usuários é restrito ao `owner` persistido. Instalações legadas promovem de forma determinística o primeiro admin ativo ao primeiro gravar o store; o owner não pode ser rebaixado, inativado ou excluído.
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
- `iniciar.bat` encerra processos nas portas padrão antes de iniciar servidores; não deve ser executado automaticamente por IA sem pedido explícito.

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

Nenhuma pendência acionável registrada.

## Atualização recente

- Removido o arquivo acidental `ss` da raiz, que continha somente um despejo de configuração local do Git e não era consumido pelo projeto; caches de build regeneráveis podem permanecer ignorados pelo Git.
- O rodapé `SiteFooter` voltou a ser Server Component e recebe o conteúdo público pela API no servidor, preservando o fallback canônico; o fragmento interativo de ícones sociais permanece isolado em Client Component.
- `CookieSettingsButton` é um Client Component isolado no rodapé; ele abre as preferências por evento para o `ConsentBanner` sem reintroduzir o botão flutuante.
- O contêiner do rodapé compartilha o grid horizontal do cabeçalho: `max-w-[1440px] px-5 sm:px-8 lg:px-10`.
- Na página `/sua-voz`, os cards da seção "Como funciona?" ocupam todo o `PageContainer` e usam o mesmo recuo lateral desktop do rodapé (`lg:px-10`), mantendo o fechamento visual alinhado ao grid global.
- Na seção de contato institucional de `/imprensa`, a coluna de introdução inclui uma nota compacta sobre retorno em dias úteis para equilibrar visualmente a altura do painel de contato, sem criar uma nova chamada concorrente.
- Na página `/sua-voz`, o card de acesso ao formulário alinha seu topo ao bloco de propósito e sua base aos destaques de anonimato e sigilo no desktop; uma FAQ própria, em seção clara com accordion, separa o processo escuro do rodapé.
- Nas introduções de `/privacidade` e `/termos-de-uso`, os cartões informativos alinham pelo topo ao resumo rápido; em termos, uma nota de uso responsável ocupa o fechamento da coluna de texto e acompanha visualmente a chamada para a política de privacidade.
- As chamadas dos cartões de resumo em `/privacidade` e `/termos-de-uso` usam a variante primária azul, consistente com a ação de formulário em `/sua-voz`.
- O preview responsivo do CMS usa o marcador `preview=cms`, que aciona headers permissivos somente para a mesma origem nas rotas públicas suportadas e elimina o bloqueio CSP do iframe sem reduzir a proteção das rotas administrativas.
- A auditoria de segurança removeu `userId` da telemetria pública, mantendo somente identificadores de sessão pseudônimos e ocultando o campo de registros legados nas respostas administrativas; dependências de desenvolvimento do backend foram atualizadas para versões sem alertas conhecidos.

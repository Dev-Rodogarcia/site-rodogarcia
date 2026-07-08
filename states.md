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
- Controllers são finos; services concentram regra de negócio; repositories encapsulam JSON; `security` guarda sessão, auth, CSRF, origin e rate limit; `validators` guarda validação de borda; `utils` guarda helpers puros.
- `readJsonFile` tolera arquivo ausente/JSON inválido retornando default; `writeJsonFile` escreve em arquivo temporário e renomeia para reduzir risco de corrupção.
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
- Primeiro usuário admin só pode ser criado se não existir usuário e se `ADMIN_SETUP_CODE` conferir.
- Após o setup, gerenciamento de usuários é restrito a usuário supremo; o usuário supremo não pode ser rebaixado, inativado ou excluído.
- Senhas novas usam bcrypt; hashes legados `pbkdf2$` ainda são verificados. Senha válida tem 10 a 72 caracteres, letra minúscula, letra maiúscula e número.
- Em produção, o backend falha no boot se `JWT_SECRET` ou `SESSION_SECRET` for fraco/placeholder, se `ADMIN_SETUP_CODE` for fraco/placeholder, ou se `FRONTEND_ORIGIN`/`CORS_ORIGINS` não usarem HTTPS e origem não local.
- CORS aceita `FRONTEND_ORIGIN` e valores extras em `CORS_ORIGINS`; em desenvolvimento também aceita a variação localhost/127.0.0.1 e a origem local do backend.
- Mutação pública ou administrativa deve validar origem com `requireAllowedOrigin`; payload JSON deve passar por `requireJson`.
- Rate limits locais estão aplicados a login, leads, popup events, tracking e analytics; login bloqueia excesso de falhas por IP e por e-mail normalizado.
- O backend não deve retornar segredos, hashes, sessão, CSRF, IP bruto ou arquivos privados em endpoints públicos.
- Consentimento LGPD registra decisão, categorias, versão, device, user agent, scripts carregados/falhos e IP mascarado; localização aproximada só é persistida se permitida.
- O banner de cookies remove cookies opcionais conhecidos e storage de analytics quando consentimento é rejeitado ou revogado.
- Scripts externos de analytics/marketing só devem carregar após consentimento compatível.
- Campos de mídia do CMS aceitam somente URLs internas válidas. Referências externas, `data:`, `javascript:`, path traversal e arquivos inexistentes são proibidos.
- Ao alterar schema de conteúdo, atualizar tipos backend/frontend, sanitizadores, normalizadores públicos, telas CMS, defaults/migração de leitura, testes e este estado.
- Ao criar ou renomear rota pública, atualizar `routes.ts`, redirects/rewrites em `next.config.js` quando necessário, sitemap, robots, navegação, footer e SEO CMS.
- O `next.config.js` está configurado com `ignoreBuildErrors`; por isso `npm run typecheck` é validação obrigatória e não pode ser substituída por `next build`.
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

## Protocolo de Planejamento e Execução

- Antes de qualquer mudança, ler `AGENTS.md` e este `states.md`.
- Se a requisição for de implementação, editar diretamente os arquivos necessários e validar conforme o risco.
- Preservar contratos reais do código acima de documentação antiga ou copiada de outro projeto.
- Não introduzir dependência de banco de dados, Java, Spring, Flyway, dashboards ou ETL neste monorepo.
- Manter `Tarefas Pendentes` como lista operacional de trabalho aberto, com itens acionáveis e vinculados ao código real; não usar texto genérico de auditoria que não se aplique à arquitetura atual.
- Ao finalizar alterações, atualizar este arquivo para refletir o estado presente do sistema.
- A resposta final deve ser curta, objetiva e mencionar validações executadas ou pendências reais.

## Tarefas Pendentes

Nenhuma tarefa pendente registrada neste momento.

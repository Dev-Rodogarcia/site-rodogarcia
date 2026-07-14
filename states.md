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

- Em `/developer/usuarios`, o formulário de criação fica compacto e fixo em desktop, enquanto os acessos cadastrados usam cartões mais densos, lista paginada em grupos de quatro e controles sempre visíveis para acompanhar o crescimento das contas.
- O editor de SEO foi reorganizado em superfícies de busca orgânica, diretivas, compartilhamento e opções avançadas; a lista de rotas fica compacta e fixa em desktop, e o salvamento permanece acessível em uma barra inferior com preview integrado.
- No bloco de Compartilhamento do SEO, a seleção de OG Image usa controles compactos sem prévia duplicada; OG Title e descrição ocupam a coluna oposta, reduzindo a altura sem remover o preview integrado da página.
- Em `/developer/rastreamento`, os Registros recentes usam quatorze linhas por página para preencher a área disponível sem ultrapassar a altura atual da seção ou a coluna de auditoria; a paginação continua ativa para os demais eventos.
- Em `/developer/rastreamento`, Tipo, Página e ações de filtro ficam ao lado de Consulta de eventos em telas largas; os botões usam a variante compacta.
- Em `/developer/leads`, busca, origem e ações de filtro ficam ao lado de Pesquisa rápida em telas largas; os botões usam a variante compacta.
- A listagem administrativa de Leads é paginada no backend e no CMS, com dez registros por página e total filtrado retornado pelo endpoint `/api/admin/leads`; os controles ficam visíveis mesmo com uma única página, desabilitados até haver mais resultados.
- O painel de Analytics usa KPIs compactos, automações e integrações com superfícies de maior contraste, e paginação compacta consistente em páginas, contagem por tipo, eventos recentes e conversões quando a lista exceder o limite atual.
- O seletor de período e o botão Atualizar do Analytics compartilham a altura dos KPIs do cabeçalho, formando uma única faixa de controles.
- Os pares de cards analíticos compartilham a mesma altura em desktop, com o conteúdo e a paginação ancorados à base para eliminar intervalos vazios entre as colunas.
- Em `/developer/monitoramento-cookies`, os filtros e ações ocupam o espaço ao lado da consulta em telas largas; os consentimentos recentes mantêm até dez registros por página, com paginação imediata quando houver resultados adicionais.
- O editor de LGPD/Cookies foi reorganizado em blocos de banner, regras, posicionamento e categorias; as categorias do CMS são paginadas em grupos de quatro e a barra de salvamento permanece acessível no fim da edição.
- O editor de LGPD/Cookies reutiliza `DeveloperResponsivePreview` com Desktop, Tablet e Mobile visíveis por padrão; o parâmetro interno `consent-preview=1` mantém o banner público exposto nos iframes de preview.
- Ao abrir Preferências no banner público, as categorias são exibidas em uma janela modal paginada em grupos de três, evitando o crescimento vertical do banner quando houver muitas categorias.
- O banner público de cookies permanece centralizado no desktop, assim como a janela de preferências; a posição lateral configurada anteriormente não desloca mais a experiência pública.
- Os cartões de Leads recentes e Eventos recentes do Popup de saída usam flex vertical com paginação ancorada no rodapé comum, alinhando as barras mesmo quando os registros ocupam alturas diferentes.
- As paginações de Leads recentes e Eventos recentes do Popup de saída usam a mesma variante compacta, alinhando altura, divisória e controles dos dois cartões lado a lado.
- A Biblioteca de mídia do CMS agora é globalmente exclusiva: ao abrir um seletor, qualquer outro modal de mídia fecha; o fundo fica sem rolagem enquanto a janela ativa estiver aberta, evitando sobreposição de bibliotecas.
- A ativação do Popup de saída foi resumida em uma linha compacta com contexto e checkbox, removendo a descrição e o painel interno redundantes.
- A paginação dos Leads recentes do Popup de saída permanece visível mesmo com apenas uma página de até quatro contatos; os controles ficam desabilitados até haver novos registros, deixando o comportamento preparado e explícito.
- Na configuração responsiva do Popup de saída, o título e o título da folha do Mobile são exibidos lado a lado em telas médias e largas; descrição e imagem continuam em largura total, igualando a altura útil aos campos do Desktop.
- Na seção de conteúdo do Popup de saída, os três textos auxiliares compartilham a mesma linha em desktop e a imagem padrão usa seleção compacta sem prévia vazia, reduzindo a altura do editor.
- Os cartões de configuração desktop e mobile do Popup de saída não esticam mais para igualar altura; seus seletores de imagem usam o modo compacto, pois a Biblioteca modal já oferece prévia e escolha visual sem criar espaços vazios no editor.
- A análise do Popup de saída foi condensada: indicadores horizontais de menor altura, top páginas em duas colunas e paginação compacta preservam os dados sem áreas vazias.
- `DeveloperMediaField` abre a Biblioteca em modal paginado, com até doze arquivos por página, rolagem interna limitada e fechamento por clique externo, botão ou Escape; a escolha fecha o modal e atualiza o campo sem alongar o formulário do CMS.
- No editor do Popup de saída, a seção Textos do popup passou a separar mensagem principal, textos auxiliares e imagem padrão em superfícies hierárquicas; a biblioteca de mídia ocupa uma linha própria abaixo dos textos, eliminando o espaço vazio lateral sem alterar o contrato de configuração.
- Os selects nativos do CMS passaram a aplicar globalmente a tipografia Plus Jakarta Sans, peso, tamanho, cores e espaçamento também às opções abertas, reduzindo a diferença visual entre o campo e sua lista de escolhas.
- No editor de Imagens, o cartão da Biblioteca usa a altura compartilhada com os Slots e mantém sua paginação ancorada no rodapé para alinhar os controles das duas colunas.
- A Biblioteca do editor de Imagens passou a mostrar até doze mídias por página, preenchendo quatro linhas no grid largo antes de exibir a paginação.
- No editor de Imagens, a configuração de Slots exibe oito controles por página, equilibrando a altura do painel com a Biblioteca; seus cards têm espaçamento mais arejado e a barra inferior agrupa navegação e salvamento sem espaços ociosos.
- O editor de Footer Links passou a organizar suas três áreas em paginação por etapas no topo: páginas institucionais, links gerais do footer e redes sociais; os controles Anterior/Próximo e os cartões de etapa mantêm apenas a edição selecionada visível.
- Na Etapa 1 de Footer Links, os três accordions de páginas institucionais usam o acabamento azul de aberto e cinza de fechado do padrão de Serviços; as Etapas 2 e 3 deixam seus únicos grupos de campos abertos, sem accordion redundante.
- Os editores de Termos de Uso, Central de Ajuda e Privacidade diferenciam visualmente hero, cabeçalhos de conteúdo, cartões auxiliares e CTAs com superfícies azul-suave, cinza-neutro e destaque de ação, reduzindo a repetição de painéis brancos sem alterar seus contratos de edição.
- Os grupos de botões, blocos de texto, contatos, perguntas fixas, links gerais e horários de Footer Links usam superfícies neutras mais densas para reforçar sua separação; em Redes Sociais, o título e a ação de criar rede ficam na mesma linha, e cada rede organiza texto, link e ícone lado a lado em telas largas.
- Na Etapa 2, cada coluna de links ganhou destaque azul-suave e seus links internos uma superfície neutra própria; o mesmo contraste entre grupo e item interno foi aplicado aos blocos de texto, ações rápidas e perguntas fixas das páginas institucionais, evitando repetição visual entre níveis aninhados.
- A faixa de Edição por etapas de Footer Links e o editor de Páginas Institucionais usam espaçamentos, cartões e controles mais compactos; o `DeveloperCmsAccordion` oferece a variante reutilizável `compact`, aplicada aos três accordions institucionais sem reduzir os campos de edição abertos.
- Footer Links reutiliza o preview responsivo padrão com os mesmos viewports das demais páginas (1440×900, 768×900 e 390×780). O iframe carrega a Home pública, começa no âncora `#contato` do footer e preserva a rolagem da página inteira; uma revisão de URL atualiza o preview após cada salvamento.
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
- No dashboard do CMS, o card "Top páginas do site" exibe somente as oito rotas mais acessadas, distribuídas pela altura disponível da grade, sem paginação.
- `DeveloperResponsivePreview` não cria rolagem própria: o zoom é limitado ao espaço disponível do card e a rolagem permanece dentro da página pública carregada no iframe.
- `DeveloperResponsivePreview` abre no modo "Todos" por padrão, exibindo Desktop, Tablet e Mobile lado a lado no mesmo painel de preview, com uma altura-alvo única e escalas proporcionais por viewport. Os iframes não usam moldura clara individual e se separam apenas pelo gap. Os controles individuais isolam somente o formato escolhido, mantendo o zoom e o scroll dentro de cada iframe.
- O editor de Serviços também exibe `DeveloperResponsivePreview` para `/servicos`, reutilizando os modos Todos/Desktop/Tablet/Mobile da Home.
- Nos modos individuais do `DeveloperResponsivePreview`, o frame selecionado fica centralizado dentro do painel; o modo Todos preserva os três formatos lado a lado.
- No editor da Home, o bloco "Edição por etapas" usa fundo azul-claro da paleta institucional para se diferenciar dos cards de conteúdo; as etapas inativas permanecem brancas e a ativa usa azul por borda, fundo e numeração, sem faixa superior, enquanto os controles de navegação permanecem neutros e compactos.
- Os cartões de etapa da Home usam estrutura flexível com altura mínima e cabeçalho/título em alturas reservadas, mantendo todos os títulos alinhados na mesma linha.
- Os grupos internos dos oito fluxos do editor da Home usam superfícies brancas com borda e sombra azul discretas; os accordions abertos recebem borda, halo e cabeçalho azul-claro, com o conteúdo em superfície branca. Não há marcador lateral, e a faixa "Edição por etapas" permanece fora desse escopo visual.
- Os grupos de campos principais das etapas 3, 4, 5 e 8 da Home usam gradiente azul-claro, borda azul e halo suave para se diferenciarem claramente dos painéis externos, preservando campos de entrada brancos.
- Na etapa de Presença Regional da Home, a seleção de unidades usa um seletor compacto com numeração e estado ativo destacado; os controles de reordenação e remoção da unidade aberta têm dimensões e hierarquia visual consistentes.
- Nas etapas 1, 3, 4, 5 e 8 do editor da Home, os conteúdos internos de slides, itens, cards e feedbacks têm hierarquia em três níveis: configuração em azul suave, mídia e depoimento como bloco prioritário, e CTAs/dados auxiliares em superfície branca destacada. As etapas 2, 6 e 7 não usam essa variação adicional.
- Na configuração de slides do Hero, modo de exibição, título e status usam rótulo, controle e linha auxiliar abaixo, mantendo os três campos organizados na mesma grade; o status não estica para acompanhar os campos adjacentes.
- `DeveloperColorField` usa amostra de cor totalmente arredondada e controlada por input nativo invisível, evitando a aparência de quadrado interno; o hexadecimal permanece ao lado.
- No editor da Home, os atalhos organizam texto, tipo e ícone na primeira linha; link, arquivo e visibilidade na segunda, com o status em controle compacto de largura natural. O detalhe de feedback organiza depoimento e mídia em colunas no desktop e mantém o status em largura natural.
- No detalhe de feedback da Home, o depoimento usa uma área de edição de 10 linhas para se alinhar ao bloco de foto/logo; os controles da mídia ficam empilhados, com Biblioteca mais larga e o status do feedback logo abaixo dela.
- Os indicadores de rolagem do menu lateral do CMS usam um degradê de quatro paradas, sem `backdrop-blur`, para que a transição com os itens de navegação não crie um corte horizontal visível.
- No editor de Serviços, a seleção dos três módulos fixos fica logo abaixo do cabeçalho da seção, antes dos campos do módulo ativo. Não há faixas azuis: o módulo ativo é diferenciado por borda, superfície azul-clara e sombra. O cabeçalho do módulo, mídia e conteúdo principal usam destaque azul suave; tópicos e CTA usam superfícies neutras em cinza mais fechado para tornar a edição mais legível.
- O bloco "CTA final" do editor de Serviços usa uma superfície institucional azul-clara com borda e halo discretos; os dois links permanecem em uma sub-superfície branca para priorizar a ação sem perder a leitura dos campos.
- O formulário do CTA final organiza em telas largas duas colunas flexíveis para os links e uma terceira coluna automática para a ação de salvar, identificada por "Salvar alterações"; assim, os inputs ocupam todo o espaço restante e o botão mantém seu tamanho natural à direita.
- Na FAQ do editor de Serviços, os accordions abertos ganham borda, halo e cabeçalho azul-claro, com conteúdo em branco; os fechados usam cinza médio com borda e sombra mais presentes para não se confundirem com o fundo do editor.
- `DeveloperHero`, o cartão de contexto compartilhado pelos editores do CMS, mantém superfície neutra branca com mais respiro; seus indicadores têm largura mínima, espaçamento consistente e superfícies cinza-claro para evitar uma composição espremida, sem usar destaque azul ou faixa superior.
- A mídia dos módulos de Serviços usa o preview na primeira coluna; no espaço restante, arquivo e texto alternativo ocupam a primeira linha, enquanto o enquadramento ocupa toda a segunda, eliminando a área vazia sob a seleção de arquivo. `DeveloperMediaField` oferece a opção reutilizável `equalControlWidths` para manter Arquivo e Biblioteca proporcionais.
- No editor da Página Sobre, as três seções fixas Hero, Governança e CTA final são alternadas por um seletor único, no padrão dos módulos de Serviços. A seção ativa concentra a edição em painel destacado, com mídia e conteúdo principal em azul suave, campos auxiliares neutros e preview de mídia ao lado dos controles.
- Na Página Sobre, os grupos de Botão 1 e Botão 2 do Hero e do CTA final usam a superfície neutra mais escura dos tópicos e CTAs de Serviços; a governança mantém o destaque já aplicado ao certificado.
- Os previews de mídia das seções Hero e Governança da Página Sobre usam a variante compacta, com coluna menor e menos espaço interno, preservando arquivo, biblioteca e texto alternativo alinhados no restante do painel.
- No editor da Página Para Empresas, os dois botões de "Pronto para escalar" usam a mesma superfície neutra mais escura dos botões da Página Sobre; a FAQ replica o acabamento dos accordions de Serviços, com itens fechados em cinza, item aberto em azul-claro e conteúdo branco.
- No editor de Fale Conosco, o botão do Hero e os botões dos três canais fixos dispõem texto e link lado a lado em telas médias; os accordions de canais e informações oficiais usam o mesmo acabamento de Serviços. O bloco de informações principais, antes estático, é agora um accordion expansível próprio.
- No CTA final do editor de Fale Conosco, os grupos de Botão 1 e Botão 2 também usam a superfície neutra mais escura adotada nos demais botões destacados.
- Dentro do accordion de Informações Principais em Fale Conosco, os campos são distribuídos em duas colunas verticais independentes, equilibrando inputs e áreas de texto e eliminando vazios criados pela grade por linhas.
- Os accordions de Canais, Informações Principais e Indicadores do card Informações Oficiais em Fale Conosco compartilham um único estado: somente um item pode permanecer aberto por vez.
- O grupo do Botão WhatsApp no Hero de Fale Conosco usa a superfície neutra escura dos CTAs destacados e um cabeçalho compacto; em botões únicos, o título não adiciona margem de seção extra antes dos campos em duas colunas.
- No editor de Trabalhe Conosco, os grupos de Botão 1 e Botão 2 do Hero, Candidatura direta e CTA final usam a superfície neutra mais escura já adotada no editor de Fale Conosco; o accordion de Vagas segue os estados fechado em cinza e aberto em azul-claro do padrão de Serviços.
- A edição da foto de Cultura e benefícios em Trabalhe Conosco usa preview compacto ao lado dos controles de arquivo e texto alternativo, eliminando o espaço interno ocioso do card.
- O editor da foto de Cultura e benefícios reúne preview, seleção de arquivo, texto alternativo e ação de salvar em uma única superfície compacta, com o botão alinhado ao rodapé à direita.
- No editor de Cotação, os botões do Hero e CTA final usam a superfície neutra escura dos demais CTAs destacados. Os accordions de Canais diretos e Cards dinâmicos adotam o acabamento de Serviços e mantêm estados de abertura independentes, impedindo que a interação em uma lista abra o card de mesmo índice na outra.
- Nos Cards dinâmicos de Cotação, a cor do botão ocupa a linha completa e o editor do botão único organiza texto e link lado a lado, reduzindo a altura e eliminando áreas internas vazias.
- Nos Canais diretos de Cotação, o botão único também usa texto e link lado a lado, com espaçamentos internos reduzidos nos campos fixos.

# Regras Operacionais para IAs - Site Rodogarcia

Você atua como Engenheiro de Software Principal neste repositório. O projeto atual é o site institucional da Rodogarcia com frontend Next.js, painel CMS interno e backend Node.js/Express em TypeScript. Seu objetivo é resolver a tarefa solicitada mantendo a integridade do site público, do CMS, da segurança e da persistência local em JSON.

---

## Garantia de Contexto Antes de Agir

- Antes de qualquer planejamento, análise ou escrita de código, leia este `AGENTS.md` e o `states.md` local.
- O `states.md` registra o estado atual do sistema, os contratos vigentes e as tarefas pendentes. Use-o como fonte operacional viva.
- Em caso de conflito entre documentação antiga e código atual, preserve o comportamento real do monorepo e atualize o `states.md` para eliminar ambiguidade.

## Comunicação e Execução

- Não resuma nem repita no chat o conteúdo de `AGENTS.md` ou `states.md`.
- Para tarefas de implementação, avance diretamente para as modificações necessárias e entregue um fechamento objetivo.
- Não crie planos longos no chat quando a intenção do usuário já estiver clara; implemente, valide e atualize o estado.
- Ao finalizar qualquer alteração de código, configuração, contrato de dados, conteúdo canônico ou regra operacional, atualize obrigatoriamente o `states.md`.

---

## Bloqueios de Execução e Segurança Operacional

- Não execute `iniciar-dev.bat` ou `iniciar-prod.bat` sem pedido explícito do usuário. Esses scripts encerram processos e abrem janelas externas.
- Não derrube, reinicie, libere ou mate processos nas portas `4010`/`5010` (produção) ou `4011`/`5011` (desenvolvimento) sem pedido explícito.
- Prefira `npm run dev`, `npm run typecheck`, `npm run build` e `npm test` dentro de `backend/` ou `frontend/` conforme o escopo.
- Não edite `.env`, `.env.*` reais, credenciais, chaves, arquivos privados de storage, backups ou uploads de produção sem solicitação explícita.
- Não versionar dados sensíveis: `backend/storage/private/**`, `backend/storage/uploads/**`, JSONs operacionais privados, logs, builds e caches devem permanecer fora do Git.
- Não altere remotes Git, credenciais locais, arquivos de configuração global ou conteúdo fora do workspace.

## Escopo de Escrita Permitido

- Você pode alterar código TypeScript/TSX, CSS, componentes, rotas, controllers, services, repositories, validators, types, testes, docs e exemplos de configuração.
- Você pode atualizar os JSONs canônicos versionados quando a tarefa envolver conteúdo público inicial, schema de CMS ou defaults de desenvolvimento.
- Não edite `node_modules`, `.next`, `dist`, caches, artefatos gerados ou arquivos ignorados sem necessidade explícita.
- A raiz do repositório deve continuar reservada para arquivos globais e as aplicações: `README.md`, `AGENTS.md`, `states.md`, `.env.example`, `docs/`, `scripts/`, `backend/`, `frontend/` e `landing-builder/`. A futura extração física para `site/` e `cms/` será tratada como migração própria, sem misturar esse risco com a evolução do construtor.

---

## Arquitetura do Projeto

### Frontend

- O frontend fica em `frontend/` e usa Next.js App Router, React, TypeScript e Tailwind CSS.
- Rotas públicas ficam em `frontend/src/app/*`.
- Rotas de autenticação ficam em `frontend/src/app/auth/*`.
- Rotas do CMS ficam em `frontend/src/app/developer/*` e usam `DeveloperAuthGate` e `DeveloperShell`.
- `frontend/src/components/layout/ShellLayout.tsx` define o chrome público e remove header/footer em auth/admin.
- Constantes de rotas, navegação, sitemap, aliases e URLs externas ficam em `frontend/src/lib/routes.ts`.
- Fetch server-side para conteúdo público fica em `frontend/src/lib/api.ts`; mutações client-side devem passar por `useApiRequest` para injetar CSRF.
- Recursos administrativos devem reutilizar `useAdminResource`, `useAdminCollection`, componentes de `components/developer` e componentes `components/ui` existentes.

### Backend

- O backend fica em `backend/` e usa Node.js, Express 5 e TypeScript com módulos ESM.
- `backend/src/app.ts` monta Helmet, CORS, JSON parser, cookies, estáticos de uploads, `/api` e `/health`.
- `backend/src/server.ts` apenas inicia o servidor HTTP.
- Controllers são fronteiras HTTP finas em `backend/src/controllers`.
- Services concentram regras de negócio em `backend/src/services`.
- Repositories encapsulam persistência JSON em `backend/src/repositories`.
- `backend/src/security` concentra sessão, autenticação, CSRF, CORS/origin e rate limit.
- `backend/src/config` concentra ambiente e paths de storage.
- `backend/src/validators`, `backend/src/types` e `backend/src/utils` devem permanecer como contratos, validações e helpers puros.

---

## Clean Code e Manutenibilidade

- Preserve as responsabilidades já consolidadas: controllers apenas traduzem HTTP, services concentram regra de negócio, repositories fazem persistência JSON, validators/types/utils ficam puros e reutilizáveis.
- Trate entrada externa como `unknown` na borda, valide/sanitize antes de usar e nunca propague `req.body`, query string ou payload de CMS sem normalização explícita.
- Prefira tipos e contratos existentes antes de criar novos formatos; ao mudar schema, mantenha tipos backend/frontend, sanitização, normalização pública, CMS e testes sincronizados.
- Evite duplicação de rotas, labels canônicos, URLs externas, limites, regras de mídia e textos de negócio; use `routes.ts`, storage canônico, validators e helpers locais como fonte única.
- Escreva funções e componentes coesos, com nomes claros e fluxo legível. Extraia helpers quando reduzir ramificações reais ou repetição significativa, não para criar abstração prematura.
- Mantenha React Components focados em renderização e interação; transformação pesada de dados deve ficar em helpers, hooks ou camada de API já existente.
- Não use `any` como atalho. Quando a entrada for dinâmica, modele com `unknown`, type guards, Zod ou sanitizadores já presentes.
- Use `HttpError` e `asyncHandler` nas bordas HTTP do backend, preservando mensagens seguras e sem vazar detalhes internos.
- Comentários devem explicar decisões, contratos ou exceções não óbvias; não comente código autoexplicativo.
- Testes devem acompanhar risco e superfície alterada: services, security, media, storage, validators e contratos compartilhados exigem cobertura próxima da mudança.

### Ajuda Contextual do CMS

- `frontend/src/lib/cmsHelp.ts` é a fonte única das explicações exibidas pelas interrogações do CMS. Use os componentes `DeveloperHelp`, `DeveloperField`, `DeveloperSectionHeading` e `DeveloperCmsAccordion`; não replique descrições de ajuda diretamente em telas novas quando um template puder representar o contrato.
- Ao criar, remover ou alterar um controle, uma regra de negócio, um destino público, uma validação, um schema ou um fluxo de salvamento do CMS, revise obrigatoriamente a ajuda correspondente em `cmsHelp.ts`. Se a mudança altera o que o controle faz, recebe, valida, grava ou afeta, a explicação deve mudar no mesmo commit.
- Ajuda de campos e seções comuns deve informar, em linguagem que uma pessoa não técnica entenda, o que controla, de onde vem, onde aparece ou é usada e o efeito após salvar. Cite a rota ou área pública real sempre que ela existir; não use fórmulas vagas como “recurso correspondente”, “conteúdo administrado” ou “comportamento público” sem explicar qual elemento o visitante verá afetado. Controles com impacto técnico, operacional, de segurança, integração ou publicação precisam também explicar o contrato, formato aceito, cálculo, limite ou validação aplicável.
- Toda ficha estruturada deve começar por `Resumo`: uma explicação curta, pessoal e sem jargão que diga o que a pessoa preenche ou escolhe, o que isso muda e onde o visitante perceberá a mudança. Os detalhes técnicos vêm depois desse resumo, nunca no lugar dele.
- Prefira templates específicos por rota, tipo e chave semântica para controles críticos. O fallback automático deve usar o perfil real da rota e da categoria do campo (texto, botão, mídia, SEO, contato, status, cor, prazo ou filtro); é proibido gerar frases de preenchimento como “altere um campo”, “bloco correspondente” ou “recurso administrado”.

---

## Persistência e Conteúdo

- A persistência atual é JSON local, não banco de dados.
- `backend/storage/content.json` e `backend/storage/site-texts.json` são conteúdo público canônico versionado.
- `backend/storage/private/**` guarda usuários, sessões, analytics, consentimentos, auditoria e rate limit locais; não deve ser versionado.
- `backend/storage/uploads/**` guarda uploads de runtime; não deve ser versionado.
- Novos arquivos de storage devem ser declarados em `backend/src/config/storagePaths.ts`, acessados por repository e cobertos pelo `.gitignore` quando forem privados/runtime.
- Escrita JSON deve passar por `readJsonFile`/`writeJsonFile` ou repositories existentes para preservar criação de diretório e escrita atômica.
- Mudanças de schema de conteúdo devem atualizar types backend/frontend, sanitização, normalização pública, telas do CMS, defaults/migração de leitura e testes quando aplicável.
- Backups completos do storage local devem usar `node scripts/backup-storage.js`; restores devem usar `node scripts/restore-storage.js --backup ... --confirm-restore` e seguir `docs/backup-restore-json.md`.

## Mídia e Uploads

- O CMS só deve aceitar mídia interna validada. É proibido permitir `http://`, `https://`, `data:`, `javascript:`, path traversal ou referência inexistente em campos de mídia.
- Validações de mídia ficam em `mediaValidationService`.
- Uploads de imagem aceitam PNG, JPG/JPEG, WebP e AVIF, validam assinatura real e geram WebP otimizado, thumbnail, medium e large via Sharp.
- Uploads de vídeo aceitam MP4, WebM e Ogg, validam assinatura real e não são convertidos para WebP.
- Ao alterar contratos de mídia, atualize backend, CMS, frontend público, testes de mídia e documentação.

---

## Segurança

- Sessão administrativa usa cookie `sid` HttpOnly, `SameSite=Strict` e `Secure` em produção.
- Rotas administrativas exigem `requireAdmin`; mutações administrativas também exigem `requireAllowedOrigin`, `requireJson` quando houver JSON e `requireCsrf`.
- Rotas públicas mutáveis, como formulários, consentimento, analytics e popup, devem validar origem e tipo de conteúdo.
- Setup inicial de administrador depende de `ADMIN_SETUP_CODE` somente quando ainda não existem usuários.
- Em produção, `JWT_SECRET` ou `SESSION_SECRET`, `ADMIN_SETUP_CODE`, `FRONTEND_ORIGIN` e `CORS_ORIGINS` devem passar pelo hardening de `backend/src/config/env.ts`: secrets fortes, setup code forte e origens HTTPS não locais.
- Gestão de usuários após o setup exige usuário supremo (`SUPREME_ADMIN_EMAILS`, e-mail dev configurado ou regra atual de usuário supremo).
- Senhas novas usam bcrypt; hashes legados PBKDF2 continuam verificáveis.
- Preserve rate limits existentes para login, leads, popup e analytics.
- Nunca exponha segredos, hash de senha, sessão, IP bruto ou arquivos privados em logs, respostas públicas ou páginas estáticas.

### Exposição de Dados e Dependências

- Nunca coloque senhas, tokens, API keys privadas, segredos JWT, credenciais SMTP/OAuth, URLs internas sensíveis ou dados administrativos em variáveis `NEXT_PUBLIC_*`; toda variável com esse prefixo é pública por definição.
- Não use a propriedade `env` de `frontend/next.config.js` para informações privadas. Novas variáveis de ambiente devem ser documentadas em `.env.example` e no `states.md`, marcadas explicitamente como públicas ou privadas.
- Client Components não podem importar código exclusivo de servidor, repositórios, services, módulos de segurança, arquivos de configuração de ambiente, SDKs administrativos ou módulos Node.js.
- Autorização no frontend é apenas UX: toda Server Action, Route Handler e endpoint deve validar autenticação e autorização no servidor, sem confiar em IDs, roles ou permissões vindos do cliente.
- Respostas HTTP, props de Client Components e dados de hidratação devem expor somente os campos necessários; nunca retornar objetos completos de usuário, sessão ou entidades privadas quando um DTO mínimo for suficiente.
- Nunca registrar tokens, cookies, senhas, hashes, segredos, IPs brutos ou dados pessoais desnecessários em logs, erros, analytics ou auditoria.
- Nenhum arquivo sensível pode ficar em `frontend/public/`; certificados, dumps, logs, credenciais, backups e storage privado devem permanecer ignorados pelo Git.
- Em alterações que afetem segurança, dados, ambiente ou dependências, verificar bundle/HTML/respostas HTTP, executar typecheck, testes e builds aplicáveis e rodar o hardening ponta a ponta quando o escopo incluir backend ou headers.
- Vulnerabilidades de dependências devem ser avaliadas e corrigidas por atualizações compatíveis; não introduza upgrades major sem análise explícita de compatibilidade.

## LGPD, Analytics e Leads

- O banner de consentimento grava decisão no `localStorage`, permite reabrir preferências e remove cookies opcionais conhecidos quando analytics/marketing são negados.
- Scripts externos de analytics só podem carregar depois de consentimento compatível.
- Consentimentos devem registrar status, categorias, versão, device, IP mascarado e dados permitidos pela escolha do usuário.
- Eventos de tracking e analytics devem permanecer agregados/operacionais, sem transformar o site em coletor de dados pessoais desnecessários.

---

## Governança de Rotas, SEO e Conteúdo Público

- Ao criar, remover ou renomear rota pública, atualize `frontend/src/lib/routes.ts`, `next.config.js` quando houver redirect/rewrite, `sitemap.ts`, `robots.ts` quando aplicável, navegação, footer e CMS se a rota for editável.
- Páginas públicas devem usar metadata consistente via `buildCmsMetadata` quando tiverem SEO editável pelo CMS.
- Conteúdo público consumido por Server Components vem de `/api/public/content`, `/api/public/seo` e `/api/public/media-slots`.
- Se uma página depender de seção editável, mantenha fallback seguro para backend indisponível ou conteúdo incompleto.
- Não duplique textos de negócio em múltiplos lugares quando eles já vierem do CMS ou de `site-texts`.

## Diretrizes de Frontend e UX

- Preserve a identidade visual da Rodogarcia e os padrões atuais de layout.
- Site público deve priorizar marca, mídia real/curada, performance, acessibilidade, SEO e responsividade.
- CMS deve ser denso, claro e operacional, sem aparência de landing page.
- Use componentes e tokens existentes antes de criar novo padrão visual.
- Botões com ícones devem usar a biblioteca já usada no contexto do componente (`lucide-react` ou `@phosphor-icons/react`).
- Não introduza textos visíveis explicando o funcionamento interno da aplicação.
- Todo texto visível deve caber em mobile e desktop sem sobreposição.
- Ao mexer em carrosséis, menus, modais, formulários ou áreas administrativas, valide estados vazio, carregando, erro, sucesso e responsivo.

---

## Validação Obrigatória

- Backend:
  - `cd backend && cmd /c npm run typecheck`
  - `cd backend && cmd /c npm run build`
  - `cd backend && cmd /c npm test` quando alterar services, security, media, storage ou validações.
- Frontend:
  - `cd frontend && cmd /c npm run typecheck`
  - `cd frontend && cmd /c npm run build`
- O `next.config.js` ignora erros de TypeScript durante build; por isso o typecheck separado do frontend é obrigatório.
- Para hardening de segurança fim a fim, após builds:
  - `node scripts/tests/test-security-hardening.js`
- Se iniciar servidor de desenvolvimento para validação visual, use os scripts npm do projeto e encerre apenas o processo que você iniciou.

## Sincronização de Estado

- Antes de implementar, leia `states.md`.
- Após implementar, atualize `states.md` para refletir o estado real.
- A seção `Tarefas Pendentes` deve continuar existindo quando houver trabalho aberto e conter apenas itens acionáveis, verificados no código atual, com rota/arquivo/contrato afetado quando possível.
- Remova tarefas concluídas da seção `Tarefas Pendentes` e não substitua pendências reais por auditorias genéricas sem vínculo com este monorepo.
- Registre novas regras consolidadas em `Arquitetura e Padrões`, `Fluxo de Dados e Integrações` ou `Regras de Negócio Consolidadas`.
- Nunca finalize uma mudança sem deixar `states.md` coerente com o código entregue.

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
- A IA nunca inicia produção nem executa `iniciar-prod.bat`/restart de PM2: essa operação é exclusivamente manual da equipe responsável, em janela autorizada. O modo DEV também é iniciado manualmente pelo usuário; a IA apenas pode fazer verificações não destrutivas nos processos já ativos.
- Não derrube, reinicie, libere ou mate processos nas portas `4010`/`5010` (produção) ou `4011`/`5011` (desenvolvimento) sem pedido explícito.
- Prefira `npm run dev`, `npm run typecheck`, `npm run build` e `npm test` dentro de `site/backend/` ou `site/frontend/` conforme o escopo.
- Não edite `.env`, `.env.*` reais, credenciais, chaves, arquivos privados de storage, backups ou uploads de produção sem solicitação explícita.
- Não versionar dados sensíveis: `site/backend/storage/private/**`, `site/backend/storage/uploads/**`, JSONs operacionais privados, logs, builds e caches devem permanecer fora do Git.
- Não altere remotes Git, credenciais locais, arquivos de configuração global ou conteúdo fora do workspace.

## Escopo de Escrita Permitido

- Você pode alterar código TypeScript/TSX, CSS, componentes, rotas, controllers, services, repositories, validators, types, testes, docs e exemplos de configuração.
- Você pode atualizar os JSONs canônicos versionados quando a tarefa envolver conteúdo público inicial, schema de CMS ou defaults de desenvolvimento.
- Não edite `node_modules`, `.next`, `dist`, caches, artefatos gerados ou arquivos ignorados sem necessidade explícita.
- A raiz do repositório deve continuar reservada para arquivos globais e as áreas `site/`, `landing-builder/`, `cms/` e `shared/`; `site/` contém `backend/` e `frontend/`. `shared/` contém contratos, hooks e utilitários agnósticos de aplicação; não deve conter UI, runtime Next nem regra exclusiva do site ou do CMS. A extração para `cms/` é física: arquivos já migrados não devem ser duplicados ou restaurados em `site/frontend` ou `site/backend`; `cms/frontend` e `cms/backend` são as origens definitivas do runtime administrativo.

---

## Arquitetura do Projeto

### Frontend

- O frontend fica em `site/frontend/` e usa Next.js App Router, React, TypeScript e Tailwind CSS.
- Rotas públicas ficam em `site/frontend/src/app/*`.
- O frontend público encaminha `/admin` e `/admin/:path*` ao processo privado do CMS por `CMS_INTERNAL_URL`; APIs e uploads do navegador continuam em `/api/*` e `/uploads/*` no mesmo hostname público. Rewrites de auth/admin, conteúdo, mídia/uploads, formulários, consentimento, analytics, popup, tracking e leads seguem para `CMS_BACKEND_INTERNAL_URL`; ESL, CEP e CNPJ seguem para o backend público. Quando o Landing Builder estiver configurado, `/landing-assets/_next/*` e `/landing-media/*` seguem para ele e o fallback por slug só ocorre depois das rotas institucionais.
- `site/frontend/src/components/layout/ShellLayout.tsx` define somente o chrome público.
- Constantes de rotas, navegação, sitemap, aliases públicos e URLs externas ficam em `site/frontend/src/lib/routes.ts`. Aliases antigos de CMS são tratados no `next.config.js`, sem recriar rotas administrativas no bundle público.
- Fetch server-side para conteúdo público fica em `site/frontend/src/lib/api.ts`; mutações client-side devem passar por `useApiRequest` para injetar CSRF.

### CMS frontend

- O CMS fica em `cms/frontend/`, usa Next.js App Router e expõe internamente as rotas lógicas `/auth/*` e `/developer/*` com `basePath: "/admin"`; a URL visível é sempre `/admin/...`.
- `cms/frontend/src/lib/routes.ts` é a fonte de rotas lógicas do CMS e deve usar `cmsHref`, `normalizeCmsPathname`, `siteUrl` e `resolveCmsMediaUrl` quando a URL for exibida no navegador, usada em ACL ou apontar ao site público.
- `CMS_BACKEND_PROXY_URL` é privado e só serve ao CMS aberto diretamente em desenvolvimento; aponta para `cms/backend`. Em produção, as chamadas do navegador seguem pelo gateway do site em `/api` e `/uploads`.
- Recursos administrativos reutilizam `useAdminResource`, `useAdminCollection`, `components/developer` e componentes `components/ui` do próprio CMS. É proibido importar código de `site/frontend/src` em `cms/frontend` ou o inverso; o que for realmente comum pertence a `shared/`.

### Backend público

- O backend público fica em `site/backend/`, usa Node.js, Express 5 e TypeScript ESM e atende exclusivamente transporte ESL e consultas públicas de CEP/CNPJ.
- `site/backend/src/app.ts` monta Helmet, CORS, JSON parser, `/api` e `/health`; ele não serve uploads nem mantém sessão, usuários, conteúdo ou outras coleções administrativas.
- Controllers são fronteiras HTTP finas, services concentram integração/regras ESL e repositories encapsulam apenas o rate limit operacional desse processo.
- `site/backend/src/config`, `security`, `validators`, `types` e `utils` mantêm somente os contratos necessários à sua superfície pública.

### Backend CMS

- O runtime administrativo fica em `cms/backend/`, usa Node.js, Express 5 e TypeScript ESM e é a origem definitiva de auth, sessão, ACL, CSRF, conteúdo, SEO, mídia, uploads, formulários/leads, consentimento, analytics, popup, melhorias, auditoria e scheduler.
- `cms/backend/src/app.ts` monta Helmet, CORS, JSON parser, cookies, `/uploads` estático com `nosniff`, `/api` e `/health`; `server.ts` inicia o HTTP e o scheduler administrativo.
- Controllers são fronteiras HTTP finas em `cms/backend/src/controllers`; services concentram regras de negócio; repositories encapsulam JSON; `security` concentra sessão, autenticação, CSRF, CORS/origin e rate limits; config, validators, types e utils permanecem coesos e locais.
- Não importe módulos de runtime entre `cms/backend/src/**` e `site/backend/src/**`. Compartilhe somente contratos realmente agnósticos em `shared/`; não duplique writers para uma coleção JSON.

### Landing Builder

- O Landing Builder é um runtime separado: somente `landing-builder/backend` escreve `landings.json`, `media.json` e `media/` no volume próprio; o CMS o consome pela API interna autenticada por `LANDING_BUILDER_SERVICE_TOKEN`.
- Mídia de campanha usa exclusivamente `/landing-media/:id`, com assinatura real, limites e referências internas. Prévia de rascunho usa token opaco, `noindex` e nunca entra no DTO público, sitemap ou analytics.
- A resposta pública da campanha é um DTO mínimo. Mutações internas exigem token de serviço e JSON/multipart correspondente; erros não podem revelar detalhes internos.

---

## Clean Code e Manutenibilidade

- Preserve as responsabilidades já consolidadas: controllers apenas traduzem HTTP, services concentram regra de negócio, repositories fazem persistência JSON, validators/types/utils ficam puros e reutilizáveis.
- Trate entrada externa como `unknown` na borda, valide/sanitize antes de usar e nunca propague `req.body`, query string ou payload de CMS sem normalização explícita.
- Prefira tipos e contratos existentes antes de criar novos formatos; ao mudar schema, mantenha tipos de `site/backend`/`site/frontend`, sanitização, normalização pública, CMS e testes sincronizados.
- Evite duplicação de rotas, labels canônicos, URLs externas, limites, regras de mídia e textos de negócio; use `routes.ts`, storage canônico, validators e helpers locais como fonte única.
- Escreva funções e componentes coesos, com nomes claros e fluxo legível. Extraia helpers quando reduzir ramificações reais ou repetição significativa, não para criar abstração prematura.
- Mantenha React Components focados em renderização e interação; transformação pesada de dados deve ficar em helpers, hooks ou camada de API já existente.
- Não use `any` como atalho. Quando a entrada for dinâmica, modele com `unknown`, type guards, Zod ou sanitizadores já presentes.
- Use `HttpError` e `asyncHandler` nas bordas HTTP das duas APIs, preservando mensagens seguras e sem vazar detalhes internos.
- Comentários devem explicar decisões, contratos ou exceções não óbvias; não comente código autoexplicativo.
- Testes devem acompanhar risco e superfície alterada: services, security, media, storage, validators e contratos compartilhados exigem cobertura próxima da mudança.

### Ajuda Contextual do CMS

- `cms/frontend/src/lib/cmsHelp.ts` é a fonte única das explicações exibidas pelas interrogações do CMS. Use os componentes `DeveloperHelp`, `DeveloperField`, `DeveloperSectionHeading` e `DeveloperCmsAccordion`; não replique descrições de ajuda diretamente em telas novas quando um template puder representar o contrato.
- Ao criar, remover ou alterar um controle, uma regra de negócio, um destino público, uma validação, um schema ou um fluxo de salvamento do CMS, revise obrigatoriamente a ajuda correspondente em `cmsHelp.ts`. Se a mudança altera o que o controle faz, recebe, valida, grava ou afeta, a explicação deve mudar no mesmo commit.
- Ajuda de campos e seções comuns deve informar, em linguagem que uma pessoa não técnica entenda, o que controla, de onde vem, onde aparece ou é usada e o efeito após salvar. Cite a rota ou área pública real sempre que ela existir; não use fórmulas vagas como “recurso correspondente”, “conteúdo administrado” ou “comportamento público” sem explicar qual elemento o visitante verá afetado. Controles com impacto técnico, operacional, de segurança, integração ou publicação precisam também explicar o contrato, formato aceito, cálculo, limite ou validação aplicável.
- Toda ficha estruturada deve começar por `Resumo`: uma explicação curta, pessoal e sem jargão que diga o que a pessoa preenche ou escolhe, o que isso muda e onde o visitante perceberá a mudança. Os detalhes técnicos vêm depois desse resumo, nunca no lugar dele.
- Prefira templates específicos por rota, tipo e chave semântica para controles críticos. O fallback automático deve usar o perfil real da rota e da categoria do campo (texto, botão, mídia, SEO, contato, status, cor, prazo ou filtro); é proibido gerar frases de preenchimento como “altere um campo”, “bloco correspondente” ou “recurso administrado”.

---

## Persistência e Conteúdo

- A persistência atual é JSON local, não banco de dados.
- `site/backend/storage/content.json` e `site/backend/storage/site-texts.json` são conteúdo público canônico versionado.
- `site/backend/storage/private/**` guarda usuários, sessões, analytics, consentimentos, auditoria e rate limit locais; não deve ser versionado.
- `site/backend/storage/uploads/**` guarda uploads de runtime; não deve ser versionado.
- O volume canônico continua em `site/backend/storage`, sem cópia para `cms/backend`. Coleções do CMS devem ser declaradas em `cms/backend/src/config/storagePaths.ts`, acessadas por repository e cobertas pelo `.gitignore` quando forem privadas/runtime; o backend público declara somente seu rate limit operacional.
- Escrita JSON deve passar por `readJsonFile`/`writeJsonFile` ou repositories existentes para preservar criação de diretório e escrita atômica.
- Mudanças de schema de conteúdo devem atualizar tipos de `site/backend`/`site/frontend`/CMS, sanitização, normalização pública, telas do CMS, defaults/migração de leitura e testes quando aplicável.
- Backups completos do storage local devem usar `node scripts/backup-storage.js`; restores devem usar `node scripts/restore-storage.js --backup ... --confirm-restore` e seguir `docs/backup-restore-json.md`.

## Mídia e Uploads

- O CMS só deve aceitar mídia interna validada. É proibido permitir `http://`, `https://`, `data:`, `javascript:`, path traversal ou referência inexistente em campos de mídia.
- Validações de mídia ficam em `mediaValidationService`.
- Uploads de imagem aceitam PNG, JPG/JPEG, WebP e AVIF, validam assinatura real e geram WebP otimizado, thumbnail, medium e large via Sharp.
- Uploads de vídeo aceitam MP4, WebM e Ogg, validam assinatura real e não são convertidos para WebP.
- A mídia do Landing Builder segue o mesmo princípio no volume próprio: imagem PNG/JPG/WebP/AVIF é otimizada para WebP; vídeo MP4/WebM/Ogg preserva o formato e não pode ser excluído enquanto estiver referenciado.
- Ao alterar contratos de mídia, atualize `cms/backend`, CMS frontend, frontend público, testes de mídia e documentação.

---

## Segurança

- Sessão administrativa é propriedade do `cms/backend` e usa cookie `sid` HttpOnly, `SameSite=Strict` e `Secure` em produção.
- Rotas administrativas exigem `requireAdmin`; mutações administrativas também exigem `requireAllowedOrigin`, `requireJson` quando houver JSON e `requireCsrf`.
- Rotas públicas mutáveis, como formulários, consentimento, analytics e popup, devem validar origem e tipo de conteúdo.
- Setup inicial de administrador depende de `ADMIN_SETUP_CODE` somente quando ainda não existem usuários.
- Em produção, `JWT_SECRET` ou `SESSION_SECRET`, `ADMIN_SETUP_CODE`, `FRONTEND_ORIGIN` e `CORS_ORIGINS` devem passar pelo hardening de `cms/backend/src/config/env.ts`: secrets fortes, setup code forte e origens HTTPS não locais. O backend público aplica hardening de origem, mas não recebe segredos de sessão/setup.
- Gestão de identidades e ACL após o setup exige usuário supremo (`SUPREME_ADMIN_EMAILS`, e-mail dev configurado ou regra atual de usuário supremo). Permissão de `users` não autoriza criar administradores privilegiados, conceder/remover permissões, editar perfis de acesso ou atribuir exceções; essas ações nunca podem elevar o próprio ator nem contornar o usuário supremo.
- Senhas novas usam bcrypt; hashes legados PBKDF2 continuam verificáveis.
- Preserve rate limits do CMS para login, leads, popup e analytics, isolados dos limites operacionais de ESL/CEP/CNPJ no backend público.
- Alteração ou cancelamento de coleta ESL exige capability assinada, vinculada ao `id` remoto e emitida na criação. A validação de NF exige CNPJ de remetente ou destinatário e devolve apenas resultado/validação opacos; nunca dados operacionais, chave, valor, peso ou volume ao navegador.
- Nunca exponha segredos, hash de senha, sessão, IP bruto ou arquivos privados em logs, respostas públicas ou páginas estáticas.

### Checklist obrigatório de segurança

Toda alteração deve ser avaliada contra estes 20 controles. Itens de banco de dados são marcados como não aplicáveis apenas enquanto este monorepo continuar usando JSON local; se um banco for introduzido, tornam-se bloqueadores antes da publicação.

1. **API keys:** chaves, tokens, segredos e URLs internas ficam somente no servidor e em variáveis privadas; nunca em `NEXT_PUBLIC_*`, bundles, logs ou exemplos com valor real.
2. **Segredos no Git:** `.env` reais, chaves, certificados, dumps, storage privado e uploads ficam ignorados. Se um segredo alcançar o histórico, revogar/rotacionar no provedor antes de qualquer reescrita de histórico autorizada.
3. **Chave pública de banco:** uma chave pública de provedor de banco só pode ter escopo de cliente mínimo; chaves administrativas/service-role jamais chegam ao navegador.
4. **RLS/isolamento de dados:** todo banco exposto deve usar RLS/policies testadas. No JSON atual, o equivalente obrigatório é ACL no servidor, storage privado sem rota estática e writer único.
5. **Criptografia de dados:** transporte usa TLS em produção; dados privados, uploads e backups exigem volume/backup criptografado e permissões mínimas da conta de serviço. Não alegar criptografia em repouso pelo app sem evidência.
6. **Auth server-side:** autenticação, sessão, papel, ACL e propriedade são verificados a cada endpoint no servidor; o frontend só melhora UX.
7. **Acesso mínimo:** rotas sem mapeamento negam acesso. Só o usuário supremo pode administrar perfis, grants, roles, contas privilegiadas e permissões destrutivas.
8. **Mass assignment:** aceitar somente DTOs e allowlists; nunca persistir ou mesclar `req.body` cru em entidades, permissões, status, IDs, ownership ou campos internos.
9. **Cookies:** cookies de autenticação exigem `HttpOnly`, `Secure` em produção, `SameSite` adequado, escopo mínimo, rotação/invalidação de sessão e `Cache-Control: private, no-store` nas respostas autenticadas.
10. **Senhas:** novas senhas usam bcrypt ou algoritmo equivalente com custo revisado; hashes legados só para compatibilidade e comparação em tempo constante quando aplicável.
11. **Rate limit:** limitar por IP e, quando relevante, por identidade/ação antes de trabalho caro, parser multipart, integração externa ou escrita; configurar `TRUST_PROXY` corretamente.
12. **Proteção contra bots:** ações públicas sensíveis precisam de rate limit, detecção/limite de abuso e proteção de borda (WAF/challenge/Turnstile quando proporcional ao risco).
13. **Queries parametrizadas:** consultas a bancos usam parâmetros/bindings, nunca interpolação. Em JSON, validar IDs/caminhos e impedir path traversal.
14. **Validação de entrada:** toda borda recebe `unknown`, exige tipo de conteúdo correto, schema/normalização, limites de tamanho e erro `4xx` seguro para payload inválido.
15. **Exposição de conteúdo:** separar DTO público, administrativo e interno; não publicar PII, status interno, integrações, chaves, IDs de serviço ou conteúdo não publicado.
16. **Uploads:** autenticar/autorizar antes do parser quando possível, limitar tamanho/quantidade/tipo, validar assinatura real, bloquear traversal e servir com `nosniff` e cache apropriado.
17. **Respostas mínimas:** cada API retorna apenas campos necessários; respostas autenticadas/PII usam DTO explícito e não ficam em caches compartilhados.
18. **Headers:** manter CSP, `nosniff`, políticas de frame/referrer/permissões, COOP, remoção de `X-Powered-By` e headers de download/upload em todas as superfícies web, inclusive apps isolados.
19. **HTTPS:** a borda pública força HTTPS com certificado válido; HSTS é adicional. Processos internos podem ficar em loopback HTTP somente atrás de proxy/tunnel confiável.
20. **Dependências:** lockfiles são obrigatórios; executar auditoria de dependências antes da publicação, revisar pacotes/registries/scripts de instalação e nunca aplicar upgrade major ou `audit fix` automático sem análise.

### Exposição de Dados e Dependências

- Nunca coloque senhas, tokens, API keys privadas, segredos JWT, credenciais SMTP/OAuth, URLs internas sensíveis ou dados administrativos em variáveis `NEXT_PUBLIC_*`; toda variável com esse prefixo é pública por definição.
- Não use a propriedade `env` de `site/frontend/next.config.js` para informações privadas. Novas variáveis de ambiente devem ser documentadas em `.env.example` e no `states.md`, marcadas explicitamente como públicas ou privadas.
- Client Components não podem importar código exclusivo de servidor, repositórios, services, módulos de segurança, arquivos de configuração de ambiente, SDKs administrativos ou módulos Node.js.
- Autorização no frontend é apenas UX: toda Server Action, Route Handler e endpoint deve validar autenticação e autorização no servidor, sem confiar em IDs, roles ou permissões vindos do cliente.
- Respostas HTTP, props de Client Components e dados de hidratação devem expor somente os campos necessários; nunca retornar objetos completos de usuário, sessão ou entidades privadas quando um DTO mínimo for suficiente.
- Nunca registrar tokens, cookies, senhas, hashes, segredos, IPs brutos ou dados pessoais desnecessários em logs, erros, analytics ou auditoria.
- Nenhum arquivo sensível pode ficar em `site/frontend/public/`; certificados, dumps, logs, credenciais, backups e storage privado devem permanecer ignorados pelo Git.
- Em alterações que afetem segurança, dados, ambiente ou dependências, verificar bundle/HTML/respostas HTTP, executar typecheck, testes e builds aplicáveis e rodar o hardening ponta a ponta quando o escopo incluir backend ou headers.
- Vulnerabilidades de dependências devem ser avaliadas e corrigidas por atualizações compatíveis; não introduza upgrades major sem análise explícita de compatibilidade.

## LGPD, Analytics e Leads

- O banner de consentimento grava decisão no `localStorage`, permite reabrir preferências e remove cookies opcionais conhecidos quando analytics/marketing são negados.
- Scripts externos de analytics só podem carregar depois de consentimento compatível.
- Consentimentos devem registrar status, categorias, versão, device, IP mascarado e dados permitidos pela escolha do usuário.
- Eventos de tracking e analytics devem permanecer agregados/operacionais, sem transformar o site em coletor de dados pessoais desnecessários.

---

## Governança de Rotas, SEO e Conteúdo Público

- Ao criar, remover ou renomear rota pública, atualize `site/frontend/src/lib/routes.ts`, `next.config.js` quando houver redirect/rewrite, `sitemap.ts`, `robots.ts` quando aplicável, navegação, footer e CMS se a rota for editável. Rotas CMS visíveis permanecem sob `/admin` e devem manter `noindex`.
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
  - `cd site/backend && cmd /c npm run typecheck`
  - `cd site/backend && cmd /c npm run build`
  - `cd site/backend && cmd /c npm test` quando alterar services, security, media, storage ou validações.
- Backend CMS:
  - `cd cms/backend && cmd /c npm ci`
  - `cd cms/backend && cmd /c npm run typecheck`
  - `cd cms/backend && cmd /c npm run build`
  - `cd cms/backend && cmd /c npm test` quando alterar services, security, media, storage ou validações.
- Frontend:
  - `cd site/frontend && cmd /c npm run typecheck`
  - `cd site/frontend && cmd /c npm run build`
- CMS frontend:
  - `cd cms/frontend && cmd /c npm ci`
  - `cd cms/frontend && cmd /c npm run typecheck`
  - `cd cms/frontend && cmd /c npm run build`
- O `next.config.js` ignora erros de TypeScript durante build; por isso o typecheck separado do frontend é obrigatório.
- Para hardening de segurança fim a fim, use somente os artefatos isolados
  `site/backend/dist.test`, `cms/backend/dist.test`, `site/frontend/dist-prod.test` e
  `cms/frontend/dist-prod.test`, com as quatro variáveis
  `SECURITY_TEST_*_ARTIFACT_DIR` correspondentes; o script recusa `.next` e
  artefatos ativos antes de iniciar processos. O `iniciar-prod.bat` prepara
  esse contrato automaticamente. Com `next dev` manual em execução, use
  `NEXT_BUILD_DIST_DIR=.next.test` ao gerar os artefatos para não tocar no cache
  ativo. Nunca aponte o hardening para produção.
- Para validação visual DEV, use somente processos iniciados manualmente pelo usuário; a IA faz verificações não destrutivas e não inicia, reinicia ou encerra serviços desse fluxo.

## Sincronização de Estado

- Antes de implementar, leia `states.md`.
- Após implementar, atualize `states.md` para refletir o estado real.
- A seção `Tarefas Pendentes` deve continuar existindo quando houver trabalho aberto e conter apenas itens acionáveis, verificados no código atual, com rota/arquivo/contrato afetado quando possível.
- Remova tarefas concluídas da seção `Tarefas Pendentes` e não substitua pendências reais por auditorias genéricas sem vínculo com este monorepo.
- Registre novas regras consolidadas em `Arquitetura e Padrões`, `Fluxo de Dados e Integrações` ou `Regras de Negócio Consolidadas`.
- Nunca finalize uma mudança sem deixar `states.md` coerente com o código entregue.

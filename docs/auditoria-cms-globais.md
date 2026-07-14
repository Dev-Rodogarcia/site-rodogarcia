# Auditoria técnica do CMS — módulos globais e operacionais

Data da auditoria: 14/07/2026

Baseline: snapshot do código anterior às correções iniciadas a partir desta auditoria.

## Escopo e critério

Esta auditoria cobre os módulos globais e operacionais do CMS: Footer Links e as páginas Termos, Privacidade e Central de Ajuda; SEO; biblioteca de mídia e media slots; unidades; LGPD e monitoramento de consentimentos; popup de saída; Analytics; leads; rastreamento/auditoria; usuários; rotas legadas e aliases.

O rastreamento foi feito ponta a ponta, do controle visível no CMS até payload, controller/rota, service, persistência JSON, DTO público e consumidor final. Para a contagem abaixo, cada caminho de campo do contrato foi contado uma vez; campos repetíveis como `items[].title` contam como um campo de schema, independentemente da quantidade atual de itens. Botões de ação como Salvar, Próximo e Excluir não entram na contagem. Campos internos `id`, `order`, timestamps e metadados de auditoria são tratados como operacionais legítimos quando não são apresentados como conteúdo público editável.

Status usados:

- **Funcional**: persiste e produz o efeito prometido.
- **Parcial**: produz efeito, mas há truncamento silencioso, semântica divergente ou caso de borda quebrado.
- **Sem efeito**: persiste ou aparece no CMS, mas não tem consumidor atual correspondente.
- **Hardcoded**: conteúdo público existente fora do contrato do CMS; contado separadamente.

## Resultado executivo

| Módulo | Campos | Funcionais | Parciais | Sem efeito |
|---|---:|---:|---:|---:|
| Footer + Termos + Ajuda + Privacidade | 81 | 50 | 31 | 0 |
| SEO | 10 | 5 | 4 | 1 |
| Mídia e slots | 28 | 1 | 9 | 18 |
| Unidades | 12 | 0 | 8 | 4 |
| LGPD/Cookies | 18 | 13 | 1 | 4 |
| Popup de saída | 23 | 12 | 11 | 0 |
| Analytics — configuração | 18 | 5 | 1 | 12 |
| Usuários — criação e edição | 9 | 5 | 4 | 0 |
| Filtros operacionais | 7 | 6 | 1 | 0 |
| **Total** | **206** | **97** | **70** | **39** |

Além desses campos, foram encontrados **4 blocos de conteúdo público hardcoded** nas páginas Termos e Privacidade.

Não foi encontrado, neste escopo, vazamento de segredo, senha, hash, cookie ou storage privado para o cliente. As rotas administrativas passam por `requireAdmin`, e as mutações verificadas usam origem, tipo de conteúdo e CSRF (`backend/src/routes/adminRoutes.ts:55-66`, `backend/src/routes/adminRoutes.ts:148-242`). Os problemas principais são de verdade funcional do CMS e consistência dos contratos, não de bypass administrativo.

## Achados prioritários

### P1 — Slots de mídia expostos sem consumidor e fallback impossível de restaurar

O editor declara 25 slots em `frontend/src/app/developer/imagens/page.tsx:59-85` e diz que eles são “usados pelo site” (`frontend/src/app/developer/imagens/page.tsx:303-304`). O rastreamento encontrou:

- 7 slots realmente consumidos hoje: `home.cert.iso`, `home.cert.sassmaq`, `home.cert.ecovadis`, `home.cert.pf`, `home.cert.pcsp`, `home.cert.exercito` e `home.cert.ibama` (`frontend/src/app/page.tsx:115-156`).
- 2 slots usados somente por fallback de migração quando o conteúdo moderno não existe: `about.hero` e `careers.culture` (`backend/src/services/pageContent.ts:721-736`, `backend/src/services/pageContent.ts:850-858`).
- 16 slots sem consumidor atual: `home.hero.default`, os três `home.showcase.*`, os seis `home.services.*`, `services.hero`, `business.hero`, `careers.hero`, `contact.og`, `popup.desktop` e `popup.mobile`.

Mesmo nos sete slots ativos, “Usar fallback do site” não funciona depois que um valor já foi salvo. A UI envia string vazia (`frontend/src/app/developer/imagens/page.tsx:518-525`), mas o backend elimina pares vazios antes do merge e mantém o valor antigo (`backend/src/services/mediaService.ts:489-502`).

O backend também aceita qualquer chave e valida todos os slots como mídia de tipo `all`, sem allowlist nem contrato de tipo por slot (`backend/src/services/mediaService.ts:493-499`). A UI filtra imagem/vídeo, mas a API não preserva essa garantia.

Correção indicada: manter um registry tipado e compartilhado de slots realmente suportados; excluir ou conectar os 18 slots sem efeito atual; tratar valor vazio como remoção da chave; validar chave e tipo no backend.

### P1 — `/developer/unidades` não alimenta o mapa como a própria tela afirma

A página declara que os registros alimentam diretamente o mapa, o seletor ativo e os dados exibidos (`frontend/src/app/developer/unidades/page.tsx:191-198`, `frontend/src/app/developer/unidades/page.tsx:390-394`). O site, porém, renderiza `homePage.regionalPresence.units`, um segundo conjunto de dados (`frontend/src/app/page.tsx:242-248`).

No editor da Home, selecionar uma unidade operacional apenas copia um snapshot de oito campos (`frontend/src/app/developer/home/page.tsx:1017-1032`). Alterações futuras na unidade original não são propagadas. O próprio editor da Home descreve corretamente esse vínculo como “ponto de partida” (`frontend/src/app/developer/home/page.tsx:1755-1768`). `linkedUnitId` não é resolvido no backend nem no componente público.

Consequências:

- `name`, `type`, `state`, `address`, `phone`, `email`, `contactUrl` e `description` têm efeito apenas após nova seleção/cópia.
- `city`, `logisticsInfo`, `isDefault` e `active` não alteram o mapa atual.
- `isDefault` permite múltiplos valores, enquanto o mapa escolhe simplesmente a primeira unidade da Home ordenada (`frontend/src/components/home/BrazilMap.tsx:29-53`).
- A rota existe em `admin.units`, mas não participa de `adminNavigationGroups`, portanto fica órfã e recebe contexto visual de Dashboard (`frontend/src/lib/routes.ts:53-74`, `frontend/src/lib/routes.ts:194-232`, `frontend/src/lib/routes.ts:325-347`).

Correção indicada: escolher uma única fonte. Se `content.units` for canônica, resolver `linkedUnitId` dinamicamente no backend/público, incluir a rota na navegação e impor um único default. Se a Home continuar autônoma, remover ou renomear a página como catálogo/modelo e corrigir toda a copy que promete sincronização.

### P1 — Quatro controles LGPD editáveis não controlam o comportamento público

Os seguintes campos persistem, mas não cumprem o efeito apresentado:

- `behavior.blockAnalyticsUntilConsent`: aparece no CMS (`frontend/src/app/developer/lgpd-cookies/page.tsx:193-196`) e é salvo, mas nunca é lido. Analytics permanece sempre bloqueado até a categoria `analytics` ser aceita (`frontend/src/components/analytics/AnalyticsProvider.tsx:100-105`, `frontend/src/components/analytics/AnalyticsProvider.tsx:257-295`).
- `desktop.position`: possui três opções (`frontend/src/app/developer/lgpd-cookies/page.tsx:200-203`), mas o banner desktop sempre usa o container central fixo (`frontend/src/components/analytics/ConsentBanner.tsx:264-273`). O posicionamento central foi consolidado como decisão visual atual; manter um seletor contrário a essa regra é que constitui o campo falso.
- `categories[].required` e `categories[].enabledByDefault`: são toggles visíveis (`frontend/src/app/developer/lgpd-cookies/page.tsx:220-223`), mas o service recalcula ambos exclusivamente a partir de `key === "necessary"` (`backend/src/services/consentService.ts:60-69`). O valor digitado é descartado no save/load.

`mobile.position` é funcional: `center-modal` altera as classes mobile (`frontend/src/components/analytics/ConsentBanner.tsx:159-162`). `requireExplicitChoice`, `reopenOnVersionChange`, versão, textos e labels também têm consumidores reais. IDs, IP mascarado, device e logs na tela de monitoramento são dados operacionais legítimos, não campos prometendo mudança no site.

Há ainda uma divergência reproduzível no monitoramento: o cliente registra escolhas customizadas como `partial` (`frontend/src/components/analytics/AnalyticsProvider.tsx:492-504`) e o backend aceita/consulta `partial` (`backend/src/services/consentService.ts:159-178`), mas o tipo do CMS omite esse valor e o filtro “Parcial” envia `custom` (`frontend/src/app/developer/monitoramento-cookies/page.tsx:27-31`, `frontend/src/app/developer/monitoramento-cookies/page.tsx:129-136`). O teste existente confirma que o contrato real é `partial` (`backend/tests/consentService.test.ts:7-39`).

Correção indicada: remover os controles deliberadamente fixos ou implementar sua semântica; preservar `required`/`enabledByDefault` quando permitidos; padronizar o status em `partial` em frontend, backend e filtros.

### P1 — Analytics contém uma segunda configuração de consentimento e 12 campos sem efeito

O schema administrativo aceita `siteUrl`, um bloco próprio de consentimento, heartbeat, Sentry e Search Console (`backend/src/services/analyticsService.ts:32-67`). O DTO público expõe somente `tracking`, GA4 e Clarity (`backend/src/services/analyticsService.ts:93-107`). O consumidor público lê `tracking.enabled`, `scrollMilestones`, GA4 e Clarity; não existe heartbeat, Sentry, Search Console ou uso de `siteUrl` (`frontend/src/components/analytics/AnalyticsProvider.tsx:26-35`, `frontend/src/components/analytics/AnalyticsProvider.tsx:257-336`).

Campos sem efeito:

- `siteUrl`.
- `consent.version`, `consent.bannerEnabled`, `consent.categories.analytics`, `.marketing` e `.performance`.
- `tracking.heartbeatSeconds`.
- `providers.sentry.enabled` e `.dsn`.
- `seo.enableSearchConsole`, `.propertyUrl` e `.sitemapUrl`.

O bloco de consentimento de Analytics compete com o contrato real de `/consent-settings`, mas não é sincronizado nem consumido. Isso cria duas “fontes” no CMS para a mesma decisão e uma delas é inerte.

`tracking.enabled` é apenas parcial: ele interrompe os eventos internos, mas não participa do efeito que injeta GA4/Clarity (`frontend/src/components/analytics/AnalyticsProvider.tsx:257-295`). O rótulo genérico “Tracking ativo” pode ser interpretado como chave mestra de todos os provedores.

As conversões também estão infladas: o backend conta `form_submit` como formulário convertido e lead (`backend/src/services/analyticsService.ts:231-242`), embora esse evento seja disparado antes do resultado (`frontend/src/components/analytics/AnalyticsProvider.tsx:416-425`) e haja um evento específico `form_success` (`frontend/src/components/analytics/AnalyticsProvider.tsx:428-436`).

Correção indicada: eliminar a configuração LGPD duplicada; implementar ou remover heartbeat/Sentry/Search Console; tornar a semântica da chave de tracking explícita; usar `form_success` como conversão.

### P1 — Contato e cotação aparecem duas vezes na base unificada de leads

Cada envio de contato ou cotação é salvo no repository legado e também cria um novo registro, com outro ID, no repository central (`backend/src/services/formsService.ts:20-45`, `backend/src/services/formsService.ts:67-96`, `backend/src/services/leadsService.ts:43-103`). A listagem une os quatro repositories e deduplica apenas por ID (`backend/src/services/leadsService.ts:106-134`), portanto os dois registros sobrevivem e aparecem duplicados.

Popup não sofre a mesma duplicação porque reutiliza o objeto/ID central ao gravar o repository específico (`backend/src/services/popupService.ts:141-166`).

Os cards “Popup” e “Formulários” também são calculados apenas sobre a página atual de resultados, enquanto “Total” vem do backend global (`frontend/src/app/developer/leads/page.tsx:47-76`, `frontend/src/app/developer/leads/page.tsx:85-93`). A troca de página altera os cards sem que o rótulo avise que é uma amostra.

Correção indicada: tornar o repository central a única fonte para novos envios e manter stores legados somente como migração, ou correlacionar/deduplicar por ID compartilhado; devolver agregados por origem no backend.

### P1 — Popup aceita configuração impossível e transforma zero em outro valor

O editor aceita `0` para atraso, cooldown e máximo por sessão (`frontend/src/app/developer/popup-exit/page.tsx:547-587`). O service usa `Number(value) || default`, portanto atraso `0` vira `10`, cooldown `0` vira `24` e máximo `0` vira `1` (`backend/src/services/popupService.ts:77-82`). Para máximo, a regra mínima de 1 é coerente; a divergência é a UI oferecer 0. Para atraso/cooldown, zero é um valor válido prometido e deveria ser preservado.

Os toggles `enableName`, `enableEmail` e `enablePhone` podem ser todos desligados e o save valida apenas título, descrição e botão (`frontend/src/app/developer/popup-exit/page.tsx:242-247`, `frontend/src/app/developer/popup-exit/page.tsx:592-646`). O popup público então renderiza um formulário sem campos, mas a API rejeita qualquer envio sem ao menos um contato (`backend/src/services/popupService.ts:133-139`).

Outras divergências:

- Em falha de `/popup-config`, o componente ativa `DEFAULT_CONFIG`, que vem com `enabled: true`; os listeners são instalados e o comportamento é fail-open (`frontend/src/components/exit-popup/ExitPopup.tsx:210-242`, `frontend/src/components/exit-popup/ExitPopup.tsx:276-341`).
- A descrição desktop do fallback público contém mojibake (`frontend/src/components/exit-popup/ExitPopup.tsx:57-60`).
- Títulos/descrições específicos de desktop/mobile e `sheetTitle` não têm `maxLength` no CMS, mas o backend os corta em 120/280/80 caracteres (`frontend/src/app/developer/popup-exit/page.tsx:432-525`, `backend/src/services/popupService.ts:85-112`).
- `popup_ignored` é aceito e exibido nos totais, mas o cliente nunca emite esse evento (`backend/src/services/popupService.ts:46-51`, `backend/src/services/popupService.ts:229-258`, `frontend/src/components/exit-popup/ExitPopup.tsx:262-271`, `frontend/src/components/exit-popup/ExitPopup.tsx:358-360`).

Correção indicada: usar teste explícito de número finito/nullish; alinhar o mínimo visual de máximo; exigir pelo menos um campo de contato; falhar fechado quando a configuração não carregar; sincronizar limites e defaults entre as três camadas.

### P1 — SEO: `slug` é decorativo e títulos CMS duplicam a marca

`slug` é editável e descrito como caminho público (`frontend/src/app/developer/seo/page.tsx:277-285`), é persistido (`backend/src/services/seoService.ts:66-83`), mas não integra o DTO público nem altera rota, canonical ou metadata (`frontend/src/lib/cmsPublic.ts:5-16`, `frontend/src/lib/cmsPublic.ts:26-70`). É um campo sem efeito.

O layout raiz aplica `title.template = "%s | Rodogarcia Transportes"` (`frontend/src/app/layout.tsx:22-25`). `buildCmsMetadata` devolve o título CMS como string, portanto recebe o template; ao mesmo tempo, nove defaults do SEO já incluem `| Rodogarcia Transportes` (`backend/src/services/seoService.ts:8-20`). O resultado esperado nessas rotas é marca duplicada. A Home evita isso somente no fallback absoluto, mas uma configuração CMS carregada volta a ser string.

Também há truncamento silencioso: OG Title, OG Description e metatags não têm limites visíveis no editor (`frontend/src/app/developer/seo/page.tsx:291-326`), enquanto o backend limita 95/220/1000 (`backend/src/services/seoService.ts:76-83`). `canonical` atualiza `<link rel=canonical>`, mas `openGraph.url` continua usando o path fixo em vez do canonical (`frontend/src/lib/cmsPublic.ts:34-61`).

Correção indicada: remover `slug` ou torná-lo somente leitura derivada de `path`; usar título absoluto no resultado CMS ou guardar título sem sufixo de marca; sincronizar limites; decidir se OG URL deve acompanhar canonical.

### P2 — Footer restaura defaults ao remover o último item

O CMS oferece adicionar/remover/ordenar colunas, links inferiores e sociais, e remover horários/blocos (`frontend/src/app/developer/footer-links/page.tsx:173-203`, `frontend/src/app/developer/footer-links/page.tsx:576-662`, `frontend/src/app/developer/footer-links/page.tsx:721-749`). O backend, porém, troca arrays vazios pelos defaults:

- colunas, sociais, links inferiores e horários: `backend/src/services/footerLinksContent.ts:434-474`;
- blocos de Termos: `backend/src/services/footerLinksContent.ts:482-514`;
- blocos de Privacidade: `backend/src/services/footerLinksContent.ts:578-604`.

Assim, remover o último item parece salvar, mas os itens padrão reaparecem no próximo load. Isso invalida especificamente o estado vazio; edição, inclusão e ordenação com pelo menos um item funcionam.

Há ainda três inconsistências transversais:

- O editor altera label e URL, mas não `external`; o sanitizer preserva o boolean anterior (`backend/src/services/footerLinksContent.ts:62-72`, `frontend/src/app/developer/footer-links/page.tsx:154-169`). Mudar um link externo para interno pode continuar abrindo como externo.
- Ícones sociais e das ações rápidas são texto livre, enquanto o público possui allowlists pequenas e usa fallback (`frontend/src/components/layout/FooterSocialLink.tsx:10-29`, `frontend/src/app/central-ajuda/page.tsx:32-36`, `frontend/src/app/central-ajuda/page.tsx:96-105`). O save “funciona”, mas valores fora da lista não produzem o ícone escolhido.
- O componente genérico aceita 90/220/280 caracteres, mas Termos e cabeçalhos da Ajuda cortam alguns desses campos em 80/160/260/180 no backend (`frontend/src/app/developer/footer-links/page.tsx:890-938`, `backend/src/services/footerLinksContent.ts:492-509`, `backend/src/services/footerLinksContent.ts:543-564`).

O cardinality fixo de três ações rápidas e das perguntas da Ajuda é explícito no código/UI (“Pergunta fixa”) e no sanitizer (`frontend/src/app/developer/footer-links/page.tsx:813-849`, `frontend/src/app/developer/footer-links/page.tsx:974-1020`, `backend/src/services/footerLinksContent.ts:532-567`). Isso é uma regra atual legítima, não um campo de ordenação quebrado; apenas não atende uma eventual expectativa de CRUD livre.

### P2 — Rastreamento não exibe o nome das ações de auditoria

O backend persiste auditoria em `action` (`backend/src/services/auditService.ts:28-40`). O tipo frontend não possui `action` e a UI tenta renderizar `event.event || event.type` (`frontend/src/app/developer/rastreamento/page.tsx:20-29`, `frontend/src/app/developer/rastreamento/page.tsx:235-247`). Os cards aparecem com título vazio.

O resumo “Eventos” também não é um total histórico: `getTrackingSummary` força `limit: 1000` (`backend/src/services/trackingService.ts:122-162`), embora o storage aceite mais eventos. O rótulo não informa o limite.

Correção indicada: criar DTO de auditoria próprio e renderizar `action`, `target` e ator mínimo; calcular total antes do `slice` ou rotular como “últimos 1.000”.

### P2 — Substituição e contagem de uso de mídia ignoram SEO e popup

O contador de referências e a substituição em lote percorrem apenas `content`, `site-texts` e `media-slots` (`backend/src/services/mediaService.ts:195-200`, `backend/src/services/mediaService.ts:464-478`). Referências guardadas em popup e `seo-settings` não são contadas nem trocadas. Uma imagem usada apenas como OG image ou no popup pode aparecer sem selo “Em uso” e continuar apontando para a URL antiga.

A copy da substituição cita explicitamente `content.json` e `site-texts.json` (`frontend/src/app/developer/imagens/page.tsx:442-447`), portanto não mente sobre esse comando específico; a divergência está no conceito global de biblioteca/uso de mídia. O upload em si está corretamente protegido por validação de MIME, assinatura, limites e variantes. A descrição “gera WebP e thumbnail” deve, contudo, ser condicionada a imagens, pois a mesma entrada aceita vídeo e vídeos não são convertidos (`frontend/src/app/developer/imagens/page.tsx:48-58`, `frontend/src/app/developer/imagens/page.tsx:335-351`).

### P2 — Usuários: permissão descrita difere da regra e update aceita coerção perigosa

Criação, edição e exclusão são realmente limitadas ao owner/supremo no backend (`backend/src/services/authService.ts:33-45`, `backend/src/services/authService.ts:103-174`, `backend/src/services/authService.ts:216-229`). O CMS, porém, descreve o perfil “Administrador” como alguém que pode criar outros usuários (`frontend/src/app/developer/usuarios/page.tsx:351-368`), o que não é verdade para admins comuns. A mensagem posterior da mesma página informa corretamente que somente o supremo gerencia acessos (`frontend/src/app/developer/usuarios/page.tsx:645-660`).

Os campos de edição de nome/e-mail não têm os limites presentes na criação e podem ser truncados/normalizados no backend sem contador (`frontend/src/app/developer/usuarios/page.tsx:326-348`, `frontend/src/app/developer/usuarios/page.tsx:534-570`, `backend/src/services/authService.ts:176-188`).

No contrato HTTP, `updateUser` transforma `role` ausente em `admin` e usa `Boolean(params.active)`, fazendo por exemplo a string `"false"` virar `true` (`backend/src/services/authService.ts:176-188`). A UI atual envia os quatro campos tipados, então o fluxo visual normal funciona; ainda assim a borda backend deveria validar `unknown` explicitamente para evitar promoção/coerção em chamadas parciais.

Os testes de auth existentes cobrem rate limit de login, não CRUD, owner, invalidação de sessão nem essas coerções (`backend/tests/authService.test.ts:17-64`).

## Matriz de campos

### Footer global

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `description`, `proposalButton.label/url`, `supportButton.label/url` | 5 | Funcional | `SiteFooter.tsx:46-55` |
| `columns[].title`, `columns[].links[].label/url` | 3 | Parcial | Renderizam e ordenam; array vazio restaura defaults e URL pode herdar `external` obsoleto |
| `serviceHoursTitle` | 1 | Funcional | `SiteFooter.tsx:69-75` |
| `serviceHours[]` | 1 | Parcial | Ordem do array aparece; não há mover e zero itens não persiste |
| `socialTitle` | 1 | Funcional | `SiteFooter.tsx:77-91` |
| `socialLinks[].label/url/icon` | 3 | Parcial | Vazio restaura defaults; URL/ícone têm semântica divergente |
| `bottomLinks[].label/url` | 2 | Parcial | Vazio restaura defaults; `external` pode ficar obsoleto |
| `copyrightText`, `locationText`, `creditText`, `creditUrl` | 4 | Funcional | `SiteFooter.tsx:94-115` |

### Termos de Uso

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `hero.eyebrow`, `hero.description` | 2 | Funcional | `termos-de-uso/page.tsx:35-54` |
| `hero.titleHighlight`, `hero.titleRest` | 2 | Parcial | Renderizam; editor permite 90 e backend corta em 80 |
| `summary.eyebrow/title/description/body`, `summary.button.label` | 5 | Funcional | `termos-de-uso/page.tsx:60-91` |
| `summary.button.url` | 1 | Parcial | Consumida; `external` pode ficar obsoleto |
| `reading.eyebrow` | 1 | Funcional | `termos-de-uso/page.tsx:101-108` |
| `reading.title`, `reading.description` | 2 | Parcial | Limites frontend/backend divergentes |
| `reading.blocks[].title/description` | 2 | Parcial | CRUD/ordem funcionam com itens; zero restaura defaults |
| `finalCta.title/description`, `finalCta.buttons[].label` | 3 | Funcional | `termos-de-uso/page.tsx:125-150` |
| `finalCta.buttons[].url` | 1 | Parcial | URL funciona; flag externa pode ficar obsoleta |

### Central de Ajuda

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `hero.eyebrow/titleHighlight/titleRest/description` | 4 | Funcional | `central-ajuda/page.tsx:51-70` |
| `hero.buttons[].label` | 1 | Funcional | `central-ajuda/page.tsx:72-80` |
| `hero.buttons[].url` | 1 | Parcial | Flag externa pode ficar obsoleta |
| `quickAccess.eyebrow` | 1 | Funcional | `central-ajuda/page.tsx:87-94` |
| `quickAccess.title/description` | 2 | Parcial | Editor 220/280; backend 180/260 |
| `quickAccess.actions[].title/description/button.label` | 3 | Funcional | `central-ajuda/page.tsx:96-118` |
| `quickAccess.actions[].icon/button.url` | 2 | Parcial | Ícone tem allowlist; URL pode manter `external` antigo |
| `contactCard.phone/hours` | 2 | Funcional | `central-ajuda/page.tsx:140-150` |
| `contactCard.channelDescriptions[]` | 1 | Parcial | Até três, sem CRUD/reordenação e vazio integral volta ao default |
| `faq.eyebrow`, `faq.items[].question/answer` | 3 | Funcional | `central-ajuda/page.tsx:133-180`; cardinalidade fixa intencional |
| `faq.title/description` | 2 | Parcial | Editor 220/280; backend 180/260 |
| `finalSupport.eyebrow/title/description/button.label` | 4 | Funcional | `central-ajuda/page.tsx:188-208` |
| `finalSupport.button.url` | 1 | Parcial | Flag externa pode ficar obsoleta |

### Privacidade

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `hero.eyebrow/titleHighlight/titleRest/description` | 4 | Funcional | `privacidade/page.tsx:35-54` |
| `hero.button.label/url` | 2 | Parcial | Renderiza no aside, não no hero como o editor nomeia; URL externa pode ficar obsoleta |
| `dataSection.eyebrow/title/description` | 3 | Funcional | `privacidade/page.tsx:91-102` |
| `dataSection.blocks[].title/description` | 2 | Parcial | CRUD/ordem com itens; zero restaura defaults |
| `finalCta.title/description`, `finalCta.buttons[].label` | 3 | Funcional | `privacidade/page.tsx:119-144` |
| `finalCta.buttons[].url` | 1 | Parcial | Flag externa pode ficar obsoleta |

### SEO

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `description`, `canonical`, `index`, `follow`, `ogImage` | 5 | Funcional | Entram em `buildCmsMetadata`; mídia interna é validada |
| `title` | 1 | Parcial | Aplicado, mas defaults com marca recebem novamente o template raiz |
| `ogTitle`, `ogDescription`, `metaTags` | 3 | Parcial | Consumidos, com truncamento silencioso no save |
| `slug` | 1 | Sem efeito | Persiste, mas não entra no DTO/metadata/roteamento |

`path` e `label` são identificadores estáveis da lista de 12 rotas, não campos públicos livres; a quantidade coincide com as rotas do sitemap e todas as 12 páginas chamam `buildCmsMetadata`. Essa estabilidade é legítima.

### Mídia

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| Arquivo de upload | 1 | Funcional | Validação client/server, assinatura real e otimização por tipo |
| URL atual e nova URL da substituição | 2 | Parcial | Trocam somente content, site-texts e slots; não SEO/popup |
| Sete slots `home.cert.*` | 7 | Parcial | Consumidos; opção vazia não remove valor salvo |
| `about.hero`, `careers.culture` | 2 | Sem efeito atual | Apenas fallback de migração de schema antigo |
| Demais 16 slots enumerados no achado P1 | 16 | Sem efeito | Nenhum consumidor no site atual |

### Unidades

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `name`, `type`, `state`, `address`, `phone`, `email`, `contactUrl`, `description` | 8 | Parcial | Servem apenas de snapshot quando o editor da Home reseleciona o vínculo |
| `city`, `logisticsInfo`, `isDefault`, `active` | 4 | Sem efeito no mapa atual | Persistem no catálogo/root DTO, sem consumidor visual correspondente |

`id` e `order` são metadados operacionais. A ordenação afeta a lista administrativa, mas não sincroniza a ordem do mapa da Home.

### LGPD/Cookies

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `title`, `version`, `description`, quatro labels de ação | 7 | Funcional | Consumidos pelo banner |
| `enabled`, `behavior.requireExplicitChoice`, `behavior.reopenOnVersionChange` | 3 | Funcional | Ativação, Escape e reabertura por versão funcionam |
| `mobile.position` | 1 | Funcional | Alterna bottom-sheet/center-modal |
| `categories[].label/description` | 2 | Funcional | Renderizam nas preferências |
| `categories[].key` | 1 | Parcial | Funciona como chave, mas renomear `analytics`/`marketing` desconecta integrações que esperam nomes exatos |
| `behavior.blockAnalyticsUntilConsent`, `desktop.position`, `categories[].required/enabledByDefault` | 4 | Sem efeito | Não lidos ou sobrescritos no backend |

### Popup de saída

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `enabled`, textos globais, `badgeText`, imagem global | 8 | Funcional | Consumidos no componente em condição normal de API |
| `enableName`, `enableEmail`, `enablePhone` | 3 | Parcial | Individuais funcionam; combinação todos-off cria formulário impossível |
| `delaySeconds`, `cooldownHours`, `maxShowsPerSession` | 3 | Parcial | Zero diverge entre UI e backend |
| `desktop.title/description` | 2 | Parcial | Consumidos; sem limites frontend e truncados no backend |
| `desktop.image` | 1 | Funcional | Consumida como override desktop |
| `mobile.title/description/sheetTitle` | 3 | Parcial | Consumidos; sem limites frontend e truncados no backend |
| `mobile.image`, `mobileScrollTrigger`, `mobileBackButtonTrigger` | 3 | Funcional | Consumidos nos fluxos mobile |

### Analytics

| Campos | Qtde. | Status | Consumidor/observação |
|---|---:|---|---|
| `tracking.scrollMilestones`, GA4 `enabled/id`, Clarity `enabled/id` | 5 | Funcional | DTO público e provider conectados |
| `tracking.enabled` | 1 | Parcial | Desliga eventos internos, não a injeção de provedores |
| `siteUrl`, seis campos do consentimento duplicado, heartbeat, Sentry (2), Search Console (2), sitemap | 12 | Sem efeito | Persistidos e omitidos/ignorados pelo runtime público |

### Usuários e filtros operacionais

| Campos | Qtde. | Status | Observação |
|---|---:|---|---|
| Criar: `name`, `email`, `password`, `confirmPassword` | 4 | Funcional | Frontend e backend validam requisitos essenciais |
| Criar/editar: `role` (duas ocorrências de contrato) | 2 | Parcial | Papel funciona, mas copy promete gestão de usuários a admin comum |
| Editar: `name`, `email` | 2 | Parcial | Funcionam; limites não são refletidos no editor |
| Editar: `active` | 1 | Funcional | Persiste e invalida sessões quando muda |
| Analytics: período em dias | 1 | Funcional | Refaz consulta de stats |
| Leads: busca e origem | 2 | Funcional | Filtros server-side, com paginação |
| Tracking: evento e página | 2 | Funcional | Filtros server-side exatos |
| Consentimentos: device | 1 | Funcional | Filtro server-side |
| Consentimentos: status | 1 | Parcial | UI envia `custom`; registros reais customizados usam `partial` |

## Conteúdo público hardcoded fora do CMS

Os seguintes blocos de negócio continuam hardcoded, apesar de as páginas estarem apresentadas como editáveis no módulo Footer Links:

1. Termos — “Uso responsável” e seu parágrafo (`frontend/src/app/termos-de-uso/page.tsx:72-79`).
2. Termos — aside “Privacidade e dados” e seu parágrafo (`frontend/src/app/termos-de-uso/page.tsx:82-92`).
3. Privacidade — seção “Resumo rápido”, título, descrição e corpo (`frontend/src/app/privacidade/page.tsx:60-72`).
4. Privacidade — aside “LGPD e transparência” e seu parágrafo (`frontend/src/app/privacidade/page.tsx:74-86`).

Labels estruturais como “Telefone”, “Guia de canais”, nomes de botões de interface e nomes de ícones não foram classificados como conteúdo de negócio hardcoded.

## Rotas legadas, aliases e navegação

As rotas CMS legadas abaixo são redirects finos e coerentes, sem formulário duplicado:

- `/developer/home-hero` → `/developer/home#hero`.
- `/developer/home-dna` → `/developer/home#section-2`.
- `/developer/servicos-feedbacks` → `/developer/home#social-proof`.
- `/developer/sobre-hero` → `/developer/sobre`.
- `/developer/contato-info` → `/developer/fale-conosco`.
- `/developer/vagas` → `/developer/trabalhe-conosco#jobs`.
- `/admin/cadastrar-usuario` → `/developer/usuarios`.

Evidência: arquivos `page.tsx` dessas sete rotas possuem de 5 a 6 linhas e chamam apenas `redirect`.

Os 42 aliases públicos declarados em `frontend/src/lib/routes.ts:258-305` possuem as mesmas origens e destinos dos redirects de `frontend/next.config.js:134-182`; o rewrite adicional de uploads é esperado. Porém, os redirects estão duplicados manualmente em duas fontes, apesar de `routes.ts` ser documentado como fonte canônica. Não há divergência atual, mas há risco direto de drift em futura alteração.

`/developer/unidades` é a exceção: é uma tela completa não redirecionada, fora da navegação e parcialmente duplicada pelo editor da Home. Deve ser integrada ou removida/reclassificada.

## Segurança, persistência, cache e desempenho

Pontos positivos verificados:

- Admin global em `adminRouter.use(requireAdmin)` e mutações com Origin/JSON/CSRF.
- Uploads validam tipo declarado, assinatura e path interno; imagens geram variantes e vídeos não passam por conversão indevida.
- SEO, popup e footer validam/sanitizam mídia interna antes da persistência.
- Consentimentos mascaram IP; o teste existente cobre `partial`, device e ausência de localização sem permissão.
- DTO público de Analytics omite Sentry e os demais campos administrativos inertes, evitando publicar configuração não usada.
- Fetch público de conteúdo, SEO e slots usa `cache: "no-store"`, então uma alteração válida aparece sem cache stale (`frontend/src/lib/api.ts:76-83`, `frontend/src/lib/cmsPublic.ts:18-23`, `frontend/src/lib/cmsPublic.ts:73-78`).

Riscos e custos:

- `listAdminImages` percorre e executa `stat` em todo `frontend/public` a cada carga da biblioteca; o custo cresce linearmente com arquivos (`backend/src/services/mediaService.ts:214-296`).
- Leads lê e combina quatro stores inteiros em cada consulta; tracking e analytics também filtram/ordenam arrays JSON em memória antes de limitar. É compatível com o storage local atual, mas precisa de limites/arquivamento operacional conforme o volume crescer.
- O `SiteFooter` busca o conteúdo público completo para obter apenas `footerLinks.footer`; o `no-store` garante frescor, mas repete leitura/transporte maior que o DTO necessário.
- Tracking armazena até 25 mil eventos, mas resumo considera somente mil; o custo e o significado do número não estão alinhados.

## Validação executada e lacunas de teste

Comando executado no backend:

```text
cmd /c npm test -- --run tests/consentService.test.ts tests/authService.test.ts tests/trackingService.test.ts
```

Resultado: **3 arquivos e 4 testes aprovados**.

Esses testes confirmam as proteções atualmente cobertas, mas não detectam as divergências desta auditoria. Faltam testes próximos aos contratos para:

- limpar media slot e rejeitar chave/tipo inválido;
- rastrear todos os slots declarados até um consumidor;
- footer com arrays vazios, troca de link externo/interno e limites de campos;
- SEO slug/título absoluto/canonical versus OG URL;
- LGPD `required`, `enabledByDefault`, posição e filtro `partial`;
- popup com zero, todos os campos desligados e falha da config;
- deduplicação de contato/cotação na base unificada;
- DTO de auditoria `action` e resumo acima de 1.000 eventos;
- CRUD de usuário, owner/supremo, coerção de payload e invalidação de sessão;
- métrica de conversão baseada em `form_success`.

Não foram iniciados os servidores 4010/5010 e nenhum JSON operacional foi modificado. Validação visual real em mobile/tablet/desktop deve ser executada após as correções, especialmente para banner de consentimento, popup, tabelas de tracking/leads e estados vazios dos editores.

## Ordem recomendada de correção

1. Eliminar controles sem efeito que podem induzir operação errada: slots, Analytics duplicado, LGPD, slug e unidades.
2. Corrigir integridade de dados: duplicidade de leads, limpeza de slots, popup sem contato/zeros, auditoria `action`.
3. Unificar contratos: limites frontend/backend, external derivado da URL, icon allowlists, status `partial`, título SEO absoluto.
4. Ampliar o gerenciador de referências de mídia para SEO e popup.
5. Adicionar testes de contrato e então validar build/typecheck, hardening e breakpoints reais.

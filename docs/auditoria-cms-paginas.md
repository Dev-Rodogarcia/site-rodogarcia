# Auditoria técnica do CMS das páginas públicas

Data da auditoria: 14/07/2026  
Escopo: Home, Serviços, Sobre, Para Empresas, Fale Conosco, Trabalhe Conosco e Cotação.

## Objetivo e limite deste documento

Esta auditoria rastreia cada campo editável do CMS desde o formulário administrativo até a renderização pública, incluindo sanitização, persistência JSON, normalização da API e comportamento de coleções. Também registra controles que existem no CMS, mas não produzem o efeito prometido no site.

Este subescopo foi deliberadamente somente leitura sobre código e conteúdo: nenhuma correção de produção e nenhuma alteração em `states.md` foram feitas aqui. Assim, nas matrizes abaixo, “final” significa o estado ao término da auditoria; divergências permanecem como **pendentes** com correção objetiva proposta para a etapa de implementação.

## Método de contagem

- **Caminho lógico editável**: um caminho de formulário contado uma vez, mesmo quando repetido por vários itens de uma coleção. Exemplo: `jobs[*].title` conta como um caminho.
- **Ordenação**: conta como um caminho quando o CMS oferece Subir/Descer e a ordem é persistida.
- **Contrato de integração**: soma aos caminhos editáveis os comportamentos que podem falhar sem serem um campo, como coleção vazia, estado `active` carregado mas não editável e atualização do preview.
- **Controles materializados**: quantidade de inputs/selects/textareas atualmente gerada pelos dados canônicos e pelos defaults administrativos. Esse número cresce ou diminui conforme as coleções.
- IDs, timestamps e campos apenas técnicos, sem controle no CMS, não entram na contagem de campos.

Legenda:

- **Funcionando**: salva, normaliza e aparece no componente público conforme o contrato apresentado ao editor.
- **Parcial**: funciona apenas em parte dos valores, layouts ou tipos de navegação.
- **Não funcionando**: o fluxo apresentado pelo CMS não consegue produzir o resultado prometido.
- **Não usado**: o valor chega ao contrato público, mas não é lido pelo componente final.

## Fluxo comum confirmado

| Etapa | Implementação | Evidência |
|---|---|---|
| Formulário administrativo | Home e Serviços têm editores próprios; as outras cinco páginas reutilizam `RoutePageCmsEditor`. | `cms/frontend/src/app/developer/home/page.tsx:782-916`; `cms/frontend/src/app/developer/servicos/page.tsx:147-266`; `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:228-345` |
| Requisição autenticada | As mutações passam por `useApiRequest`, que injeta CSRF. | `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:228-230`; endpoints em `cms/frontend/src/lib/routes.ts:83-105` |
| Proteções HTTP | Todas as rotas administrativas exigem sessão; PUTs exigem origem permitida, JSON e CSRF. | `cms/backend/src/routes/adminRoutes.ts:66-155` |
| Controller | Controllers traduzem a seção recebida para o service, sem persistência direta. | `cms/backend/src/controllers/cmsController.ts:51-139` |
| Regra e sanitização | Home/Serviços passam por `cmsService`; páginas compartilhadas passam por `pageContent`. | `cms/backend/src/services/cmsService.ts:831-916`; `cms/backend/src/services/pageContent.ts:1-914` |
| Persistência | `contentRepository` serializa e grava `site/backend/storage/content.json` via `writeJsonFile`. | `cms/backend/src/repositories/contentRepository.ts:69-113,169-228` |
| API pública | O conteúdo é preparado/normalizado e servido por `/api/public/content`. | `cms/backend/src/services/contentService.ts:440-477`; `cms/backend/src/controllers/publicContentController.ts:5-6` |
| Consumo Next.js | Server Components buscam a API sem cache persistente. | `site/frontend/src/lib/api.ts:77-84` |

O encadeamento estrutural está correto. As divergências encontradas estão concentradas em contratos de campo, defaults/fallbacks e componentes que descartam parte do payload.

## Inventário e resultado quantitativo

| Página | Caminhos lógicos editáveis | Controles materializados | Contratos adicionais | Total rastreado | Funcionando | Parcial | Não funcionando | Não usado |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Home | 85 | 401 | 2 | 87 | 76 | 4 | 2 | 5 |
| Serviços | 14 | 46 | 1 | 15 | 13 | 2 | 0 | 0 |
| Sobre | 16 | 20 | 1 | 17 | 12 | 4 | 0 | 1 |
| Para Empresas | 5 | 13 | 1 | 6 | 4 | 1 | 0 | 1 |
| Fale Conosco | 18 | 34 | 1 | 19 | 18 | 1 | 0 | 0 |
| Trabalhe Conosco | 14 | 29 | 3 | 17 | 14 | 2 | 1 | 0 |
| Cotação | 16 | 44 | 3 | 19 | 14 | 3 | 2 | 0 |
| Validação compartilhada | 0 | 0 | 1 | 1 | 0 | 1 | 0 | 0 |
| **Total** | **168** | **587** | **13** | **181** | **151** | **18** | **5** | **7** |

Além desses 181 contratos, existem **7 grupos de cobertura editorial incompleta**, um por página, em que textos visíveis permanecem hardcoded e não têm campo correspondente no CMS. Eles são listados em seção própria porque não representam campos quebrados; representam conteúdo público ainda fora do CMS.

Snapshot canônico normalizado durante a auditoria: Home com 7 slides, 0 atalhos persistidos, 3 itens na seção 1, 3 itens na seção 2, 4 cards na seção 3, 9 unidades e 9 feedbacks; Serviços com 3 módulos e 5 FAQs; Trabalhe Conosco com 3 vagas; Cotação com 2 canais diretos e 4 outros canais. O teste foi feito importando apenas sanitizadores/normalizadores e não gravou storage.

## Divergências prioritárias

| ID | Severidade | Divergência comprovada | Impacto | Estado final |
|---|---|---|---|---|
| PAG-01 | Alta | O CMS oferece `modal` com âncora `#mapa-regional`, mas `sanitizeUrl` remove qualquer hash relativo. | A ação salva com destino vazio e não abre o modal/âncora prometido. | Pendente |
| PAG-02 | Alta | O frontend público força o atalho “Taxas” como ativo e reinjeta defaults quando a coleção está vazia. | Desativar/remover o atalho no CMS não controla o site; uma lista explicitamente vazia não permanece vazia. | Pendente |
| PAG-03 | Alta | Defaults do backend contêm WhatsApp fictício `5514999999999` e telefone divergente das rotas do frontend. | Limpar um campo pode retornar sucesso e publicar contato incorreto. | Pendente |
| PAG-04 | Alta | Campos visualmente obrigatórios das cinco páginas compartilhadas não usam `required` real e o backend troca vazio por default. | O CMS confirma salvamento, mas o valor digitado pode não persistir; erros editoriais ficam silenciosos. | Pendente |
| PAG-05 | Média | O editor de Sobre permite vídeo no hero, enquanto o backend exige imagem. | Seleção válida na interface falha com HTTP 422 ao salvar. | Pendente |
| PAG-06 | Média | Cinco variantes de `HomeMedia` e dois campos textuais são descartados pelo frontend público. | O editor altera valores sem efeito visual. | Pendente |
| PAG-07 | Média | `active` é preservado para vagas e canais de cotação, mas não existe controle para editá-lo. | Itens inativos carregados do JSON não podem ser reativados no CMS. | Pendente |
| PAG-08 | Média | Cotação converte `otherChannels: []` nos quatro defaults. | “Remover todos” aparenta salvar, mas os cards reaparecem. | Pendente |
| PAG-09 | Média | Os sete previews não recebem `revision`. | Após salvar, o iframe pode continuar exibindo a versão anterior até ser remontado/recarregado. | Pendente |
| PAG-10 | Média | `services.modules[*].image.position` aceita texto livre usado como classe Tailwind dinâmica. | Valores fora das classes já compiladas não mudam o posicionamento. | Pendente |
| PAG-11 | Média | `about.compliance.certificateUrl` e `business.faq.title` são persistidos, mas nunca renderizados. | Dois controles do CMS não produzem efeito público. | Pendente |
| PAG-12 | Baixa | Links de alguns CTAs usam `Link` ou `<a target="_blank">` fixos e ignoram a natureza interna/externa do URL. | Navegação funciona, porém com semântica inconsistente e, em alguns casos, nova aba indevida. | Pendente |

## Matriz campo a campo — Home

Editor: `cms/frontend/src/app/developer/home/page.tsx`
Persistência: PUTs específicos de `/api/admin/home/*`, sanitizados em `cms/backend/src/services/cmsService.ts` e gravados como `homePage`.
Consumo público: `site/frontend/src/app/page.tsx` e componentes em `site/frontend/src/components/home`.

| Seção e caminhos | Qtd. | Destino público | Inicial | Evidência e diagnóstico | Correção proposta | Final |
|---|---:|---|---|---|---|---|
| `hero.slides[*].order`, `mode`, `title`, `description`, `active`, `media.type`, `media.src`, `media.desktopSrc`, `media.mobileSrc`, `buttons[*].label`, `url`, `enabled`, `color`, `variant` | 14 | `HeroCarousel` | Funcionando | O componente filtra ativos, respeita modo, ordena e seleciona fontes desktop/mobile; botões consomem os cinco atributos. `site/frontend/src/components/home/HeroCarousel.tsx:25-29,133-141,178-195,264-276`. | Manter cobertura em teste de contrato. | Funcionando |
| `hero.slides[*].media.alt` | 1 | `HeroCarousel` | Parcial | O alt é usado nos slides com composição textual, mas slides `media-only` são sempre decorativos com `alt=""`. `HeroCarousel.tsx:132-142,178-195`. | Definir no CMS se a mídia é decorativa ou informativa; usar o alt quando informativa. | Pendente |
| `hero.slides[*].media.poster` | 1 | `HeroCarousel` | Não usado | O vídeo é renderizado sem prop `poster`. `HeroCarousel.tsx:264-276`. | Passar `poster={media.poster || undefined}` ou ocultar o campo para o hero. | Pendente |
| `quickActions[*].order`, `label`, `type`, `icon` | 4 | `QuickActionsSection` / `QuickActionButton` | Funcionando | Ordem, rótulo, tipo e ícone chegam aos botões. Editor em `cms/frontend/src/app/developer/home/page.tsx:1321-1413`; consumo em `site/frontend/src/components/home/QuickActionsSection.tsx:95-114`. | Manter. | Funcionando |
| Variante `quickActions[*].href` quando `type="modal"` | 1 | Âncora/modal da Home | Não funcionando | O editor sugere `#mapa-regional` (`cms/frontend/src/app/developer/home/page.tsx:1416-1423`), mas `sanitizeUrl` só aceita `/...` ou protocolos e retorna vazio para hash. `cms/backend/src/utils/sanitize.ts:18-31`; sanitização em `cmsService.ts:232-263`. Teste direto: `sanitizeUrl("#mapa-regional") === ""`. | Validar `^#[A-Za-z][\w:-]*$` exclusivamente para o tipo `modal`; manter os demais tipos em `sanitizeUrl`. | Pendente |
| `quickActions[*].downloadFile` e regra de destino obrigatório | 1 | Botão de download/Taxas | Parcial | O CMS afirma que item sem URL ficará oculto (`cms/frontend/src/app/developer/home/page.tsx:1303-1305,1450-1454`), mas o componente filtra apenas `enabled + label` e renderiza botão desabilitado. `site/frontend/src/components/home/QuickActionsSection.tsx:49-61,100-104`; `site/frontend/src/components/home/QuickActionButton.tsx:180-192`. | Filtrar também por destino válido antes de renderizar; retornar erro 422 para download ativo sem arquivo se o produto exigir obrigatoriedade. | Pendente |
| `quickActions[*].enabled` | 1 | Faixa de atalhos | Parcial | Funciona para ações comuns, mas `withRequiredRatesAction` força “Taxas” a `enabled: true`. `site/frontend/src/app/page.tsx:87-113`. | Remover coerção de `enabled`; defaults devem ser migração de ausência, não regra permanente. | Pendente |
| Ciclo vazio/adicionar/remover de `quickActions` | 1 | Faixa de atalhos | Não funcionando | `normalizeQuickActions` recria defaults quando o array está vazio (`cms/frontend/src/app/developer/home/page.tsx:420-430`); a página também usa todos os defaults quando recebe `[]` (`site/frontend/src/app/page.tsx:181-186`). No conteúdo canônico o campo está ausente e a API normaliza para `[]`. | Distinguir “propriedade ausente” de “array explicitamente vazio” no editor, normalizador e página pública; executar migração uma única vez. | Pendente |
| `section1.title`, `ctaLabel`, `ctaUrl`, `items[*].title`, `description`, `media.type`, `src`, `alt`, `poster`, `desktopSrc` | 10 | `PostHeroInteractiveShowcase` | Funcionando | Textos, CTA, mídia base/desktop, alt e poster são lidos. Editor em `cms/frontend/src/app/developer/home/page.tsx:1465-1506`; consumo em `site/frontend/src/components/home/PostHeroInteractiveShowcase.tsx:89-127`. | Manter. | Funcionando |
| `section1.items[*].media.mobileSrc` | 1 | `PostHeroInteractiveShowcase` | Não usado | O componente escolhe sempre `desktopSrc || src`, inclusive no mobile. `PostHeroInteractiveShowcase.tsx:89`. | Usar `<picture>` para imagem e fonte responsiva equivalente para vídeo, ou retirar o campo desta seção. | Pendente |
| `section2.title`, `items[*].order`, `title`, `description`, `active`, `media.type`, `src`, `desktopSrc`, `mobileSrc` | 9 | `OperationsCarousel` | Funcionando | A montagem do spotlight preserva variantes desktop/mobile e os textos/estado. `site/frontend/src/components/home/OperationsCarousel.tsx:48-69,287-389`. | Manter. | Funcionando |
| `section2.items[*].media.alt`, `media.poster` | 2 | `OperationsCarousel` | Não usado | O normalizador local descarta ambos; imagens usam o título como alt e vídeos não recebem poster. `OperationsCarousel.tsx:48-69,111-121,312-314,387-389`. | Preservar `alt` e `poster` no objeto do carousel e consumi-los no renderer. | Pendente |
| `section3.badge`, `title`, `description`, `ctaLabel`, `ctaUrl`, `cards[*].order`, `badge`, `title`, `description`, `ctaLabel`, `ctaUrl`, `media.type`, `src`, `alt`, `poster`, `desktopSrc` | 16 | `ServiceLinesRebrand` | Funcionando | Conteúdo textual, ordem, CTA, alt, poster e fonte desktop são lidos. `site/frontend/src/components/home/ServiceLinesRebrand.tsx:157-178`. | Manter. | Funcionando |
| `section3.cards[*].media.mobileSrc` | 1 | `ServiceLinesRebrand` | Não usado | A origem é fixada em `desktopSrc || src` para todos os breakpoints. `ServiceLinesRebrand.tsx:157`. | Adotar source mobile real ou retirar o controle. | Pendente |
| `regionalPresence.units[*].order`, `linkedUnitId`, `name`, `state`, `description`, `address`, `phone`, `email`, `buttonLabel`, `contactUrl`, `active` | 11 | Presença Regional | Funcionando | Todos os dados e a ordenação/visibilidade chegam à seção pública. Editor em `cms/frontend/src/app/developer/home/page.tsx:1660-1866`; normalização pública em `cms/backend/src/services/contentService.ts:340-391`. | Manter. | Funcionando |
| `trackingCta.buttons[*].label`, `url`, `enabled` | 3 | Seção “Rastreie sua carga” | Funcionando | Os dois botões fixos são normalizados e consumidos com visibilidade. Editor em `cms/frontend/src/app/developer/home/page.tsx:1871-1924`. | Manter. | Funcionando |
| `socialProof.title`, `feedbacks[*].order`, `name`, `role`, `company`, `testimonial`, `photo`, `rating`, `active` | 9 | Carrossel de prova social | Funcionando | Texto, mídia, nota, ordenação e estado são persistidos e renderizados. Editor em `cms/frontend/src/app/developer/home/page.tsx:1928-2005`. | Manter. | Funcionando |
| Atualização do preview da Home | 1 | `DeveloperResponsivePreview` | Parcial | O componente suporta `revision`, mas a Home passa somente `href` e `title`. `cms/frontend/src/components/developer/DeveloperResponsivePreview.tsx:24-35,63-74`; `cms/frontend/src/app/developer/home/page.tsx:1084`. | Incrementar uma revisão após cada PUT bem-sucedido e passá-la ao preview. | Pendente |

Subtotal Home: 87 contratos — 76 funcionando, 4 parciais, 2 não funcionando, 5 não usados.

## Matriz campo a campo — Serviços

Editor: `cms/frontend/src/app/developer/servicos/page.tsx`
Persistência: `/api/admin/services-page/modules`, `/final-cta` e `/faq`; sanitização/validação em `cms/backend/src/services/cmsService.ts:630-731,873-899`.
Consumo: `site/frontend/src/app/servicos/page.tsx`.

| Seção e caminhos | Qtd. | Inicial | Evidência e diagnóstico | Correção proposta | Final |
|---|---:|---|---|---|---|
| `modules[*].image.src`, `image.alt`, `eyebrow`, `title`, `description`, `details[*]`, `ctaLabel`, `ctaUrl`; `finalCta.quoteUrl`, `trackingUrl`; `faq.title`, `items[*].question`, `answer` | 13 | Funcionando | Todos os campos são lidos em `site/frontend/src/app/servicos/page.tsx:184-305`; editor em `cms/frontend/src/app/developer/servicos/page.tsx:330-458,516-568`. Quantidades fixas são validadas na API CMS. | Manter testes dos limites e das quantidades fixas. | Funcionando |
| `modules[*].image.position` | 1 | Parcial | O CMS aceita texto livre (`cms/frontend/src/app/developer/servicos/page.tsx:368-383`), a API CMS apenas sanitiza texto (`cms/backend/src/services/cmsService.ts:648`) e a página concatena o valor em classe Tailwind dinâmica (`site/frontend/src/app/servicos/page.tsx:197-203`). Uma classe não presente no build não tem CSS. | Trocar por enum de posições conhecidas e mapear para `style={{ objectPosition }}` ou classes estáticas enumeradas. | Pendente |
| Atualização do preview de Serviços | 1 | Parcial | Preview sem `revision` em `cms/frontend/src/app/developer/servicos/page.tsx:266`. | Incrementar revisão após save, como já ocorre no editor do footer (`cms/frontend/src/app/developer/footer-links/page.tsx:269,362-366`). | Pendente |

Subtotal Serviços: 15 contratos — 13 funcionando e 2 parciais.

## Matriz campo a campo — Sobre

Editor compartilhado: `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:496-590`
Persistência: `aboutPage`, seções `hero`, `compliance` e `finalCta`; sanitização em `cms/backend/src/services/pageContent.ts:459-487`.
Consumo: `site/frontend/src/app/sobre/page.tsx` e `site/frontend/src/components/internal/ComplianceSection.tsx`.

| Seção e caminhos | Qtd. | Inicial | Evidência e diagnóstico | Correção proposta | Final |
|---|---:|---|---|---|---|
| `hero.title`, `hero.description`, `hero.buttons[*].label`, `url`, `hero.media.alt`; `compliance.image.src`, `alt`, `title`, `description`; `finalCta.title`, `description`, `buttons[*].label` | 12 | Funcionando | Esses valores são usados nas seções públicas correspondentes. Hero/CTA em `site/frontend/src/app/sobre/page.tsx:91-130,239-263`; compliance em `ComplianceSection.tsx:70-104`. | Manter. | Funcionando |
| `hero.media.src` | 1 | Parcial | O editor usa `mediaType="all"` e permite vídeo (`cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:510-520`), mas `publicAssetUrl` chama `sanitizeInternalImageUrl` (`cms/backend/src/services/pageContent.ts:79-81,104-109`). Teste direto com `/caminhoneiro.mp4`: HTTP 422, “tipo de arquivo incompatível com o campo”. | Como a página usa imagem, mudar editor/preview para `mediaType="image"`; alternativa maior seria modelar tipo e renderer de vídeo ponta a ponta. | Pendente |
| `compliance.certificateText` | 1 | Parcial | É renderizado tanto como título do card do certificado quanto como eyebrow da seção. `site/frontend/src/components/internal/ComplianceSection.tsx:73-78,91`. | Separar os dois conceitos em campos distintos ou usar o texto em um único lugar bem definido. | Pendente |
| `compliance.certificateUrl` | 1 | Não usado | É editado em `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:561-565`, sanitizado em `cms/backend/src/services/pageContent.ts:472-480`, tipado e persistido, mas nenhum componente público o lê. | Transformar o card do certificado em link acessível quando houver URL; se não houver requisito de link, remover o campo do contrato e do CMS. | Pendente |
| `finalCta.buttons[*].url` para destinos externos | 1 | Parcial | A URL navega, mas `site/frontend/src/app/sobre/page.tsx:239-263` usa `Link` diretamente e ignora `PageButton.external`. | Reutilizar um componente de link que escolha `Link`/`a`, `target` e `rel` pela URL normalizada. | Pendente |
| Atualização do preview de Sobre | 1 | Parcial | O editor compartilhado passa o preview sem `revision`. `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:345`. | Estado de revisão comum incrementado após save. | Pendente |

Subtotal Sobre: 17 contratos — 12 funcionando, 4 parciais e 1 não usado.

## Matriz campo a campo — Para Empresas

Editor: `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:636-656` e seção de botões compartilhada.
Persistência: `businessPage.scaleCta` e `businessPage.faq`; sanitização em `cms/backend/src/services/pageContent.ts:490-503`.
Consumo: `site/frontend/src/app/para-empresas/page.tsx`.

| Seção e caminhos | Qtd. | Inicial | Evidência e diagnóstico | Correção proposta | Final |
|---|---:|---|---|---|---|
| `scaleCta.buttons[*].label`, `url`; `faq.items[*].question`, `answer` | 4 | Funcionando | Botões em `site/frontend/src/app/para-empresas/page.tsx:318-335`; perguntas/respostas em `:436-449`. | Manter. | Funcionando |
| `faq.title` | 1 | Não usado | O CMS edita em `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:641` e a API CMS preserva, mas a página hardcoda “Perguntas Frequentes” em `site/frontend/src/app/para-empresas/page.tsx:423-433`. | Renderizar `businessPage.faq.title` com fallback somente quando ausente. | Pendente |
| Atualização do preview de Para Empresas | 1 | Parcial | Preview compartilhado sem `revision` (`cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:345`). | Incrementar revisão após save. | Pendente |

Subtotal Para Empresas: 6 contratos — 4 funcionando, 1 parcial e 1 não usado.

## Matriz campo a campo — Fale Conosco

Editor: `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:402-432,662-725`
Persistência: `contactPage`; sanitização em `cms/backend/src/services/pageContent.ts:527-581`.
Consumo: `site/frontend/src/app/fale-conosco/page.tsx`.

| Seção e caminhos | Qtd. | Inicial | Evidência e diagnóstico | Correção proposta | Final |
|---|---:|---|---|---|---|
| `heroWhatsappButton.label`, `url` | 2 | Funcionando | Consumido no hero em `site/frontend/src/app/fale-conosco/page.tsx:134-145`. | Manter. | Funcionando |
| `mainChannels[*].description`, `button.label`, `button.url` | 3 | Funcionando | Títulos são deliberadamente fixos; descrição e CTA chegam aos cards em `site/frontend/src/app/fale-conosco/page.tsx:155-181`. | Manter. | Funcionando |
| `info.items[*].title`, `description`, `companyTitle`, `address`, `hours`, `channelGuideTitle`, `channelGuideDescription`, `documentsDescription`, `quickSupportDescription`, `indicators[*].value`, `description` | 11 | Funcionando | Todos os campos são usados na seção informativa em `site/frontend/src/app/fale-conosco/page.tsx:209-292`. | Manter. | Funcionando |
| `finalCta.buttons[*].label`, `url` | 2 | Funcionando | Ambos chegam ao CTA final em `site/frontend/src/app/fale-conosco/page.tsx:326-343`. | Manter. | Funcionando |
| Atualização do preview de Fale Conosco | 1 | Parcial | Preview compartilhado sem `revision` (`cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:345`). | Incrementar revisão após save. | Pendente |

Subtotal Fale Conosco: 19 contratos — 18 funcionando e 1 parcial.

Observação de conteúdo: há textos visíveis de implementação, “A página pública agora consome...” e “Tudo o que aparece aqui vem do painel...”, em `site/frontend/src/app/fale-conosco/page.tsx:147-153,204-206`. Eles contrariam a regra de não expor funcionamento interno e devem ser substituídos por texto de negócio (preferencialmente via CMS).

## Matriz campo a campo — Trabalhe Conosco

Editor: `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:436-459,728-786`
Persistência: `careersPage`; sanitização em `cms/backend/src/services/pageContent.ts:597-643`.
Consumo: `site/frontend/src/app/trabalhe-conosco/page.tsx` e `site/frontend/src/components/internal/CareersJobsList.tsx`.

| Seção e caminhos | Qtd. | Inicial | Evidência e diagnóstico | Correção proposta | Final |
|---|---:|---|---|---|---|
| `hero.buttons[*].label`, `url`; `cultureImage.src`, `alt`; `jobs[*].order`, `title`, `location`, `type`, `description`, `applyUrl`; `directApplication.buttons[*].label`, `url`; `finalCta.buttons[*].label`, `url` | 14 | Funcionando | Imagem em `site/frontend/src/app/trabalhe-conosco/page.tsx:297-305`; vagas em `site/frontend/src/components/internal/CareersJobsList.tsx:33-79`; os três grupos de botões chegam às seções públicas. | Manter. | Funcionando |
| Inclusão de vaga vazia / obrigatoriedade | 1 | Parcial | Os campos são marcados visualmente como obrigatórios, mas inputs não usam `required`; `sanitizeCareersPage` filtra silenciosamente vaga sem título/descrição. Teste direto: uma vaga totalmente vazia retorna array com tamanho 0 e não erro. `cms/backend/src/services/pageContent.ts:612-643`. | Validar no CMS frontend e retornar 422 na API CMS indicando o item/campo; não responder sucesso descartando o item. | Pendente |
| Edição de `jobs[*].active` | 1 | Não funcionando | A API CMS preserva `active` (`cms/backend/src/services/pageContent.ts:597-643`) e o público filtra `active !== false` (`site/frontend/src/components/internal/CareersJobsList.tsx:13-20`), mas o formulário `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:728-786` não exibe toggle. | Adicionar status ativo/inativo ao card, com pill e checkbox; preservar em reorder/save. | Pendente |
| Atualização do preview de Trabalhe Conosco | 1 | Parcial | Preview compartilhado sem `revision` (`cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:345`). | Incrementar revisão após save. | Pendente |

Subtotal Trabalhe Conosco: 17 contratos — 14 funcionando, 2 parciais e 1 não funcionando.

## Matriz campo a campo — Cotação

Editor: `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:462-490,790-855`
Persistência: `quotePage`; sanitização em `cms/backend/src/services/pageContent.ts:674-690,891-914`.
Consumo: `site/frontend/src/app/cotacao/page.tsx` e `site/frontend/src/components/internal/QuoteOtherChannelsSection.tsx`.

| Seção e caminhos | Qtd. | Inicial | Evidência e diagnóstico | Correção proposta | Final |
|---|---:|---|---|---|---|
| `hero.buttons[*].label`, `url`; `directChannels[*].title`, `description`, `button.label`; `otherChannels[*].order`, `icon`, `iconColor`, `title`, `description`, `button.label`, `button.url`, `buttonColor`; `finalCta.buttons[*].label` | 14 | Funcionando | Os outros canais preservam ícone, cores, textos, CTA e ordem em `site/frontend/src/components/internal/QuoteOtherChannelsSection.tsx:43-105`; demais labels/textos chegam às seções em `site/frontend/src/app/cotacao/page.tsx:263-378`. | Manter. | Funcionando |
| `directChannels[*].button.url` | 1 | Parcial | A URL funciona, mas é sempre renderizada com `<a target="_blank">`, mesmo quando o CMS aceita rota interna. `site/frontend/src/app/cotacao/page.tsx:263-287`. | Detectar rota interna e usar `Link`; abrir nova aba apenas para URL externa. | Pendente |
| `finalCta.buttons[*].url` | 1 | Parcial | A página usa `Link` diretamente e ignora semântica externa. `site/frontend/src/app/cotacao/page.tsx:352-378`. | Usar componente de link normalizado comum. | Pendente |
| Edição de `otherChannels[*].active` | 1 | Não funcionando | A API CMS preserva `active` e o público filtra inativos (`site/frontend/src/components/internal/QuoteOtherChannelsSection.tsx:34-41`), mas o CMS apenas define `active: true` ao criar e não oferece toggle (`cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:790-855`). | Adicionar toggle/status ao accordion e persistir o valor. | Pendente |
| Ciclo vazio/remover todos de `otherChannels` | 1 | Não funcionando | `sanitizeQuotePage` considera array vazio como ausência e repõe os quatro defaults (`cms/backend/src/services/pageContent.ts:891-914`). Teste direto: `sanitizeQuotePage({ otherChannels: [] }).otherChannels.length === 4`. | Usar `Array.isArray(source.otherChannels)` para preservar `[]`; aplicar defaults somente quando a propriedade não existe em migração. | Pendente |
| Atualização do preview de Cotação | 1 | Parcial | Preview compartilhado sem `revision` (`cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:345`). | Incrementar revisão após save. | Pendente |

Subtotal Cotação: 19 contratos — 14 funcionando, 3 parciais e 2 não funcionando.

## Divergência transversal de validação e defaults

| Contrato | Qtd. | Inicial | Evidência | Correção proposta | Final |
|---|---:|---|---|---|---|
| Campos obrigatórios das cinco páginas do editor compartilhado | 1 | Parcial | `ButtonFields` e `TextInput` mostram `required` no wrapper, mas não colocam o atributo nos elementos HTML. `cms/frontend/src/components/developer/RoutePageCmsEditor.tsx:119-225`. `sanitizeButton`, `sanitizeMedia` e os sanitizadores de página usam `valor || fallback`, portanto vazio explícito vira default. `cms/backend/src/services/pageContent.ts:84-109,459-503,527-643,891-914`. Testes diretos restauraram todo o hero de Sobre, título/4 itens de FAQ de Para Empresas e o botão de WhatsApp default de Contato após payload vazio. | (1) `required` real e mensagens por campo; (2) validators de seção com 422 para vazio explícito; (3) defaults somente em migração/ausência; (4) resposta de PUT deve refletir exatamente o persistido e o editor deve reaplicá-la ao estado. | Pendente |

## Drift de defaults de contato — risco de dado incorreto

Há duas fontes divergentes:

| Fonte | WhatsApp comercial/cotação | Telefone |
|---|---|---|
| API CMS | `https://wa.me/5514999999999` e variantes; `tel:+551408005914557` | `cms/backend/src/services/pageContent.ts:46-59` |
| Site frontend | rotas de WhatsApp apontam para `/fale-conosco`; `tel:08005914557` | `site/frontend/src/lib/routes.ts:148-160` |

O número `5514999999999` é claramente um placeholder. Como a sanitização substitui vazio por fallback, ele pode voltar ao conteúdo após uma edição aparentemente válida. A correção não deve adivinhar um WhatsApp real: deve alinhar defaults da API CMS e do site frontend com o contrato canônico aprovado pelo produto, remover placeholders publicáveis e acrescentar teste que proíba `999999999` nos DTOs públicos.

## Conteúdo público fora do CMS

Esses pontos não são campos existentes com falha; são lacunas de cobertura. Devem ser priorizados por necessidade editorial, sem transformar cada texto estável em configuração desnecessária.

| Página | Grupos hardcoded relevantes | Evidência |
|---|---|---|
| Home | Rótulos/certificações de compliance e chamada final. | `site/frontend/src/app/page.tsx`; componentes de Home fora das seções editáveis |
| Serviços | Hero e textos do CTA final; o próprio CMS declara que são fixos. | `cms/frontend/src/app/developer/servicos/page.tsx:243-247,469-473`; `site/frontend/src/app/servicos/page.tsx:136-170,241-269` |
| Sobre | Destaques, números, história, valores e certificações adicionais. | `site/frontend/src/app/sobre/page.tsx:55-80,132-216`; `site/frontend/src/components/internal/ComplianceSection.tsx:26-65` |
| Para Empresas | Hero, serviços, rollout e quase todas as seções, exceto botões de escala e perguntas/respostas. | `site/frontend/src/app/para-empresas/page.tsx:68-145,195-227,284-421` |
| Fale Conosco | Títulos/copy de hero, introduções e CTA final; inclui duas frases internas impróprias para usuário final. | `site/frontend/src/app/fale-conosco/page.tsx:124-206,294-343` |
| Trabalhe Conosco | Hero, benefícios, processo, texto de candidatura e copy final. | `site/frontend/src/app/trabalhe-conosco/page.tsx` |
| Cotação | Hero, tags, títulos/descrições das seções e copy final. | `site/frontend/src/app/cotacao/page.tsx:58-125,201-382` |

Recomendação de produto: primeiro levar ao CMS textos promocionais, CTAs e números que mudam com frequência; manter labels estruturais estáveis no código. As duas frases internas de Fale Conosco são correção obrigatória, independentemente dessa decisão.

## Plano de correção seguro

1. **Eliminar publicação incorreta e falso sucesso**: alinhar defaults de contato, validar vazios com 422 e preservar arrays explicitamente vazios.
2. **Restabelecer o contrato de atalhos da Home**: aceitar hash somente para modal, parar de forçar Taxas/defaults e ocultar itens sem destino.
3. **Fechar campos sem efeito**: consumir/remover as cinco variantes de mídia, `certificateUrl` e `business.faq.title`.
4. **Completar estados de coleção**: toggles de vagas e outros canais; erro acionável para item incompleto.
5. **Uniformizar mídia e links**: Sobre image-only; navegação interna/externa por helper comum; posição de imagem de Serviços como enum/CSS seguro.
6. **Atualizar previews**: revisão após toda resposta PUT bem-sucedida.
7. **Cobrir regressões**: testes unitários dos sanitizadores e testes de integração do DTO público; smoke responsivo das sete páginas após os builds obrigatórios.

## Validações executadas nesta auditoria

- Leitura integral de `AGENTS.md` e `states.md` antes da análise.
- Inspeção estática dos sete editores, tipos de `cms/frontend`/`cms/backend`/`site/frontend`, rotas, controllers, services, repository, JSON canônico, normalizador público e componentes finais.
- Execução read-only dos sanitizadores/normalizadores com `tsx` para confirmar:
  - `sanitizeUrl("#mapa-regional")` resulta em string vazia;
  - vídeo no hero de Sobre é rejeitado como tipo incompatível;
  - uma vaga nova totalmente vazia é descartada silenciosamente;
  - `otherChannels: []` volta a quatro defaults;
  - payloads vazios de Sobre, Para Empresas e Contato recebem conteúdo default em vez de erro.
- Nenhum servidor foi iniciado, nenhuma porta foi alterada e nenhum arquivo de storage foi escrito.

Build, typecheck e teste E2E visual não foram executados porque esta entrega não altera código. Eles são obrigatórios após a implementação das correções propostas.

# Auditoria técnica do CMS — backend, persistência e contratos

Data da auditoria: 14/07/2026  
Escopo: rotas, controllers, services, repositories JSON, validação, mídia, SEO, consentimento, popup, analytics, leads e o contrato entregue ao site público.

> Este documento registra o comportamento encontrado no início do pente-fino. Algumas correções podem aparecer simultaneamente no worktree compartilhado durante a integração final; uma divergência só deve ser considerada encerrada depois dos testes indicados em cada item.

## Resumo executivo

Foram inspecionadas 63 declarações de rota nos roteadores de CMS e fluxos adjacentes: 42 no roteador administrativo e 21 distribuídas entre conteúdo público, analytics, formulários e popup. Também foram percorridos os contratos de conteúdo ativo no backend e frontend, os repositories JSON, os sanitizadores, os consumidores públicos e os dez testes automatizados existentes.

Resultado consolidado do backend:

| Situação | Quantidade | Observação |
| --- | ---: | --- |
| Divergências de prioridade alta | 12 | Há impacto de round-trip, controle sem efeito, referência incompleta ou dado duplicado |
| Divergências de prioridade média | 8 | Robustez, coerência de DTO, limites ou informação enganosa |
| Divergências de prioridade baixa | 1 | Sem perda imediata, mas contrato sem significado operacional |
| Referências canônicas de mídia verificadas | 55 | 27 URLs únicas; nenhuma ausente no snapshot versionado |
| Slots de mídia anunciados pelo CMS | 25 | 7 consumidos continuamente, 2 usados apenas em migração e 16 sem consumidor |
| Testes automatizados existentes | 10 | Nenhum cobre CRUD/round-trip das páginas, footer, SEO, popup, analytics ou coleções |

Os fundamentos estão íntegros: a persistência passa pelos repositories JSON e pela escrita atômica; o DTO público não expõe as estruturas legadas do `content.json`; uploads validam assinatura real e passam pelo Sharp; as rotas administrativas usam autenticação e as mutações aplicam origem, JSON quando cabível e CSRF. Os problemas encontrados se concentram na fidelidade entre “editar/salvar/recarregar/publicar”, em controles de CMS que não chegam ao site público e em integrações paralelas que não compartilham a mesma fonte de verdade.

## Mapa de fluxo auditado

| Domínio | Entrada administrativa | Service/repository | Storage | Saída pública/consumidor | Estado |
| --- | --- | --- | --- | --- | --- |
| Home | `/api/admin/home/*` | `cmsService` / `contentRepository` | `storage/content.json` | `/api/public/content` → Home | Parcial |
| Serviços | `/api/admin/services-page/*` | `cmsService` / `contentRepository` | `storage/content.json` | `/api/public/content` → Serviços | Funcionando |
| Sobre, Empresas, Contato, Carreiras e Cotação | `/api/admin/pages/:pageKey/:sectionKey` | `pageContent` / `contentRepository` | `storage/content.json` | `/api/public/content` → páginas | Parcial |
| Footer, Termos e Privacidade | `/api/admin/footer-links/:sectionKey` | `footerLinksContent` / `contentRepository` | `storage/content.json` | `/api/public/content` → layout/páginas legais | Parcial |
| Unidades genéricas | `/api/admin/units*` | CRUD genérico / `contentRepository` | `content.units` | Nenhum consumidor atual da Home | Não funcionando para o efeito anunciado |
| Textos globais legados | `/api/admin/site-texts` | `siteTextsRepository` | `storage/site-texts.json` | Incluído no DTO, sem consumidor localizado | Não utilizado atualmente |
| SEO | `/api/admin/seo-settings` | `seoService` | `seo-settings.json` | `/api/public/seo` → metadata Next | Parcial |
| Biblioteca e slots de mídia | `/api/admin/images*`, `/media-slots` | `mediaService` | uploads, library e slots JSON | uploads estáticos + `/api/public/media-slots` | Parcial |
| Consentimento | `/api/admin/consent-settings` | `consentService` | settings e eventos JSON privados | `/api/consent-settings` → banner | Parcial |
| Popup | `/api/popup-config` | `popupService` | config, leads e eventos JSON | banner de saída | Parcial |
| Analytics/tracking | `/api/analytics/config` | `analyticsService`, `trackingService` | config e eventos JSON privados | config pública + scripts de tracking | Parcial |
| Leads/formulários | `/api/contact`, `/api/quote`, `/api/leads` | `formsService`, `leadsService` | três coleções JSON | painel unificado | Incorreto na unificação |

## Inventário funcional por grupo de campos

Esta tabela registra o estado backend → JSON → DTO público. A avaliação visual campo a campo fica no relatório principal; aqui o foco é perda, sobrescrita, rejeição e ausência de consumo.

| Grupo editável | Aceito e normalizado | Persiste/recarrega | Chega ao DTO | Efeito público | Observação |
| --- | --- | --- | --- | --- | --- |
| Home: slides do hero | Sim | Sim | Sim | Sim | Mídia interna é validada |
| Home: ações rápidas | Parcial | Parcial | Sim | Parcial | Fragmentos eram descartados e “Taxas” é forçada pela Home |
| Home: sobre, contadores, showcase, recursos, parceiros, certificações | Sim | Sim | Sim | Sim | Sem perda estrutural detectada no backend |
| Home: presença regional | Sim | Sim | Sim | Sim | Usa coleção interna da Home, não a coleção genérica de unidades |
| Serviços: hero, introdução e cartões | Sim | Sim | Sim | Sim | Contratos backend/frontend ativos coincidem |
| Sobre: hero, história, missão/visão/valores, números, estrutura, liderança | Sim | Sim | Sim | Sim | Botões continuam sujeitos à regra de URL |
| Empresas: hero, benefícios, setores e CTA | Sim | Sim | Sim | Sim | Mídia interna validada |
| Contato: hero, canais, cards, formulário e mapa | Sim | Sim | Sim | Sim | Links externos passam por sanitização |
| Carreiras: hero, cultura, benefícios, vagas e formulário | Parcial | Parcial | Sim | Parcial | Vaga incompleta é removida silenciosamente; âncoras eram rejeitadas |
| Cotação: hero, introdução, formulário e outros canais | Parcial | Parcial | Sim | Parcial | Não é possível manter `otherChannels` explicitamente vazio |
| Footer: colunas, redes, links inferiores, horários e blocos legais | Parcial | Parcial | Sim | Parcial | Diversos arrays vazios são repostos com defaults |
| SEO: title, description, canonical, robots e OG | Sim | Sim | Sim | Sim | `metaTags` multiline e `slug` tinham divergências próprias |
| Consentimento: textos e versão | Sim | Sim | Sim | Sim | Objetos aninhados aceitam chaves sem allowlist |
| Consentimento: categorias | Parcial | Parcial | Sim | Parcial | Flags eram reescritas, chaves podiam colidir |
| Popup: conteúdo, estilo e mídia | Parcial | Parcial | Sim | Parcial | Zeros eram convertidos em defaults; formulário podia ficar impossível de enviar |
| Analytics: GA4, Clarity, tracking e milestones | Sim | Sim | Parcial | Parcial | GA4, Clarity, enabled e milestones têm consumidor |
| Analytics: demais opções exibidas | Sim | Sim | Não ou sem consumidor | Não | Aproximadamente 12 controles sem integração de runtime |
| Slots `home.cert.*` | Sim | Sim, exceto limpar | Sim | Sim | 7 slots efetivos |
| Demais slots | Sim | Sim, exceto limpar | Sim | Não na maioria | 18 sem integração contínua |

## Divergências de prioridade alta

### H-01 — URLs de fragmento quebravam ações internas

**Evidência:** `sanitizeUrl` em `backend/src/utils/sanitize.ts` aceitava apenas caminhos iniciados por `/` ou URLs absolutas. `cmsService` usa esse sanitizador nas ações rápidas e `pageContent` o usa em botões. O CMS oferece `#mapa-regional`, `#vagas` e `#candidatura` como valores válidos.

**Efeito:** salvar a ação “Cidades” podia persistir `href: ""`; botões com fragmento podiam voltar ao fallback ou perder a navegação. O backend respondia sucesso.

**Correção necessária:** aceitar somente fragmentos seguros no formato `#id`, sem abrir suporte a protocolos ou script. O worktree compartilhado já contém uma implementação inicial; ainda requer testes de aceitação e rejeição (`#mapa-regional`, `javascript:`, fragmento vazio e caracteres inválidos).

### H-02 — Slot de mídia não pode ser limpo

**Evidência:** a interface envia `""` para “Usar fallback do site”. `updateMediaSlots`, em `backend/src/services/mediaService.ts`, filtra pares sem valor e depois faz merge sobre o objeto atual.

**Efeito:** o valor anterior permanece, embora o CMS mostre mensagem de sucesso. O ciclo editar → salvar → recarregar não preserva a intenção.

**Correção necessária:** distinguir ausência de chave de remoção explícita; remover a chave persistida quando o payload contiver string vazia validada.

### H-03 — 18 dos 25 slots não controlam o site atual

Os sete slots consumidos continuamente são:

- `home.cert.iso`
- `home.cert.sassmaq`
- `home.cert.ecovadis`
- `home.cert.pf`
- `home.cert.pcsp`
- `home.cert.exercito`
- `home.cert.ibama`

Dois slots aparecem apenas em migração de conteúdo legado, não como fonte contínua:

- `about.hero`
- `careers.culture`

Os 16 slots sem outro consumidor localizado são:

- `home.hero.default`
- `home.showcase.quote`
- `home.showcase.tracking`
- `home.showcase.coverage`
- `home.services.distribution.video`
- `home.services.distribution.poster`
- `home.services.indoor.video`
- `home.services.indoor.poster`
- `home.services.special.video`
- `home.services.special.poster`
- `services.hero`
- `business.hero`
- `careers.hero`
- `contact.og`
- `popup.desktop`
- `popup.mobile`

**Efeito:** o administrador salva e recarrega um valor válido, mas ele não muda a interface pública.

**Correção necessária:** conectar cada slot a uma fonte pública claramente definida ou retirar o controle do CMS. Não manter dois campos concorrentes para a mesma mídia.

### H-04 — Substituição e contagem de referências de mídia são incompletas

**Evidência:** `replaceAdminImageReferences` atualiza `content.json`, `site-texts.json` e slots, mas não percorre SEO nem popup. `getReferences` usa a mesma visão incompleta. A operação também aceita registros de biblioteca de `kind` diferente.

**Efeito:** “substituir em todo o conteúdo” pode deixar OG images e imagens do popup apontando para o arquivo antigo; a biblioteca informa contagem inferior à real. Uma imagem pode ser trocada por vídeo, ou o inverso, e falhar depois no sanitizador público.

**Correção necessária:** criar um índice único de referências que inclua conteúdo, textos, slots, SEO e popup; exigir compatibilidade de tipo; preparar todas as alterações antes de gravar para evitar substituição parcial.

### H-05 — `metaTags` de SEO perdia separadores de linha

**Evidência:** o CMS instrui “uma meta tag por linha” e o frontend separa o texto por `\n`. O backend aplicava `sanitizeText`, que condensava whitespace e transformava várias linhas em uma.

**Efeito:** várias meta tags passavam a ser interpretadas como uma única chave/valor malformada.

**Correção necessária:** sanitização multiline explícita, com limite total e limpeza por linha. Há correção inicial no worktree compartilhado; deve ser coberta por teste de round-trip e por metadata gerada.

### H-06 — Categorias de consentimento não preservavam os controles do CMS

**Evidência:** `normalizeCategory` forçava `required` apenas para a chave `necessary` e igualava `enabledByDefault` a `required`, ignorando os valores enviados. A atualização não rejeitava chaves duplicadas, e uma renomeação de `necessary` podia eliminar a única categoria obrigatória.

**Efeito:** toggles voltavam a outro valor após salvar/recarregar; duplicatas eram gravadas e depois deduplicadas na leitura; configurações sem categoria obrigatória podiam ser publicadas.

**Correção necessária:** validar cada item como objeto, exigir chaves únicas e não vazias, garantir a categoria necessária, preservar flags permitidas e escrever exatamente a estrutura normalizada retornada. A categoria necessária deve continuar obrigatória por política, mesmo que o CMS tente desativá-la.

### H-07 — Popup convertia zero em default e podia gerar formulário impossível

**Evidência:** `popupService` usava `Number(valor) || default` para `delaySeconds`, `cooldownHours` e `maxShowsPerVisitor`. A própria faixa aceita zero nos dois primeiros. Também era possível desativar nome, e-mail e telefone ao mesmo tempo, mas a criação do lead exige pelo menos um deles.

**Efeito:** `0` voltava como 10/24/1 após salvar; um popup sem campos de contato renderizava e recusava todas as submissões.

**Correção necessária:** diferenciar zero de `NaN`, aplicar clamp depois do parse e rejeitar configuração sem nenhum campo de contato ativo.

### H-08 — Aproximadamente 12 controles de analytics persistem sem efeito

Campos sem consumidor de runtime localizado:

- `siteUrl`
- `consent.bannerEnabled`
- `consent.version`
- `consent.categories.analytics`
- `consent.categories.marketing`
- `consent.categories.performance`
- `tracking.heartbeatSeconds`
- `providers.sentry.enabled`
- `providers.sentry.dsn`
- `seo.enableSearchConsole`
- `seo.propertyUrl`
- `seo.sitemapUrl`

`readPublicAnalyticsConfig` entrega somente tracking, GA4 e Clarity. No frontend, tracking usa `enabled` e `scrollMilestones`; não há heartbeat configurável, Sentry ou integração com os campos SEO desse formulário.

**Efeito:** o painel confirma alterações que não afetam scripts, consentimento, SEO nem telemetria.

**Correção necessária:** integrar apenas opções com uma implementação segura e fonte única; ocultar/remover as demais. O DSN do Sentry não deve ser exposto por simples ampliação do DTO sem uma integração deliberada.

### H-09 — Contatos e cotações aparecem duplicados no painel unificado

**Evidência:** `formsService` grava o registro original e chama `createLeadRecord`, que cria outro ID. `listUnifiedLeads` concatena leads centrais, popup, contatos e cotações e deduplica somente por ID.

**Efeito:** cada contato/cotação entra duas vezes e infla o total. O popup não sofre o mesmo problema porque reaproveita o objeto/ID do lead central.

**Correção necessária:** escolher uma fonte canônica. Alternativas seguras: listar apenas `leadsRepository` no painel unificado ou preservar um `sourceId` estável e deduplicar por origem + ID original.

### H-10 — CRUD de Unidades não alimenta a Home

**Evidência:** `/developer/unidades` altera `content.units`; a Home pública lê exclusivamente `homePage.regionalPresence.units`. A migração em `contentRepository` copia a coleção raiz somente quando a seção regional não existe. `linkedUnitId` não é resolvido dinamicamente no DTO público.

**Efeito:** o CMS afirma que a coleção alimenta o mapa, mas criar, editar, reordenar ou remover uma unidade não muda a Home. No snapshot há nove registros em cada coleção e eles coincidem, mas são apenas uma fotografia duplicada.

**Correção necessária:** definir uma fonte única. Preferência: resolver os vínculos da Home a partir de `content.units` no service/DTO e manter na Home apenas composição/ordem; alternativamente, sincronizar o CRUD de forma transacional. A UF também deve usar a lista brasileira, não aceitar qualquer par de letras.

### H-11 — Arrays dinâmicos vazios ou inválidos sofrem restauração/remoção silenciosa

| Área | Comportamento observado |
| --- | --- |
| Cotação `otherChannels` | Array vazio é trocado pelos defaults |
| Footer `columns` e links de coluna | Array vazio é trocado pelos defaults |
| Footer `socialLinks`, `bottomLinks`, `serviceHours` | Array vazio é trocado pelos defaults |
| Termos/Privacidade `blocks` | Array vazio é trocado pelos defaults |
| Carreiras `jobs` | Item incompleto é filtrado e desaparece com resposta 200 |

**Efeito:** ações de remover o último item ou criar um item ainda incompleto não sobrevivem ao round-trip. A resposta de sucesso mascara perda de conteúdo.

**Correção necessária:** distinguir campo ausente de array explicitamente vazio; validar itens nas mutações e retornar 422 com campo/índice, sem substituir ou filtrar silenciosamente. Defaults devem ser aplicados somente na migração/leitura de conteúdo realmente ausente.

### H-12 — A ação “Taxas” ignora controles do CMS

**Evidência:** a Home pública chama `withRequiredRatesAction`, força `enabled: true`, força o tipo download e reinsere a ação caso tenha sido removida. O CMS oferece visibilidade, tipo e remoção como se fossem efetivos; seus próprios defaults ainda divergem do fallback público.

**Efeito:** salvar funciona no JSON, mas não controla o que o visitante vê.

**Correção necessária:** ou tornar “Taxas” uma ação de sistema claramente bloqueada no CMS, ou respeitar o contrato editável. Não expor controles que são sobrescritos no render.

## Divergências de prioridade média

### M-01 — Variantes `medium` e `large` aparecem como itens duplicados

`libraryRecordByUrl` indexa URL principal, original, otimizada e thumbnail, mas não `mediumUrl`/`largeUrl`. Ao varrer o diretório de uploads, essas variantes podem reaparecer como arquivos independentes.

**Correção:** indexar todas as variantes e excluir arquivos derivados da listagem avulsa.

### M-02 — Limites de upload e tradução de erro não são coerentes

O Multer aceita até 64 MB; o service limita imagem a 8 MB e vídeo a 64 MB. Erros do Multer não são convertidos explicitamente por `errorHandler`, podendo virar 500. O JSON parser está configurado para 2 MB, embora o contrato operacional documente 8 MB; isso também torna o caminho legado por data URL menor do que o limite nominal.

**Correção:** separar limites por tipo/rota, mapear `MulterError` para 413/422 e alinhar o limite JSON com o contrato realmente suportado.

### M-03 — `slug` de SEO era editável, salvo e nunca consumido

A seleção pública usa `path`, e canonical/metadata também derivam de `path`; `slug` não participa do roteamento.

**Correção:** derivar `slug` de `path` e exibi-lo como somente leitura, ou remover o campo do contrato. Há ajuste inicial no worktree compartilhado.

### M-04 — Objetos de consentimento aceitam dados aninhados sem schema e a resposta pública é excessiva

`behavior`, `desktop` e `mobile` são mesclados como objetos brutos, sem allowlist, enums ou normalização por chave. Ao registrar consentimento, a rota pública retorna o objeto persistido completo, incluindo metadados operacionais, em vez de DTO mínimo.

**Correção:** schemas explícitos e resposta pública limitada a identificador, data/status e versão necessários ao cliente.

### M-05 — Controles de consentimento sem efeito visual/operacional

`desktop.position` é editável, porém o banner desktop fica centralizado pelo componente. `blockAnalyticsUntilConsent` também é editável, mas não altera o runtime; os scripts já são bloqueados por consentimento compatível.

**Correção:** remover/bloquear esses controles se a política for fixa, ou implementar o comportamento completo. Para segurança, não permitir desativar o bloqueio por um toggle meramente cosmético.

### M-06 — Normalização do popup é rasa e permissiva

A leitura faz merge raso dos defaults, portanto JSON parcial em `desktop`/`mobile` pode produzir um DTO backend incompleto. A atualização preserva chaves aninhadas desconhecidas e elas podem ser devolvidas publicamente.

**Correção:** schema profundo com allowlist, defaults por campo e DTO público mínimo.

### M-07 — Resumo de tracking conta no máximo mil eventos

`getTrackingSummary` chama `listTrackingEvents` com `limit: 1000` e calcula total, tipos e páginas sobre esse recorte.

**Efeito:** o “total” do CMS e os rankings ficam menores que o storage quando há mais de mil eventos.

**Correção:** agregar sobre a coleção completa ou manter contadores agregados, aplicando limite somente à lista recente.

### M-08 — Classificação de dispositivo em leads confunde iPad

O primeiro regex de `getDeviceFromRequest` inclui `ipad` na categoria mobile; o ramo tablet posterior não consegue classificá-lo.

**Correção:** testar tablet/iPad antes de mobile, como já ocorre no service de consentimento.

## Divergência de prioridade baixa

### L-01 — `updatedAt` público muda em toda leitura

`preparePublicContent` define `updatedAt` com `new Date()` durante cada GET, em vez de representar a última modificação persistida.

**Efeito:** o campo não serve para auditoria, cache, sincronização ou diagnóstico.

**Correção:** persistir/recalcular a data apenas em mutações, ou remover o campo do DTO se não houver consumidor.

## Controles de segurança e persistência que passaram

- `contentRepository` e os demais repositories usam o helper de escrita JSON atômica e criação de diretório.
- O DTO público normaliza apenas contratos ativos e não expõe usuários, sessões, consentimentos privados, IP bruto ou estruturas legadas.
- Rotas administrativas auditadas ficam atrás de `requireAdmin`; mutações JSON aplicam origem permitida, content type e CSRF.
- Upload multipart aplica origem, CSRF, validação de assinatura e processamento via Sharp para imagens.
- URLs de mídia são limitadas a referências internas; a varredura do conteúdo canônico encontrou 55 referências, 27 únicas e zero arquivos ausentes.
- Fetches públicos relevantes usam `cache: "no-store"`; não foi encontrado cache intermediário que explique conteúdo antigo após salvar.
- Os tipos ativos de conteúdo em `backend/src/types/content.ts` e `frontend/src/types/content.ts` coincidem; as diferenças do backend são estruturas legadas/agrupadoras esperadas.

## Cobertura automatizada e lacunas

Comandos executados durante a auditoria:

```text
backend: npm run typecheck  -> passou
backend: npm test           -> passou (6 arquivos, 10 testes)
varredura estática de mídia -> 55 referências, 27 únicas, 0 ausentes
```

Cobertura existente:

- rate limit de autenticação;
- validação de ambiente;
- registro de consentimento;
- upload e validação de mídia;
- tracking básico.

Cobertura ausente, em ordem de risco:

1. round-trip de cada seção de Home, páginas e footer;
2. arrays explicitamente vazios versus propriedade ausente;
3. URLs com fragmento seguro e rejeição de protocolos perigosos;
4. limpar slot, substituir referências e compatibilidade imagem/vídeo;
5. SEO multiline e metadata final;
6. categorias de consentimento, unicidade e categoria necessária;
7. valores zero e formulário válido do popup;
8. deduplicação de leads e agregação de tracking acima de mil eventos;
9. vínculo entre coleção de unidades e presença regional.

## Ordem recomendada para integração das correções

1. Corrigir perda/sobrescrita silenciosa: fragmentos, slots vazios, arrays vazios, vagas inválidas, categorias e zeros do popup.
2. Resolver fontes concorrentes: unidades versus presença regional, campos diretos versus slots, e leads centrais versus formulários.
3. Remover ou conectar controles sem efeito: 18 slots, Taxas, analytics, consentimento desktop/behavior e SEO slug.
4. Completar referência de mídia e tornar substituição compatível e atômica.
5. Adicionar testes de round-trip antes da validação final de typecheck, build e suíte completa.

## Critério de encerramento

Um item desta auditoria só está encerrado quando:

- o payload válido salva e recarrega sem alteração inesperada;
- payload inválido retorna erro acionável, sem sucesso aparente;
- o JSON persistido contém exatamente a estrutura normalizada;
- o endpoint público entrega o valor quando ele for público;
- o consumidor visível usa esse valor ou o controle foi removido/bloqueado no CMS;
- typecheck, build e testes aplicáveis passam no backend e frontend.

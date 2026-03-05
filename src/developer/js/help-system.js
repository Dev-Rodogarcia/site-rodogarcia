/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/help-system.js
Modulo  : Frontend - shell do painel developer
Papel   : Sistema reutilizavel de ajuda no painel (dica curta, exemplo simples e tooltip detalhado).

Responsabilidades:
- Aplicar ajuda automatica por campo de formulario via mapa central de textos.
- Preencher blocos "Ver exemplo simples" com exemplos completos.
- Exibir tooltip de ajuda com linguagem para leigo e nota tecnica para dev.

Integracoes:
- Dependencias: /developer/js/navigation.js
- Endpoints/rotas: nao se aplica.
- Classes/seletores/chaves: .help-icon, .help-details, [data-help-id], [data-help-example-id], .field-hint

Entradas e saidas:
- Entradas: DOM da pagina atual do Developer e dicionario AJUDAS.
- Saidas  : mutacao de DOM para inserir microcopy, exemplos e popover.

Elementos tecnicos: aplicarSistemaAjuda, aplicarAjudaCampos, vincularIcones, mostrarPopover
[DOC-FILE-END]============================================================== */

const AJUDAS = {
  'hero-layout': {
    titulo: 'Tipo de layout do Hero',
    curto: 'Escolhe entre Texto + Imagem ou Imagem Completa.',
    onde: 'Topo da Home (carrossel Hero).',
    dicas: ['Texto + Imagem para institucional.', 'Imagem Completa para campanha visual.'],
    exemplo: ['Exemplo simples:', '', 'Layout: Texto + Imagem', 'Titulo: Frete rapido sem interrupcoes', '', 'Layout: Imagem Completa', 'Imagem: banner-promocional.webp'],
    bom: 'Layout definido pelo objetivo do slide.',
    ruim: 'Trocar layout sem revisar o resultado no site.',
    dev: 'Salvo em content.heroSlides[].layoutMode.'
  },
  'hero-content': {
    titulo: 'Conteudo do Hero',
    curto: 'Define titulo, descricao e imagem do slide.',
    onde: 'Secao Hero da Home.',
    dicas: ['Titulo curto (ate 10 palavras).', 'Descricao objetiva com beneficio.', 'Imagem horizontal com boa qualidade.'],
    exemplo: ['Exemplo simples:', '', 'Titulo: Frete rapido sem interrupcoes', 'Subtitulo: Seguranca e eficiencia em movimento...', 'Imagem: /public/foto5.png'],
    bom: 'Mensagem clara com CTA direto.',
    ruim: 'Texto longo e imagem sem contexto.',
    dev: 'Campos title/description/image em content.heroSlides[].'
  },
  'hero-buttons': {
    titulo: 'Botoes do Hero',
    curto: 'Configura CTA principal e CTA secundario.',
    onde: 'Card de botoes no Hero ou overlay central da imagem completa.',
    dicas: ['Use no maximo 2 botoes.', 'Botao 1 deve ser o CTA principal.'],
    exemplo: ['Exemplo simples:', '', 'Botao 1: Fazer Cotacao -> /cotacao.html', 'Botao 2: Rastrear Carga -> /servicos.html'],
    bom: 'Texto de acao com link valido.',
    ruim: 'Botoes ativos com link vazio.',
    dev: 'Persistido em content.heroSlides[].buttons[].'
  },
  'hero-active': {
    titulo: 'Status do slide',
    curto: 'Controla se o slide aparece no site.',
    onde: 'Carrossel Hero da Home.',
    dicas: ['Ativo = publicado.', 'Inativo = salvo sem publicar.'],
    exemplo: ['Exemplo simples:', '', 'Slide ativo: aparece na Home.', 'Slide inativo: fica salvo no CMS.'],
    bom: 'Desativar campanhas vencidas.',
    ruim: 'Manter slide antigo ativo por engano.',
    dev: 'Filtrado por item.active na API publica.'
  },
  'dna-content': {
    titulo: 'Conteudo do DNA',
    curto: 'Atualiza titulo, texto e imagem dos destaques DNA.',
    onde: 'Secao azul "DNA da empresa" na Home.',
    dicas: ['Foque em diferencial real.', 'Texto curto e objetivo.'],
    exemplo: ['Exemplo simples:', '', 'Titulo: Capilaridade para chegar mais longe', 'Texto: Estrutura robusta para entregas...', 'Imagem: /public/foto4.png'],
    bom: 'Destaque com beneficio claro.',
    ruim: 'Texto generico sem informacao pratica.',
    dev: 'Persistido em content.dnaSlides[].'
  },
  'feedback-content': {
    titulo: 'Cadastro de feedback',
    curto: 'Gerencia depoimentos da pagina de Servicos.',
    onde: '/servicos.html.',
    dicas: ['Nome/cargo/empresa reais.', 'Comentario com resultado concreto.'],
    exemplo: ['Exemplo simples:', '', 'Nome: Roberto Campos', 'Cargo: Diretor de Logistica', 'Comentario: Reduzimos custos em 35%...'],
    bom: 'Depoimento com prova de valor.',
    ruim: 'Comentario vago sem contexto.',
    dev: 'Persistido em content.feedbacks[].'
  },
  'sobre-hero': {
    titulo: 'Hero institucional do Sobre Nos',
    curto: 'Edita tag, titulo, subtitulo, imagem e numeros.',
    onde: '/sobre.html.',
    dicas: ['Titulo reforca autoridade.', 'Numeros devem ser reais e atualizados.'],
    exemplo: ['Exemplo simples:', '', 'Tag: Nossa Historia', 'Titulo: Mais de 35 anos conectando o Brasil', 'Numero: 1500+ | Pontos de coleta'],
    bom: 'Mensagem institucional confiavel.',
    ruim: 'Numeros sem base real.',
    dev: 'Persistido em site-texts.json (aboutHero* e aboutStat*).'
  },
  'contato-info': {
    titulo: 'Informacoes de contato',
    curto: 'Atualiza canais oficiais e CTA final da pagina.',
    onde: '/fale-conosco.html.',
    dicas: ['Telefone e email oficiais.', 'WhatsApp com URL completa.', 'Sempre revisar CTA.'],
    exemplo: ['Exemplo simples:', '', 'Telefone: 0800 591 4557', 'Email: gerente.financeiro@rodogarcia.com.br', 'CTA: Solicitar Cotacao -> /cotacao.html'],
    bom: 'Canais validos e claros.',
    ruim: 'Contato desatualizado.',
    dev: 'Persistido em site-texts.json (contact*).'
  },
  'popup-configuracao-geral': {
    titulo: 'Configuracao do Exit Intent Popup',
    curto: 'Define texto, regras de exibicao e frequencia do popup.',
    onde: 'Site publico + painel Exit Popup.',
    dicas: ['Use delay minimo.', 'Use cooldown para evitar spam.'],
    exemplo: ['Exemplo simples:', '', 'Titulo: Antes de sair...', 'Delay: 10s', 'Cooldown: 24h', 'Maximo por sessao: 1'],
    bom: 'Popup objetivo e nao invasivo.',
    ruim: 'Popup sem controle de frequencia.',
    dev: 'Persistido em /api/popup-config.'
  },
  'popup-analise-conversao': {
    titulo: 'Analise de conversao do popup',
    curto: 'Mostra desempenho entre exibicoes e envios.',
    onde: 'Dashboard e pagina Exit Popup.',
    dicas: ['Conversao = enviados / exibidos.', 'Fechamento alto pede ajuste de copy.'],
    exemplo: ['Exemplo simples:', '', 'Exibido: 200', 'Enviado: 18', 'Conversao: 9,00%'],
    bom: 'Melhorar conversao com testes de texto.',
    ruim: 'Muitos exibidos e quase nenhum envio.',
    dev: 'Fonte: /api/popup-events e /api/leads.'
  },
  'popup-top-paginas': {
    titulo: 'Top paginas do Exit Popup',
    curto: 'Lista paginas com mais eventos do popup.',
    onde: 'Dashboard e pagina Exit Popup.',
    dicas: ['Priorize paginas com maior volume.', 'Cruze com taxa de conversao.'],
    exemplo: ['Exemplo simples:', '', '/ -> 120 eventos', '/servicos.html -> 74 eventos'],
    bom: 'Otimizar pagina com mais volume.',
    ruim: 'Ignorar pagina principal.',
    dev: 'Agrupamento por pagePath no resumo de popup.'
  },
  'dashboard-origem-destino': {
    titulo: 'Origem e destino dos dados',
    curto: 'Explica de onde os dados vem e onde aparecem no site.',
    onde: 'Dashboard.',
    dicas: ['Origem: APIs/admin.', 'Destino: secoes publicas.'],
    exemplo: ['Exemplo simples:', '', 'Edita no CMS -> salva em API -> aparece no site publico.'],
    bom: 'Editar sabendo impacto final.',
    ruim: 'Salvar sem validar no site.',
    dev: 'Fluxo admin -> /api/public/content -> frontend.'
  },
  'dashboard-origem-dados-destino-dados': {
    titulo: 'Origem dos dados e destino dos dados',
    curto: 'Mostra de onde cada numero do painel vem e para onde ele vai no site.',
    onde: 'Dashboard.',
    dicas: ['Origem: APIs internas do CMS.', 'Destino: secoes publicas do site.'],
    exemplo: ['Exemplo simples:', '', 'Slides ativos -> vem de /api/admin/content', 'Imagens -> vem de /api/developer/imagens', 'Popup -> vem de /api/popup-events e /api/leads', 'Destino final -> Home, Servicos, Sobre, Contato e Exit Popup'],
    bom: 'Entender a origem antes de editar e validar o destino no site.',
    ruim: 'Alterar dados sem saber qual secao sera impactada.',
    dev: 'Consolidado no navigation.js com dados de APIs autenticadas.'
  },
  'dashboard-saude-conteudo': {
    titulo: 'Saude do conteudo',
    curto: 'Mostra quantidade de itens ativos por modulo.',
    onde: 'Dashboard.',
    dicas: ['Ativo = publicado.', 'Inativo = rascunho operacional.'],
    exemplo: ['Exemplo simples:', '', 'Hero ativos: 4', 'Feedbacks ativos: 3'],
    bom: 'Publicacao ativa consistente.',
    ruim: 'Conteudo chave sem item ativo.',
    dev: 'Calculado em navigation.js.'
  },
  'dashboard-cobertura-modulo': {
    titulo: 'Cobertura por modulo',
    curto: 'Barra P indica percentual de campos obrigatorios preenchidos.',
    onde: 'Dashboard.',
    dicas: ['Use como checklist de publicacao.', 'Acompanhe cobertura geral.'],
    exemplo: ['Exemplo simples:', '', 'Home 100%', 'Servicos 67%', 'Cobertura geral = media dos modulos'],
    bom: 'Cobertura alta antes de publicar.',
    ruim: 'Cobertura baixa em modulo critico.',
    dev: 'Calculo por regras de preenchimento no frontend.'
  },
  'dashboard-insights-operacionais': {
    titulo: 'Insights operacionais',
    curto: 'Indicadores rapidos para decisao diaria do time.',
    onde: 'Dashboard.',
    dicas: ['Use taxa de publicacao para priorizar ajuste.', 'Monitore uploads de imagem.'],
    exemplo: ['Exemplo simples:', '', 'Taxa de publicacao: 94%', 'Imagens de upload: 12'],
    bom: 'Numero vira acao pratica.',
    ruim: 'Numero sem decisao.',
    dev: 'Consolidado apos leitura das APIs internas.'
  },
  'dashboard-sites-operacionais': {
    titulo: 'Sites operacionais',
    curto: 'Atalhos rapidos para editar e validar no site.',
    onde: 'Dashboard.',
    dicas: ['Sempre revisar no site publico apos salvar.', 'Use atalhos para reduzir erro manual.'],
    exemplo: ['Exemplo simples:', '', '1) Edita no Developer', '2) Abre / para validar', '3) Ajusta se necessario'],
    bom: 'Fluxo curto de edicao e validacao.',
    ruim: 'Editar sem revisar resultado final.',
    dev: 'Links estaticos no template.'
  },
  'dashboard-analise-exit-popup': {
    titulo: 'Analise Exit Popup',
    curto: 'Mede como o popup performa em exibicao e conversao.',
    onde: 'Dashboard.',
    dicas: ['Observe exibido, fechado e enviado juntos.', 'Ajuste texto quando conversao cair.'],
    exemplo: ['Exemplo simples:', '', 'Exibido: 300', 'Fechado: 210', 'Enviado: 24', 'Conversao: 8,00%'],
    bom: 'Melhora progressiva de conversao.',
    ruim: 'Eventos sem leads.',
    dev: 'Dados de /api/popup-events + /api/leads.'
  },
  'dashboard-top-paginas-exit-popup': {
    titulo: 'Top paginas do Exit Popup',
    curto: 'Mostra quais paginas mais acionam o popup.',
    onde: 'Dashboard.',
    dicas: ['Atue primeiro nas paginas com maior volume.'],
    exemplo: ['Exemplo simples:', '', '/: 120 eventos', '/servicos.html: 80 eventos'],
    bom: 'Priorizar pagina com maior impacto.',
    ruim: 'Otimizar pagina errada.',
    dev: 'Lista topPages do resumo de analytics do popup.'
  },
  'analytics-endpoint-dados': {
    titulo: 'Endpoint de dados',
    curto: 'Mostra para onde os dados de analytics sao enviados e lidos.',
    onde: 'Pagina Analytics.',
    dicas: ['Event = eventos.', 'Session = sessoes.', 'Stats = painel consolidado.'],
    exemplo: ['Exemplo simples:', '', 'click -> POST /api/analytics/event', 'session_start -> POST /api/analytics/session', 'dashboard -> GET /api/analytics/stats?days=30'],
    bom: 'Endpoint certo para cada tipo.',
    ruim: 'Enviar payload para rota errada.',
    dev: 'Rotas no server.js.'
  },
  'analytics-rastreamento-paginas': {
    titulo: 'Rastreamento de paginas',
    curto: 'Mostra paginas mais acessadas no periodo.',
    onde: 'Pagina Analytics.',
    dicas: ['Priorize pagina com maior trafego.', 'Compare visita e conversao.'],
    exemplo: ['Exemplo simples:', '', 'Home: 500 visitas', 'Servicos: 320 visitas'],
    bom: 'Prioridade guiada por trafego.',
    ruim: 'Ignorar pagina de alto volume.',
    dev: 'Baseado em eventos page_view.'
  },
  'analytics-heatmap-engajamento': {
    titulo: 'Heatmap e engajamento',
    curto: 'Resume scroll medio e areas mais clicadas.',
    onde: 'Pagina Analytics.',
    dicas: ['Scroll baixo pode indicar perda de interesse.', 'Clique forte valida CTA.'],
    exemplo: ['Exemplo simples:', '', 'Scroll medio: 63%', 'Area mais clicada: botao Solicitar Cotacao'],
    bom: 'Ajuste de UX com dado real.',
    ruim: 'Ignorar area sem clique.',
    dev: 'Eventos click e scroll do tracking proprio.'
  },
  'analytics-conversoes': {
    titulo: 'Conversoes',
    curto: 'Mede acoes importantes do usuario.',
    onde: 'Pagina Analytics.',
    dicas: ['Acompanhe formulario, download e lead.', 'Analise tendencia semanal.'],
    exemplo: ['Exemplo simples:', '', 'Formularios: 32', 'Downloads: 14', 'Leads popup: 9'],
    bom: 'Conversao com tendencia de alta.',
    ruim: 'Conversao estagnada sem ajuste.',
    dev: 'Agrupado por eventos de conversao.'
  },
  'analytics-integracao-eventos': {
    titulo: 'Integracao de eventos',
    curto: 'Lista tipos de eventos coletados no site.',
    onde: 'Pagina Analytics.',
    dicas: ['Padronize nomes de eventos.', 'Evite duplicidade de nomenclatura.'],
    exemplo: ['Exemplo simples:', '', 'page_view, click, scroll, cta_click, form_submit, popup_open'],
    bom: 'Taxonomia de eventos limpa.',
    ruim: 'Eventos com nome inconsistente.',
    dev: 'Validados em ANALYTICS_EVENT_NAMES.'
  },
  'analytics-tabela-eventos': {
    titulo: 'Tabela de eventos',
    curto: 'Mostra eventos recentes para auditoria rapida.',
    onde: 'Pagina Analytics.',
    dicas: ['Filtre por periodo.', 'Confira pagina e timestamp.'],
    exemplo: ['Exemplo simples:', '', 'Evento: cta_click', 'Pagina: /servicos.html', 'Data: 05/03/2026 12:20'],
    bom: 'Identificar padrao de comportamento.',
    ruim: 'Ler evento isolado sem contexto.',
    dev: 'Dados vindos de /api/analytics/stats.'
  },
  'analytics-performance-tecnica': {
    titulo: 'Performance tecnica',
    curto: 'Monitora velocidade e qualidade tecnica de paginas.',
    onde: 'Pagina Analytics.',
    dicas: ['Ataque score baixo primeiro.', 'Reduza peso de imagens/scripts.'],
    exemplo: ['Exemplo simples:', '', '/: score 88', '/servicos.html: score 74'],
    bom: 'Plano de melhoria por pagina.',
    ruim: 'Ignorar queda continua de score.',
    dev: 'Relatorio em /api/analytics/performance.'
  },
  'analytics-seo-sitemap': {
    titulo: 'SEO e sitemap',
    curto: 'Verifica base de indexacao e status de sitemap.',
    onde: 'Pagina Analytics.',
    dicas: ['Sitemap deve estar acessivel.', 'URL base precisa estar correta.'],
    exemplo: ['Exemplo simples:', '', 'Sitemap: /sitemap.xml -> OK', 'Property Search Console -> configurada'],
    bom: 'Sitemap valido e atualizado.',
    ruim: 'Sitemap quebrado.',
    dev: 'Relatorio em /api/analytics/seo.'
  },
  'analytics-configuracao': {
    titulo: 'Configuracao de Analytics',
    curto: 'Define coleta, providers e LGPD.',
    onde: 'Formulario Analytics.',
    dicas: [
      'Ative so os providers que a equipe realmente usa.',
      'Salve e valide eventos na tabela antes de considerar concluido.',
      'Sempre revise consentimento LGPD antes de publicar scripts.'
    ],
    exemplo: [
      'Configuracao inicial recomendada',
      '',
      'Passo 1: URL base = https://rodogarcia.com.br',
      'Passo 2: Banner LGPD = ativo',
      'Passo 3: Tracking proprio = ativo',
      'Passo 4: GA4 = ativo (Measurement ID preenchido)',
      'Passo 5: Clarity = ativo (Project ID preenchido)',
      'Passo 6: Salvar configuracao de analytics',
      'Passo 7: Atualizar metricas agora',
      'Passo 8: Conferir se apareceram eventos em "Tabela de eventos"'
    ],
    bom: 'Configuracao enxuta e rastreavel.',
    ruim: 'Ativar ferramentas sem estrategia.',
    dev: 'Persistido em data/analytics-config.json.'
  },
  'analytics-lgpd': {
    titulo: 'LGPD em linguagem simples',
    curto: 'Define consentimento e limites de coleta.',
    onde: 'Bloco LGPD do Analytics.',
    dicas: [
      'Usuario escolhe quais categorias pode liberar.',
      'Nao colete dado sensivel sem necessidade real.',
      'Aumente versao de consentimento quando mudar a politica.'
    ],
    exemplo: [
      'Cenario de conformidade basica',
      '',
      'Necessarios: sempre ativos',
      'Analytics: so carrega apos consentimento',
      'Marketing: so carrega apos consentimento',
      'Performance: opcional por consentimento',
      'Versao de consentimento: 2 (quando houver mudanca legal)'
    ],
    bom: 'Coleta alinhada ao consentimento.',
    ruim: 'Script de marketing sem permissao.',
    dev: 'Controle via consent-manager e config de analytics.'
  },
  'analytics-consent-controls': {
    titulo: 'Controles de consentimento e tracking',
    curto: 'Define o que pode coletar e quando pode carregar scripts.',
    onde: 'Bloco de checkboxes de consentimento no formulario Analytics.',
    dicas: [
      'Se o banner estiver desligado, valide se isso esta alinhado com a politica interna.',
      'Marcar categoria por padrao aumenta coleta, mas exige criterio legal.'
    ],
    exemplo: [
      'Exemplo de operacao segura',
      '',
      'Banner ativo: sim',
      'Tracking proprio ativo: sim',
      'Analytics padrao: nao',
      'Marketing padrao: nao',
      'Performance padrao: nao'
    ],
    bom: 'Consentimento claro e rastreavel.',
    ruim: 'Categorias sensiveis ativadas por padrao sem justificativa.',
    dev: 'Campos consent.* e tracking.* no analytics-config.json.'
  },
  'analytics-provider-ga4': {
    titulo: 'Google Analytics 4 (GA4)',
    curto: 'Envia eventos do site para o Google Analytics 4.',
    onde: 'Campos "GA4 Measurement ID" e "Google Analytics 4 ativo".',
    dicas: [
      'Sem Measurement ID valido, o GA4 nao recebe dados.',
      'Ative so depois de validar consentimento LGPD.'
    ],
    exemplo: [
      'Exemplo de preenchimento',
      '',
      'GA4 Measurement ID: G-AB12CDE34F',
      'Google Analytics 4 ativo: marcado',
      'Resultado esperado: page_view e eventos aparecem no painel GA4.'
    ],
    bom: 'ID correto e coleta validada.',
    ruim: 'GA4 ativo com ID vazio.',
    dev: 'providers.ga4.enabled + providers.ga4.measurementId.'
  },
  'analytics-provider-matomo': {
    titulo: 'Matomo',
    curto: 'Configura envio de dados para ambiente Matomo.',
    onde: 'Campos "Matomo base URL", "Matomo site ID" e toggle ativo.',
    dicas: [
      'A URL deve apontar para instalacao Matomo valida.',
      'Site ID deve ser o mesmo cadastrado no painel Matomo.'
    ],
    exemplo: [
      'Exemplo de preenchimento',
      '',
      'Matomo base URL: https://analytics.suaempresa.com/',
      'Matomo site ID: 3',
      'Matomo ativo: marcado'
    ],
    bom: 'URL e site ID consistentes.',
    ruim: 'Base URL invalida ou site ID incorreto.',
    dev: 'providers.matomo.baseUrl + providers.matomo.siteId + enabled.'
  },
  'analytics-provider-plausible': {
    titulo: 'Plausible',
    curto: 'Configura envio de eventos para o Plausible.',
    onde: 'Campos domain/script URL e toggle Plausible ativo.',
    dicas: [
      'Domain deve bater com dominio do site monitorado.',
      'Script URL normalmente pode ficar no padrao.'
    ],
    exemplo: [
      'Exemplo de preenchimento',
      '',
      'Domain: rodogarcia.com.br',
      'Script URL: https://plausible.io/js/script.js',
      'Plausible ativo: marcado'
    ],
    bom: 'Dominio correto e script padrao valido.',
    ruim: 'Dominio errado sem correspondencia com o site.',
    dev: 'providers.plausible.*'
  },
  'analytics-provider-posthog': {
    titulo: 'PostHog',
    curto: 'Integra analytics comportamental com PostHog.',
    onde: 'Campos API key, host e toggle PostHog ativo.',
    dicas: [
      'Host deve respeitar regiao do projeto (US/EU).',
      'API key deve ser de projeto correto.'
    ],
    exemplo: [
      'Exemplo de preenchimento',
      '',
      'API key: phc_xxxxxxx',
      'Host: https://us.i.posthog.com',
      'PostHog ativo: marcado'
    ],
    bom: 'Chave e host da mesma regiao/projeto.',
    ruim: 'Chave de um projeto com host de outro.',
    dev: 'providers.posthog.apiKey + apiHost + enabled.'
  },
  'analytics-provider-heatmap': {
    titulo: 'Heatmap e gravacao (Clarity/Hotjar/CrazyEgg/FullStory)',
    curto: 'Ativa ferramentas de comportamento visual do usuario.',
    onde: 'Blocos de Clarity, Hotjar, CrazyEgg e FullStory.',
    dicas: [
      'Ative apenas as ferramentas que o time usa de fato.',
      'Validar impacto em performance apos ativacao.'
    ],
    exemplo: [
      'Exemplo de estrategia',
      '',
      'Clarity: ativo (project ID preenchido)',
      'Hotjar: inativo',
      'CrazyEgg: inativo',
      'FullStory: inativo'
    ],
    bom: 'Poucas ferramentas bem validadas.',
    ruim: 'Ativar todas sem plano de analise.',
    dev: 'providers.clarity/hotjar/crazyegg/fullstory.'
  },
  'analytics-provider-observability': {
    titulo: 'Monitoramento de erro (Sentry/LogRocket)',
    curto: 'Rastreia erros e comportamento tecnico da aplicacao.',
    onde: 'Campos Sentry DSN, LogRocket app ID e toggles.',
    dicas: [
      'Sentry DSN precisa estar valido e completo.',
      'Use LogRocket quando houver time para analisar sessoes.'
    ],
    exemplo: [
      'Exemplo de operacao',
      '',
      'Sentry DSN: https://abc@o0.ingest.sentry.io/123',
      'Sentry ativo: marcado',
      'LogRocket ativo: desmarcado (fase inicial)'
    ],
    bom: 'Monitoramento de erro ativo e revisado.',
    ruim: 'Erro em producao sem nenhum monitoramento.',
    dev: 'providers.sentry.* e providers.logrocket.*'
  },
  'analytics-performance-config': {
    titulo: 'Performance tecnica (PageSpeed/Lighthouse)',
    curto: 'Define como o painel consulta performance das paginas.',
    onde: 'Campos PageSpeed API Key, Lighthouse e paginas monitoradas.',
    dicas: [
      'Monitore primeiro paginas com maior trafego.',
      'Lista de paginas deve ser separada por virgula e com caminho valido.'
    ],
    exemplo: [
      'Exemplo de configuracao',
      '',
      'Pagespeed API key: preenchida',
      'Lighthouse backend: ativo',
      'Paginas monitoradas: /,/servicos.html,/sobre.html'
    ],
    bom: 'Monitoramento focado nas paginas principais.',
    ruim: 'Monitorar paginas irrelevantes e ignorar home.',
    dev: 'performance.pagespeedApiKey/enableLighthouse/monitoredPages.'
  },
  'analytics-seo-config': {
    titulo: 'SEO e Search Console',
    curto: 'Configura monitoramento de sitemap e propriedade do Search Console.',
    onde: 'Campos URL do sitemap, Search Console habilitado e Property URL.',
    dicas: [
      'Sitemap deve responder 200 e conter URLs validas.',
      'Property URL precisa bater exatamente com a propriedade do Search Console.'
    ],
    exemplo: [
      'Exemplo de configuracao',
      '',
      'URL do sitemap: /sitemap.xml',
      'Search Console habilitado: marcado',
      'Property URL: https://rodogarcia.com.br/'
    ],
    bom: 'Sitemap valido + propriedade correta.',
    ruim: 'Property URL divergente da conta Search Console.',
    dev: 'seo.sitemapUrl + seo.enableSearchConsole + seo.propertyUrl.'
  }
};

const MAPA_CAMPOS = [];

const estadoPopover = { el: null, ativo: null, travado: false };
const HELP_BOUND_MARKER = '__helpBound';

function encontrarRotulo(campo, container) {
  const proximo = campo.closest('label');
  if (proximo) return proximo;
  if (!campo.id) return null;
  return container.querySelector(`label[for="${campo.id}"]`);
}

function textoHint(ajuda) {
  return ajuda.onde ? `${ajuda.curto} Onde aparece: ${ajuda.onde}` : ajuda.curto;
}

function textoExemplo(ajuda) {
  const linhasBrutas = Array.isArray(ajuda.exemplo) ? ajuda.exemplo : [];
  const linhasExemplo = linhasBrutas
    .map((linha) => String(linha || '').trimEnd())
    .filter((linha) => linha.trim().toLowerCase() !== 'exemplo simples:');

  const dicas = Array.isArray(ajuda.dicas) ? ajuda.dicas : [];

  return [
    `O que e`,
    `${ajuda.curto || 'Campo de configuracao do CMS.'}`,
    '',
    'Para que serve',
    ajuda.onde ? `Ajusta o conteudo que aparece em: ${ajuda.onde}` : 'Ajusta o conteudo de uma area do painel/site.',
    '',
    'Explicacao rapida',
    ...(dicas.length > 0 ? dicas.map((dica) => `- ${dica}`) : ['- Preencha com dados reais e valide no site.']),
    '',
    'Como usar:',
    '1. Preencha os campos no painel.',
    '2. Clique em "Salvar".',
    '3. Atualize a pagina publica e valide.',
    '',
    'Exemplo preenchido:',
    ...(linhasExemplo.length > 0 ? linhasExemplo : ['(Preencha os campos com dados reais do projeto.)']),
    '',
    'Resultado esperado:',
    ajuda.onde ? `- Aparece em: ${ajuda.onde}` : '- Aparece na secao vinculada desse modulo.',
    ajuda.dev ? `- Referencia tecnica: ${ajuda.dev}` : ''
  ].join('\n');
}

function inserirApos(base, novo) {
  if (!base || !base.parentNode) return;
  if (base.nextSibling) base.parentNode.insertBefore(novo, base.nextSibling);
  else base.parentNode.appendChild(novo);
}

function manterApenasSummary(detalhes) {
  const summary = detalhes.querySelector('summary');
  if (!summary) {
    detalhes.innerHTML = '<summary>Ver exemplo simples</summary>';
    return detalhes.querySelector('summary');
  }
  Array.from(detalhes.childNodes).forEach((node) => {
    if (node !== summary) {
      detalhes.removeChild(node);
    }
  });
  return summary;
}

function garantirIcone(rotulo, helpId, titulo) {
  if (rotulo.querySelector(`.help-icon[data-help-id="${helpId}"]`)) return;
  const icone = document.createElement('button');
  icone.type = 'button';
  icone.className = 'help-icon help-icon--button';
  icone.dataset.helpId = helpId;
  icone.setAttribute('aria-label', `Ajuda: ${titulo}`);
  icone.textContent = '?';

  const alvoTitulo = rotulo.classList.contains('form-field') ? rotulo.querySelector(':scope > span') : null;
  if (alvoTitulo) {
    alvoTitulo.classList.add('help-label');
    alvoTitulo.append(' ', icone);
    return;
  }
  rotulo.append(' ', icone);
}

function garantirHint(rotulo, helpId, ajuda) {
  let hint = rotulo.querySelector(':scope > .field-hint');
  if (!hint && rotulo.classList.contains('form-field')) {
    hint = document.createElement('small');
    hint.className = 'field-hint';
    rotulo.appendChild(hint);
  }
  if (hint) {
    hint.dataset.helpShortId = helpId;
    hint.textContent = textoHint(ajuda);
    return hint;
  }
  return null;
}

function garantirDetalhes(rotulo, helpId, ajuda) {
  const pai = rotulo.parentElement;
  if (!pai) return;
  let detalhes = pai.querySelector(`details.help-details[data-help-example-id="${helpId}"]`);
  if (!detalhes) {
    detalhes = document.createElement('details');
    detalhes.className = 'help-details help-details--auto';
    detalhes.dataset.helpExampleId = helpId;
    detalhes.innerHTML = '<summary>Ver exemplo simples</summary>';
    inserirApos(rotulo, detalhes);
  }
  manterApenasSummary(detalhes);
  let conteudo = detalhes.querySelector('.help-example-content');
  if (!conteudo) {
    conteudo = document.createElement('pre');
    conteudo.className = 'help-example-content';
    detalhes.appendChild(conteudo);
  }
  conteudo.textContent = textoExemplo(ajuda);
}

function preencherExemplosDeclarativos(container) {
  container.querySelectorAll('details.help-details[data-help-example-id]').forEach((detalhes) => {
    const helpId = String(detalhes.dataset.helpExampleId || '').trim();
    const ajuda = AJUDAS[helpId];
    if (!ajuda) return;
    manterApenasSummary(detalhes);
    let conteudo = detalhes.querySelector('.help-example-content');
    if (!conteudo) {
      conteudo = document.createElement('pre');
      conteudo.className = 'help-example-content';
      detalhes.appendChild(conteudo);
    }
    conteudo.textContent = textoExemplo(ajuda);
  });
}

function garantirPopover() {
  if (estadoPopover.el) return estadoPopover.el;
  const el = document.createElement('aside');
  el.className = 'help-popover';
  el.hidden = true;
  el.innerHTML = `
    <button type="button" class="help-popover__close" aria-label="Fechar ajuda">&times;</button>
    <h4 class="help-popover__title"></h4>
    <p class="help-popover__short"></p>
    <p class="help-popover__where"></p>
    <ul class="help-popover__tips"></ul>
    <p class="help-popover__good"></p>
    <p class="help-popover__bad"></p>
    <p class="help-popover__dev"></p>
  `;
  document.body.appendChild(el);
  estadoPopover.el = el;

  const fechar = el.querySelector('.help-popover__close');
  if (fechar) {
    fechar.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      esconderPopover();
    });
  }

  document.addEventListener('pointerdown', (ev) => {
    const alvo = ev.target;
    if (!(alvo instanceof Element)) return;
    if (el.hidden) return;
    if (alvo.closest('.help-popover') || alvo.closest('.help-icon')) return;
    esconderPopover();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') esconderPopover();
  });
  window.addEventListener('scroll', () => {
    if (!el.hidden) esconderPopover();
  }, { passive: true });
  return el;
}

function esconderPopover() {
  const pop = garantirPopover();
  pop.hidden = true;
  if (estadoPopover.ativo) {
    estadoPopover.ativo.classList.remove('is-open');
  }
  estadoPopover.ativo = null;
  estadoPopover.travado = false;
}

function preencherPopover(ajuda) {
  const pop = garantirPopover();
  pop.querySelector('.help-popover__title').textContent = ajuda.titulo || 'Ajuda';
  pop.querySelector('.help-popover__short').textContent = ajuda.curto || '';
  pop.querySelector('.help-popover__where').textContent = ajuda.onde ? `Onde aparece: ${ajuda.onde}` : '';
  const lista = pop.querySelector('.help-popover__tips');
  lista.replaceChildren();
  (ajuda.dicas || []).forEach((dica) => {
    const li = document.createElement('li');
    li.textContent = dica;
    lista.appendChild(li);
  });
  pop.querySelector('.help-popover__good').textContent = ajuda.bom ? `Exemplo bom: ${ajuda.bom}` : '';
  pop.querySelector('.help-popover__bad').textContent = ajuda.ruim ? `Exemplo ruim: ${ajuda.ruim}` : '';
  pop.querySelector('.help-popover__dev').textContent = ajuda.dev ? `Para dev: ${ajuda.dev}` : '';
}

function posicionarPopover(icone) {
  const pop = garantirPopover();
  const rect = icone.getBoundingClientRect();
  const largura = pop.offsetWidth || 320;
  const altura = pop.offsetHeight || 260;
  const margem = 10;
  const limite = window.scrollX + window.innerWidth;

  let left = window.scrollX + rect.left + rect.width / 2 - largura / 2;
  left = Math.max(window.scrollX + margem, Math.min(left, limite - largura - margem));
  const topAbaixo = window.scrollY + rect.bottom + 8;
  const topAcima = window.scrollY + rect.top - altura - 8;
  const top = topAcima > window.scrollY + margem ? topAcima : topAbaixo;

  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

function ajudaPorIcone(icone) {
  const helpId = String(icone.dataset.helpId || '').trim();
  if (helpId && AJUDAS[helpId]) return AJUDAS[helpId];
  if (helpId) {
    const tituloFallback = helpId
      .split('-')
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
    return {
      titulo: tituloFallback || 'Ajuda rapida',
      curto: 'Esta ajuda ainda nao foi cadastrada com detalhes.',
      onde: 'Painel Developer.',
      dicas: ['Use esse campo normalmente e valide no site apos salvar.'],
      bom: 'Campo preenchido e validado na pagina publica.',
      ruim: 'Salvar sem revisar o resultado final.',
      dev: `Adicionar chave "${helpId}" no AJUDAS do help-system.js.`
    };
  }
  const fallback = String(icone.dataset.helpFallback || icone.getAttribute('title') || '').trim();
  if (!fallback) return null;
  return { titulo: 'Ajuda rapida', curto: fallback, onde: '', dicas: [], bom: '', ruim: '', dev: '' };
}

function mostrarPopover(icone, travar) {
  const ajuda = ajudaPorIcone(icone);
  if (!ajuda) return;
  const pop = garantirPopover();
  if (estadoPopover.ativo && estadoPopover.ativo !== icone) {
    estadoPopover.ativo.classList.remove('is-open');
  }
  preencherPopover(ajuda);
  pop.hidden = false;
  estadoPopover.ativo = icone;
  estadoPopover.travado = Boolean(travar);
  icone.classList.add('is-open');
  posicionarPopover(icone);
}

function vincularIcone(icone) {
  if (icone[HELP_BOUND_MARKER]) return;
  icone[HELP_BOUND_MARKER] = true;
  icone.dataset.helpBound = '1';
  const title = icone.getAttribute('title');
  if (title) {
    icone.dataset.helpFallback = title;
    icone.removeAttribute('title');
  }
  if (icone.tagName !== 'BUTTON') {
    icone.setAttribute('role', 'button');
    icone.setAttribute('tabindex', '0');
  }
  icone.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const mesmo = estadoPopover.ativo === icone && estadoPopover.travado;
    if (mesmo) esconderPopover();
    else mostrarPopover(icone, true);
  });
  icone.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    mostrarPopover(icone, true);
  });
}

function aplicarAjudaCampos(container) {
  MAPA_CAMPOS.forEach((item) => {
    const ajuda = AJUDAS[item.helpId];
    if (!ajuda) return;
    item.selectors.forEach((selector) => {
      container.querySelectorAll(selector).forEach((campo) => {
        const rotulo = encontrarRotulo(campo, container);
        if (!rotulo) return;
        garantirIcone(rotulo, item.helpId, ajuda.titulo);
        garantirHint(rotulo, item.helpId, ajuda);
        garantirDetalhes(rotulo, item.helpId, ajuda);
      });
    });
  });
}

export function aplicarSistemaAjuda(container = document) {
  aplicarAjudaCampos(container);
  preencherExemplosDeclarativos(container);
  container.querySelectorAll('.help-icon').forEach(vincularIcone);
}

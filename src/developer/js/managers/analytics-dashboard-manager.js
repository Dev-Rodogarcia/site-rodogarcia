/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/analytics-dashboard-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Controla pagina de analytics no dashboard developer (metricas, SEO/performance e configuracao).

Responsabilidades:
- Carregar dados consolidados de analytics, performance e SEO por APIs autenticadas.
- Renderizar metricas, tabela de eventos, listas de top paginas e conversoes.
- Permitir editar e salvar configuracao de providers, LGPD e tracking.

Integracoes:
- Dependencias: /src/js/shared/api.js
- Endpoints/rotas: /api/analytics/stats, /api/analytics/config/admin, /api/analytics/config, /api/analytics/performance, /api/analytics/seo
- Classes/seletores/chaves: #analytics-config-form, #ana-days-input, #analytics-refresh-btn, #analytics-open-cookie-test-btn

Entradas e saidas:
- Entradas: respostas das APIs e submit do formulario de configuracao.
- Saidas  : atualizacao do DOM e persistencia de configuracao no backend.

Elementos tecnicos: iniciarGerenciadorAnalytics, carregarPainelAnalytics, coletarPayloadConfig
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';

function textoSeguro(valor, padrao = '-') {
  if (valor == null) return padrao;
  const texto = String(valor).trim();
  return texto || padrao;
}

function numeroSeguro(valor, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function formatarDataHora(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
}

function definirTexto(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(valor);
}

function limparLista(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  el.replaceChildren();
  return el;
}

function criarItemLista(label, valor) {
  const li = document.createElement('li');
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  span.textContent = label;
  strong.textContent = String(valor);
  li.append(span, strong);
  return li;
}

function definirCampo(form, nome, valor) {
  const campo = form.elements.namedItem(nome);
  if (!campo) return;
  campo.value = valor == null ? '' : String(valor);
}

function definirCheck(form, nome, valor) {
  const campo = form.elements.namedItem(nome);
  if (!campo) return;
  campo.checked = Boolean(valor);
}

function sanitizarTexto(valor, maximo = 220) {
  return String(valor || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo);
}

function sanitizarRota(valor) {
  const texto = sanitizarTexto(valor, 240);
  if (!texto) return '';
  if (texto.startsWith('http://') || texto.startsWith('https://')) return texto;
  if (texto.startsWith('/')) return texto;
  return '';
}

function parseListaRotas(valor) {
  return String(valor || '')
    .split(',')
    .map((item) => sanitizarRota(item))
    .filter(Boolean)
    .slice(0, 10);
}

function parseScrollMilestones(valor) {
  const itens = String(valor || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num) && num >= 1 && num <= 100);
  const unicos = Array.from(new Set(itens)).sort((a, b) => a - b);
  return unicos.length > 0 ? unicos : [25, 50, 75, 100];
}

function mensagemErroAmigavel(erro, fallback) {
  if (!erro) return fallback;
  if (erro.status === 401) return 'Sua sessao expirou. Faca login novamente.';
  if (erro.status === 403) return 'Acao bloqueada por seguranca. Atualize a pagina e tente de novo.';
  if (erro.status === 404) return 'Endpoint de analytics nao encontrado. Verifique se o servidor foi reiniciado.';

  const mensagem = String(erro.message || '').trim().toLowerCase();
  if (mensagem.includes('endpoint') && mensagem.includes('nao encontrado')) {
    return 'Endpoint de analytics nao encontrado. Verifique se o servidor foi reiniciado.';
  }

  return fallback;
}

function preencherFormularioConfig(form, config) {
  const consent = config && config.consent ? config.consent : {};
  const providers = config && config.providers ? config.providers : {};
  const tracking = config && config.tracking ? config.tracking : {};
  const performance = config && config.performance ? config.performance : {};
  const seo = config && config.seo ? config.seo : {};

  definirCampo(form, 'siteUrl', config.siteUrl || '');
  definirCampo(form, 'consentVersion', consent.version || 1);
  definirCheck(form, 'bannerEnabled', consent.bannerEnabled !== false);
  definirCheck(form, 'consentAnalytics', consent.categories && consent.categories.analytics);
  definirCheck(form, 'consentMarketing', consent.categories && consent.categories.marketing);
  definirCheck(form, 'consentPerformance', consent.categories && consent.categories.performance);

  definirCheck(form, 'trackingEnabled', tracking.enabled !== false);
  definirCampo(form, 'heartbeatSeconds', tracking.heartbeatSeconds || 30);
  definirCampo(form, 'scrollMilestones', Array.isArray(tracking.scrollMilestones) ? tracking.scrollMilestones.join(',') : '25,50,75,100');

  definirCheck(form, 'ga4Enabled', providers.ga4 && providers.ga4.enabled);
  definirCampo(form, 'ga4MeasurementId', providers.ga4 && providers.ga4.measurementId);

  definirCheck(form, 'matomoEnabled', providers.matomo && providers.matomo.enabled);
  definirCampo(form, 'matomoBaseUrl', providers.matomo && providers.matomo.baseUrl);
  definirCampo(form, 'matomoSiteId', providers.matomo && providers.matomo.siteId);

  definirCheck(form, 'plausibleEnabled', providers.plausible && providers.plausible.enabled);
  definirCampo(form, 'plausibleDomain', providers.plausible && providers.plausible.domain);
  definirCampo(form, 'plausibleScriptUrl', providers.plausible && providers.plausible.scriptUrl);

  definirCheck(form, 'posthogEnabled', providers.posthog && providers.posthog.enabled);
  definirCampo(form, 'posthogApiKey', providers.posthog && providers.posthog.apiKey);
  definirCampo(form, 'posthogApiHost', providers.posthog && providers.posthog.apiHost);

  definirCheck(form, 'clarityEnabled', providers.clarity && providers.clarity.enabled);
  definirCampo(form, 'clarityProjectId', providers.clarity && providers.clarity.projectId);

  definirCheck(form, 'hotjarEnabled', providers.hotjar && providers.hotjar.enabled);
  definirCampo(form, 'hotjarSiteId', providers.hotjar && providers.hotjar.siteId);

  definirCheck(form, 'crazyeggEnabled', providers.crazyegg && providers.crazyegg.enabled);
  definirCampo(form, 'crazyeggAccountId', providers.crazyegg && providers.crazyegg.accountId);

  definirCheck(form, 'fullstoryEnabled', providers.fullstory && providers.fullstory.enabled);
  definirCampo(form, 'fullstoryOrgId', providers.fullstory && providers.fullstory.orgId);

  definirCheck(form, 'sentryEnabled', providers.sentry && providers.sentry.enabled);
  definirCampo(form, 'sentryDsn', providers.sentry && providers.sentry.dsn);

  definirCheck(form, 'logrocketEnabled', providers.logrocket && providers.logrocket.enabled);
  definirCampo(form, 'logrocketAppId', providers.logrocket && providers.logrocket.appId);

  definirCampo(form, 'pagespeedApiKey', performance.pagespeedApiKey || '');
  definirCheck(form, 'enableLighthouse', performance.enableLighthouse);
  definirCampo(form, 'monitoredPages', Array.isArray(performance.monitoredPages) ? performance.monitoredPages.join(',') : '/,/servicos.html,/sobre.html');

  definirCheck(form, 'enableSearchConsole', seo.enableSearchConsole);
  definirCampo(form, 'propertyUrl', seo.propertyUrl || '');
  definirCampo(form, 'sitemapUrl', seo.sitemapUrl || '/sitemap.xml');
}

function coletarPayloadConfig(form) {
  const data = new FormData(form);

  return {
    siteUrl: sanitizarRota(data.get('siteUrl')),
    consent: {
      bannerEnabled: data.get('bannerEnabled') === 'on',
      version: Math.max(1, Number(data.get('consentVersion')) || 1),
      categories: {
        analytics: data.get('consentAnalytics') === 'on',
        marketing: data.get('consentMarketing') === 'on',
        performance: data.get('consentPerformance') === 'on'
      }
    },
    tracking: {
      enabled: data.get('trackingEnabled') === 'on',
      heartbeatSeconds: Math.max(10, Math.min(300, Number(data.get('heartbeatSeconds')) || 30)),
      scrollMilestones: parseScrollMilestones(data.get('scrollMilestones'))
    },
    providers: {
      ga4: {
        enabled: data.get('ga4Enabled') === 'on',
        measurementId: sanitizarTexto(data.get('ga4MeasurementId'), 40)
      },
      matomo: {
        enabled: data.get('matomoEnabled') === 'on',
        baseUrl: sanitizarRota(data.get('matomoBaseUrl')),
        siteId: sanitizarTexto(data.get('matomoSiteId'), 24)
      },
      plausible: {
        enabled: data.get('plausibleEnabled') === 'on',
        domain: sanitizarTexto(data.get('plausibleDomain'), 120),
        scriptUrl: sanitizarRota(data.get('plausibleScriptUrl'))
      },
      posthog: {
        enabled: data.get('posthogEnabled') === 'on',
        apiKey: sanitizarTexto(data.get('posthogApiKey'), 220),
        apiHost: sanitizarRota(data.get('posthogApiHost'))
      },
      clarity: {
        enabled: data.get('clarityEnabled') === 'on',
        projectId: sanitizarTexto(data.get('clarityProjectId'), 40)
      },
      hotjar: {
        enabled: data.get('hotjarEnabled') === 'on',
        siteId: sanitizarTexto(data.get('hotjarSiteId'), 40)
      },
      crazyegg: {
        enabled: data.get('crazyeggEnabled') === 'on',
        accountId: sanitizarTexto(data.get('crazyeggAccountId'), 64)
      },
      fullstory: {
        enabled: data.get('fullstoryEnabled') === 'on',
        orgId: sanitizarTexto(data.get('fullstoryOrgId'), 64)
      },
      sentry: {
        enabled: data.get('sentryEnabled') === 'on',
        dsn: sanitizarTexto(data.get('sentryDsn'), 280)
      },
      logrocket: {
        enabled: data.get('logrocketEnabled') === 'on',
        appId: sanitizarTexto(data.get('logrocketAppId'), 80)
      }
    },
    performance: {
      pagespeedApiKey: sanitizarTexto(data.get('pagespeedApiKey'), 180),
      enableLighthouse: data.get('enableLighthouse') === 'on',
      monitoredPages: parseListaRotas(data.get('monitoredPages'))
    },
    seo: {
      enableSearchConsole: data.get('enableSearchConsole') === 'on',
      propertyUrl: sanitizarRota(data.get('propertyUrl')),
      sitemapUrl: sanitizarTexto(data.get('sitemapUrl'), 220)
    }
  };
}

function renderizarTopPaginas(topPages) {
  const lista = limparLista('ana-top-pages');
  if (!lista) return;

  if (!Array.isArray(topPages) || topPages.length === 0) {
    lista.appendChild(criarItemLista('Sem page_view no periodo', '0'));
    return;
  }

  topPages.slice(0, 10).forEach((item) => {
    lista.appendChild(criarItemLista(item.page || '/', numeroSeguro(item.total, 0)));
  });
}

function renderizarHeatmap(topClickAreas, avgScroll) {
  definirTexto('ana-heatmap-scroll', `${numeroSeguro(avgScroll, 0).toFixed(2)}%`);
  const lista = limparLista('ana-heatmap-clicks');
  if (!lista) return;

  if (!Array.isArray(topClickAreas) || topClickAreas.length === 0) {
    lista.appendChild(criarItemLista('Sem cliques rastreados', '0'));
    return;
  }

  topClickAreas.slice(0, 10).forEach((item) => {
    lista.appendChild(criarItemLista(item.area || 'sem-identificacao', numeroSeguro(item.total, 0)));
  });
}

function renderizarConversoes(conversions) {
  const conv = conversions && typeof conversions === 'object' ? conversions : {};
  definirTexto('ana-conv-forms', numeroSeguro(conv.forms, 0));
  definirTexto('ana-conv-downloads', numeroSeguro(conv.downloads, 0));
  definirTexto('ana-conv-leads', numeroSeguro(conv.leads, 0));
  definirTexto('ana-conv-popup-open', numeroSeguro(conv.popupOpen, 0));
  definirTexto('ana-conv-total', numeroSeguro(conv.total, 0));
  definirTexto('ana-metric-conversion', `${numeroSeguro(conv.conversionRate, 0).toFixed(2)}%`);
}

function renderizarContagemEventos(eventCounts) {
  const lista = limparLista('ana-event-counts');
  if (!lista) return;
  const entries = Object.entries(eventCounts || {}).sort((a, b) => Number(b[1]) - Number(a[1]));

  if (entries.length === 0) {
    lista.appendChild(criarItemLista('Sem eventos no periodo', '0'));
    return;
  }

  entries.slice(0, 12).forEach(([nome, total]) => {
    lista.appendChild(criarItemLista(nome, numeroSeguro(total, 0)));
  });
}

function renderizarTabelaEventos(eventsTable) {
  const corpo = document.getElementById('ana-events-table-body');
  if (!corpo) return;
  corpo.replaceChildren();

  if (!Array.isArray(eventsTable) || eventsTable.length === 0) {
    const linha = document.createElement('tr');
    linha.innerHTML = '<td colspan="4">Sem eventos para o periodo selecionado.</td>';
    corpo.appendChild(linha);
    return;
  }

  eventsTable.slice(0, 120).forEach((evento) => {
    const linha = document.createElement('tr');
    const colEvento = document.createElement('td');
    const colPagina = document.createElement('td');
    const colData = document.createElement('td');
    const colUser = document.createElement('td');
    colEvento.textContent = textoSeguro(evento.event, '-');
    colPagina.textContent = textoSeguro(evento.page, '/');
    colData.textContent = formatarDataHora(evento.timestamp);
    colUser.textContent = textoSeguro(evento.userId, 'anonimo');
    linha.append(colEvento, colPagina, colData, colUser);
    corpo.appendChild(linha);
  });
}

function renderizarPerformance(report) {
  const lista = limparLista('ana-performance-list');
  if (!lista) return;

  const pages = report && report.pagespeed && Array.isArray(report.pagespeed.pages)
    ? report.pagespeed.pages
    : [];

  if (pages.length === 0) {
    lista.appendChild(criarItemLista('PageSpeed', 'Sem dados'));
  } else {
    pages.forEach((item) => {
      const score = item.score == null ? 'n/d' : `${item.score}%`;
      const status = item.status === 'ok' ? score : `erro: ${textoSeguro(item.error, 80)}`;
      lista.appendChild(criarItemLista(`PageSpeed ${item.page || '/'}`, status));
    });
  }

  const lighthouse = report && report.lighthouse ? report.lighthouse : {};
  const lighthouseTexto = lighthouse.enabled
    ? lighthouse.status === 'ok'
      ? `${numeroSeguro(lighthouse.score, 0)}%`
      : `indisponivel (${textoSeguro(lighthouse.error, 80)})`
    : 'desativado';
  lista.appendChild(criarItemLista('Lighthouse local', lighthouseTexto));
}

function renderizarSeo(report) {
  const lista = limparLista('ana-seo-list');
  if (!lista) return;

  const sitemap = report && report.sitemap ? report.sitemap : {};
  const searchConsole = report && report.searchConsole ? report.searchConsole : {};

  lista.appendChild(criarItemLista('Sitemap URL', textoSeguro(sitemap.url, '-')));
  lista.appendChild(criarItemLista('Sitemap status', textoSeguro(sitemap.status, '-')));
  lista.appendChild(criarItemLista('URLs no sitemap', numeroSeguro(sitemap.totalUrls, 0)));
  lista.appendChild(criarItemLista('Search Console', searchConsole.configured ? 'configurado' : 'nao configurado'));
  if (Array.isArray(sitemap.issues) && sitemap.issues.length > 0) {
    sitemap.issues.slice(0, 3).forEach((item) => {
      lista.appendChild(criarItemLista('Alerta SEO', textoSeguro(item, '-')));
    });
  }
}

function renderizarResumo(statsPayload, periodDays) {
  const stats = statsPayload && statsPayload.stats ? statsPayload.stats : {};
  const metrics = stats.metrics && typeof stats.metrics === 'object' ? stats.metrics : {};
  const heatmap = stats.heatmap && typeof stats.heatmap === 'object' ? stats.heatmap : {};
  const conversions = stats.conversions && typeof stats.conversions === 'object' ? stats.conversions : {};

  definirTexto('ana-period-pill', `Periodo ${periodDays} dias`);
  definirTexto('ana-updated-at', `Atualizado em ${formatarDataHora(stats.generatedAt || new Date().toISOString())}`);
  definirTexto('ana-metric-visitors', numeroSeguro(metrics.visitors, 0));
  definirTexto('ana-metric-sessions', numeroSeguro(metrics.sessions, 0));
  definirTexto('ana-metric-bounce', `${numeroSeguro(metrics.bounceRate, 0).toFixed(2)}%`);
  definirTexto('ana-metric-time', numeroSeguro(metrics.avgTimeSeconds, 0));

  renderizarTopPaginas(stats.topPages || []);
  renderizarHeatmap(heatmap.topClickAreas || [], heatmap.avgScrollPercent || 0);
  renderizarConversoes(conversions);
  renderizarContagemEventos(stats.eventCounts || {});
  renderizarTabelaEventos(stats.eventsTable || []);
}

async function carregarPainelAnalytics(dias) {
  const periodDays = Math.max(1, Math.min(120, Number(dias) || 30));
  const [configPayload, statsPayload, performancePayload, seoPayload] = await Promise.all([
    requisicaoApi('/api/analytics/config/admin'),
    requisicaoApi(`/api/analytics/stats?days=${periodDays}`),
    requisicaoApi('/api/analytics/performance'),
    requisicaoApi('/api/analytics/seo')
  ]);

  renderizarResumo(statsPayload, periodDays);
  renderizarPerformance(performancePayload);
  renderizarSeo(seoPayload);

  return {
    config: configPayload && configPayload.config ? configPayload.config : {},
    days: periodDays
  };
}

export async function iniciarGerenciadorAnalytics(contexto = {}) {
  const flash = typeof contexto.flash === 'function' ? contexto.flash : () => {};
  const onUnauthorized = typeof contexto.onUnauthorized === 'function' ? contexto.onUnauthorized : null;

  const form = document.getElementById('analytics-config-form');
  const inputDias = document.getElementById('ana-days-input');
  const botaoAtualizar = document.getElementById('analytics-refresh-btn');
  const botaoTesteCookies = document.getElementById('analytics-open-cookie-test-btn');

  if (!form) return;

  async function recarregar() {
    const dias = inputDias ? Number(inputDias.value) : 30;
    const payload = await carregarPainelAnalytics(dias);
    preencherFormularioConfig(form, payload.config);
    if (inputDias) {
      inputDias.value = String(payload.days);
    }
  }

  if (botaoAtualizar) {
    botaoAtualizar.addEventListener('click', async () => {
      try {
        await recarregar();
        flash('Metricas de analytics atualizadas.', 'success');
      } catch (erro) {
        if (erro && erro.status === 401 && onUnauthorized) {
          onUnauthorized();
          return;
        }
        flash(mensagemErroAmigavel(erro, 'Falha ao atualizar metricas de analytics.'), 'error');
      }
    });
  }

  if (botaoTesteCookies) {
    botaoTesteCookies.addEventListener('click', () => {
      window.open('/?cookie_test=1', '_blank', 'noopener,noreferrer');
    });
  }

  if (inputDias) {
    inputDias.addEventListener('change', async () => {
      try {
        await recarregar();
      } catch (erro) {
        if (erro && erro.status === 401 && onUnauthorized) {
          onUnauthorized();
          return;
        }
        flash(mensagemErroAmigavel(erro, 'Falha ao recalcular periodo de analytics.'), 'error');
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = coletarPayloadConfig(form);
      await requisicaoApi('/api/analytics/config', {
        method: 'POST',
        body: payload
      });
      flash('Configuracao de analytics salva com sucesso.', 'success');
      await recarregar();
    } catch (erro) {
      if (erro && erro.status === 401 && onUnauthorized) {
        onUnauthorized();
        return;
      }
      flash(mensagemErroAmigavel(erro, 'Falha ao salvar configuracao de analytics.'), 'error');
    }
  });

  try {
    await recarregar();
  } catch (erro) {
    if (erro && erro.status === 401 && onUnauthorized) {
      onUnauthorized();
      return;
    }
    flash(mensagemErroAmigavel(erro, 'Falha ao carregar painel de analytics.'), 'error');
  }
}

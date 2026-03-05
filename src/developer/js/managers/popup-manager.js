/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/popup-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Gerencia configuracao e analises do Exit Intent Popup na area developer.

Responsabilidades:
- Carregar configuracao do popup (conteudo, triggers e limites) via API autenticada.
- Permitir salvar alteracoes com validacao basica de formulario.
- Exibir metricas de desempenho e lista de leads recentes para operacao.

Integracoes:
- Dependencias: /src/js/shared/api.js
- Endpoints/rotas: /api/popup-config/admin, /api/popup-config, /api/popup-events, /api/leads
- Classes/seletores/chaves: #popup-config-form, #popup-top-pages, #popup-leads-list, #popup-open-test-btn

Entradas e saidas:
- Entradas: submit de formulario e respostas das APIs do popup.
- Saidas  : atualizacao de DOM e persistencia de configuracao no backend.

Elementos tecnicos: iniciarGerenciadorPopup, carregarPainelPopup, coletarPayloadFormulario, renderizarMetricasPopup
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';

function mensagemErroAmigavel(erro, fallback) {
  if (!erro) return fallback;
  if (erro.status === 401) return 'Sua sessao expirou. Faca login novamente.';
  if (erro.status === 403) return 'Acao bloqueada por seguranca. Atualize a pagina e tente de novo.';
  if (erro.status === 404) return 'Endpoint do popup nao encontrado. Reinicie o servidor para atualizar as rotas.';

  const mensagem = String(erro.message || '').trim().toLowerCase();
  if (mensagem.includes('endpoint') && mensagem.includes('nao encontrado')) {
    return 'Endpoint do popup nao encontrado. Reinicie o servidor para atualizar as rotas.';
  }

  return fallback;
}

function preencherCampo(form, nome, valor) {
  const campo = form.elements.namedItem(nome);
  if (!campo) return;
  campo.value = valor == null ? '' : String(valor);
}

function preencherCheckbox(form, nome, marcado) {
  const campo = form.elements.namedItem(nome);
  if (!campo) return;
  campo.checked = Boolean(marcado);
}

function coletarPayloadFormulario(form) {
  const data = new FormData(form);

  return {
    title: sanitizarTexto(data.get('title'), 80),
    description: sanitizarTexto(data.get('description'), 220),
    buttonText: sanitizarTexto(data.get('buttonText'), 40),
    closeText: sanitizarTexto(data.get('closeText'), 24),
    successMessage: sanitizarTexto(data.get('successMessage'), 160),
    delaySeconds: limitarInteiro(data.get('delaySeconds'), 3, 90, 10),
    cooldownHours: limitarInteiro(data.get('cooldownHours'), 1, 720, 24),
    maxShowsPerSession: limitarInteiro(data.get('maxShowsPerSession'), 1, 3, 1),
    enableName: data.get('enableName') === 'on',
    enableEmail: data.get('enableEmail') === 'on',
    enablePhone: data.get('enablePhone') === 'on',
    mobileScrollTrigger: data.get('mobileScrollTrigger') === 'on',
    mobileBackButtonTrigger: data.get('mobileBackButtonTrigger') === 'on'
  };
}

function renderizarMetricasPopup(analytics, leads) {
  const totais = analytics && analytics.totals ? analytics.totals : {};
  const ultimos7Dias = analytics && analytics.last7Days ? analytics.last7Days : {};

  const definirTexto = (id, valor) => {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    elemento.textContent = String(valor);
  };

  definirTexto('popup-metric-shown', totais.popup_shown || 0);
  definirTexto('popup-metric-closed', totais.popup_closed || 0);
  definirTexto('popup-metric-submitted', totais.popup_submitted || 0);
  definirTexto('popup-metric-ignored', totais.popup_ignored || 0);
  definirTexto('popup-metric-conversion', `${Number(analytics && analytics.conversionRate ? analytics.conversionRate : 0).toFixed(2)}%`);
  definirTexto('popup-metric-leads-total', Array.isArray(leads) ? leads.length : 0);
  definirTexto('popup-metric-events-7d', ultimos7Dias.events || 0);
  definirTexto('popup-metric-leads-7d', ultimos7Dias.leads || 0);
}

function renderizarTopPaginas(paginas) {
  const lista = document.getElementById('popup-top-pages');
  if (!lista) return;

  lista.replaceChildren();

  if (!Array.isArray(paginas) || paginas.length === 0) {
    const item = document.createElement('li');
    item.innerHTML = '<span>Sem eventos registrados</span><strong>0</strong>';
    lista.appendChild(item);
    return;
  }

  paginas.slice(0, 6).forEach((pagina) => {
    const item = document.createElement('li');
    const nome = document.createElement('span');
    const total = document.createElement('strong');
    nome.textContent = pagina.pagePath || '/';
    total.textContent = String(pagina.total || 0);
    item.append(nome, total);
    lista.appendChild(item);
  });
}

function renderizarLeads(leads) {
  const container = document.getElementById('popup-leads-list');
  if (!container) return;

  container.replaceChildren();

  if (!Array.isArray(leads) || leads.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'empty-state';
    vazio.textContent = 'Nenhum lead capturado ainda para o popup.';
    container.appendChild(vazio);
    return;
  }

  leads.slice(0, 20).forEach((lead) => {
    const item = document.createElement('article');
    item.className = 'entity-item';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'entity-item__head';

    const blocoInfo = document.createElement('div');
    const titulo = document.createElement('h4');
    titulo.className = 'entity-item__title';
    titulo.textContent = lead.name || 'Lead sem nome';

    const meta = document.createElement('p');
    meta.className = 'entity-item__meta';
    meta.textContent = `${formatarData(lead.createdAt)} - ${lead.pagePath || '/'}`;

    blocoInfo.append(titulo, meta);
    cabecalho.appendChild(blocoInfo);

    const detalhes = document.createElement('p');
    detalhes.className = 'entity-item__meta';
    detalhes.textContent = `Email: ${lead.email || '-'} | Telefone: ${lead.phone || '-'}`;

    item.append(cabecalho, detalhes);
    container.appendChild(item);
  });
}

async function carregarPainelPopup(form) {
  const [adminPayload, eventosPayload, leadsPayload] = await Promise.all([
    requisicaoApi('/api/popup-config/admin'),
    requisicaoApi('/api/popup-events'),
    requisicaoApi('/api/leads')
  ]);

  const config = adminPayload && adminPayload.config ? adminPayload.config : {};
  preencherCampo(form, 'title', config.title);
  preencherCampo(form, 'description', config.description);
  preencherCampo(form, 'buttonText', config.buttonText);
  preencherCampo(form, 'closeText', config.closeText);
  preencherCampo(form, 'successMessage', config.successMessage);
  preencherCampo(form, 'delaySeconds', config.delaySeconds);
  preencherCampo(form, 'cooldownHours', config.cooldownHours);
  preencherCampo(form, 'maxShowsPerSession', config.maxShowsPerSession);
  preencherCheckbox(form, 'enableName', config.enableName);
  preencherCheckbox(form, 'enableEmail', config.enableEmail);
  preencherCheckbox(form, 'enablePhone', config.enablePhone);
  preencherCheckbox(form, 'mobileScrollTrigger', config.mobileScrollTrigger);
  preencherCheckbox(form, 'mobileBackButtonTrigger', config.mobileBackButtonTrigger);

  const analytics = eventosPayload && eventosPayload.analytics ? eventosPayload.analytics : adminPayload && adminPayload.analytics ? adminPayload.analytics : {};
  const leads = leadsPayload && Array.isArray(leadsPayload.leads) ? leadsPayload.leads : [];

  renderizarMetricasPopup(analytics, leads);
  renderizarTopPaginas(analytics && Array.isArray(analytics.topPages) ? analytics.topPages : []);
  renderizarLeads(leads);
}

export async function iniciarGerenciadorPopup(contexto = {}) {
  const form = document.getElementById('popup-config-form');
  if (!form) return;

  const flash = typeof contexto.flash === 'function' ? contexto.flash : () => {};

  const botaoTeste = document.getElementById('popup-open-test-btn');
  if (botaoTeste) {
    botaoTeste.addEventListener('click', () => {
      window.open('/?popup_test=1', '_blank', 'noopener,noreferrer');
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const payload = coletarPayloadFormulario(form);
      await requisicaoApi('/api/popup-config', {
        method: 'POST',
        body: payload
      });

      flash('Configuracao do Exit Popup salva com sucesso.', 'success');
      await carregarPainelPopup(form);
    } catch (erro) {
      if (erro && erro.status === 401 && typeof contexto.onUnauthorized === 'function') {
        contexto.onUnauthorized();
        return;
      }
      flash(mensagemErroAmigavel(erro, 'Falha ao salvar configuracao do popup.'), 'error');
    }
  });

  try {
    await carregarPainelPopup(form);
  } catch (erro) {
    if (erro && erro.status === 401 && typeof contexto.onUnauthorized === 'function') {
      contexto.onUnauthorized();
      return;
    }
    flash(mensagemErroAmigavel(erro, 'Falha ao carregar dados do Exit Popup.'), 'error');
  }
}

function sanitizarTexto(valor, maximo = 200) {
  return String(valor || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo);
}

function limitarInteiro(valor, min, max, padrao) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  const arredondado = Math.round(numero);
  return Math.min(max, Math.max(min, arredondado));
}

function formatarData(valor) {
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

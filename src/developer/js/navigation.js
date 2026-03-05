/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/navigation.js
Modulo  : Frontend - shell do painel developer
Papel   : Orquestra navegacao do CMS, sessao autenticada e hidratacao de cada modulo por pagina.

Responsabilidades:
- Controlar o roteamento interno por query string (`?page=`) com fallback seguro.
- Carregar templates HTML de cada modulo e inicializar o manager correspondente.
- Manter estado global da sessao, mensagem flash, cabecalho e sidebar responsiva.

Integracoes:
- Dependencias: /src/js/shared/api.js, /developer/js/managers/hero-manager.js, /developer/js/managers/dna-manager.js, /developer/js/managers/feedback-manager.js, /developer/js/managers/about-manager.js, /developer/js/managers/contact-manager.js, /developer/js/managers/image-manager.js
- Endpoints/rotas: /api/developer/session, /api/admin/content, /api/developer/imagens, /api/auth/logout
- Classes/seletores/chaves: [data-nav-page], [data-go-page], #page-title, #page-breadcrumb, #session-user, #dev-message, #page-container, #sidebar-overlay

Entradas e saidas:
- Entradas: clique em menu, navegacao historica, retorno de API e estado de autenticacao.
- Saidas  : renderizacao de template, atualizacao de DOM e chamadas HTTP autenticadas.

Elementos tecnicos: resolverPaginaSolicitada, navegar, iniciarPaginaDashboard, hidratarPagina, iniciarNavegacaoPainel
[DOC-FILE-END]============================================================== */

import { definirTokenCsrf, requisicaoApi } from '/src/js/shared/api.js';
import { iniciarGerenciadorHero } from '/developer/js/managers/hero-manager.js?v=20260305b';
import { iniciarGerenciadorDna } from '/developer/js/managers/dna-manager.js?v=20260305a';
import { iniciarGerenciadorFeedbacks } from '/developer/js/managers/feedback-manager.js';
import { iniciarGerenciadorSobre } from '/developer/js/managers/about-manager.js';
import { iniciarGerenciadorContato } from '/developer/js/managers/contact-manager.js';
import { iniciarGerenciadorImagens } from '/developer/js/managers/image-manager.js';
import { iniciarGerenciadorPopup } from '/developer/js/managers/popup-manager.js';
import { iniciarGerenciadorAnalytics } from '/developer/js/managers/analytics-dashboard-manager.js';
import { aplicarSistemaAjuda } from '/developer/js/help-system.js?v=20260305d';

const CONFIG_PAGINAS = {
  dashboard: {
    titulo: 'Dashboard',
    breadcrumb: ['Dashboard']
  },
  'home-hero': {
    titulo: 'Home - Hero',
    breadcrumb: ['Home', 'Hero']
  },
  'home-dna': {
    titulo: 'Home - DNA da empresa',
    breadcrumb: ['Home', 'DNA da empresa']
  },
  'servicos-feedbacks': {
    titulo: 'Servicos - Feedbacks',
    breadcrumb: ['Servicos', 'Feedbacks']
  },
  'sobre-hero': {
    titulo: 'Sobre Nos - Hero institucional',
    breadcrumb: ['Sobre Nos', 'Hero institucional']
  },
  'contato-info': {
    titulo: 'Contato - Informacoes',
    breadcrumb: ['Contato', 'Informacoes']
  },
  imagens: {
    titulo: 'Midia - Biblioteca de imagens',
    breadcrumb: ['Midia', 'Biblioteca']
  },
  'popup-exit': {
    titulo: 'Automacoes - Exit Popup',
    breadcrumb: ['Automacoes', 'Exit Popup']
  },
  'analytics-dashboard': {
    titulo: 'Automacoes - Analytics',
    breadcrumb: ['Automacoes', 'Analytics']
  }
};

const ALIAS_PAGINAS = {
  'carrossel-hero': 'home-hero',
  'carrossel-dna': 'home-dna',
  vagas: 'servicos-feedbacks',
  popup: 'popup-exit',
  analytics: 'analytics-dashboard'
};

const estadoPainel = {
  paginaAtual: 'dashboard',
  sessao: null,
  timerFlash: null
};

function resolverPaginaSolicitada(pagina) {
  const bruta = String(pagina || '').trim();
  const normalizada = ALIAS_PAGINAS[bruta] || bruta;
  return CONFIG_PAGINAS[normalizada] ? normalizada : 'dashboard';
}

function obterPaginaSolicitada() {
  const params = new URLSearchParams(window.location.search);
  return resolverPaginaSolicitada(params.get('page'));
}

function atualizarNavegacaoAtiva(pagina) {
  document.querySelectorAll('[data-nav-page]').forEach((link) => {
    const ativo = link.dataset.navPage === pagina;
    link.classList.toggle('is-active', ativo);
    link.setAttribute('aria-current', ativo ? 'page' : 'false');
  });
}

function renderizarCabecalho(pagina) {
  const config = CONFIG_PAGINAS[pagina] || CONFIG_PAGINAS.dashboard;
  const titulo = document.getElementById('page-title');
  const breadcrumb = document.getElementById('page-breadcrumb');

  if (titulo) {
    titulo.textContent = config.titulo;
  }

  if (breadcrumb) {
    const itens = ['Gerenciamento', ...(Array.isArray(config.breadcrumb) ? config.breadcrumb : ['Dashboard'])];
    const elementos = itens.map((valor) => {
      const item = document.createElement('li');
      item.textContent = valor;
      return item;
    });
    breadcrumb.replaceChildren(...elementos);
  }
}

function fecharSidebarMobile() {
  document.body.classList.remove('sidebar-open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.hidden = true;
  }
}

function abrirSidebarMobile() {
  document.body.classList.add('sidebar-open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.hidden = false;
  }
}

function redirecionarNaoAutorizado() {
  const next = encodeURIComponent(`/developer/index.html?page=${estadoPainel.paginaAtual}`);
  window.location.href = `/auth/entrar.html?area=staff&next=${next}`;
}

function exibirMensagem(mensagem, tipo = 'info') {
  const box = document.getElementById('dev-message');
  if (!box) return;

  if (estadoPainel.timerFlash) {
    window.clearTimeout(estadoPainel.timerFlash);
  }

  box.textContent = String(mensagem || '');
  box.dataset.state = tipo;
  box.classList.add('is-visible');

  estadoPainel.timerFlash = window.setTimeout(() => {
    box.classList.remove('is-visible');
  }, 4200);
}

async function carregarSessaoDeveloper() {
  try {
    const payload = await requisicaoApi('/api/developer/session');
    estadoPainel.sessao = payload;

    if (payload && typeof payload.csrfToken === 'string') {
      definirTokenCsrf(payload.csrfToken);
    }

    const boxUsuario = document.getElementById('session-user');
    if (boxUsuario && payload && payload.user) {
      boxUsuario.textContent = `${payload.user.name} (${payload.user.email})`;
    }
  } catch {
    redirecionarNaoAutorizado();
    throw new Error('Sessao invalida.');
  }
}

async function carregarTemplatePagina(pagina) {
  const resposta = await fetch(`/developer/pages/${pagina}.html`, {
    method: 'GET',
    credentials: 'same-origin'
  });

  if (!resposta.ok) {
    throw new Error('Falha ao carregar pagina do painel.');
  }

  return resposta.text();
}

function sanitizarTemplateHtml(raiz) {
  if (!raiz) return;

  const tagsBloqueadas = new Set(['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED']);
  const remover = [];
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const elemento = walker.currentNode;

    if (tagsBloqueadas.has(elemento.tagName)) {
      remover.push(elemento);
      continue;
    }

    Array.from(elemento.attributes).forEach((attr) => {
      const nome = attr.name.toLowerCase();
      const valor = String(attr.value || '').trim().toLowerCase();

      if (nome.startsWith('on')) {
        elemento.removeAttribute(attr.name);
        return;
      }

      if ((nome === 'href' || nome === 'src' || nome === 'xlink:href') && valor.startsWith('javascript:')) {
        elemento.removeAttribute(attr.name);
      }
    });
  }

  remover.forEach((item) => item.remove());
}

function montarFragmentoSeguro(markup) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(markup || ''), 'text/html');
  sanitizarTemplateHtml(doc.body);

  const fragmento = document.createDocumentFragment();
  Array.from(doc.body.childNodes).forEach((node) => {
    fragmento.appendChild(document.importNode(node, true));
  });
  return fragmento;
}

function atualizarHistoricoNavegacao(pagina, adicionarHistorico) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', pagina);

  if (adicionarHistorico) {
    window.history.pushState({ page: pagina }, '', url.toString());
  } else {
    window.history.replaceState({ page: pagina }, '', url.toString());
  }
}

function criarContextoPagina() {
  return {
    sessao: estadoPainel.sessao,
    flash: exibirMensagem,
    onUnauthorized: redirecionarNaoAutorizado
  };
}

function vincularLinksRapidos() {
  document.querySelectorAll('[data-go-page]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const paginaDestino = resolverPaginaSolicitada(botao.dataset.goPage);
      navegar(paginaDestino, true);
    });
  });
}

function preencherTextoPorId(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(valor);
}

function atualizarCobertura(id, percentual) {
  const el = document.getElementById(id);
  if (!el) return;

  const valorSeguro = Math.max(0, Math.min(100, Number(percentual) || 0));
  el.style.width = `${valorSeguro}%`;

  const elValor = document.getElementById(`${id}-value`);
  if (elValor) {
    elValor.textContent = `${valorSeguro}%`;
    el.textContent = '';
    el.setAttribute('aria-label', `${valorSeguro}%`);
    return;
  }

  el.textContent = `${valorSeguro}%`;
}

function calcularPercentual(preenchidos, total) {
  if (!total || total <= 0) return 0;
  return Math.round((preenchidos / total) * 100);
}

function contarCamposPreenchidos(campos = []) {
  return campos.reduce((acc, campo) => {
    return acc + (campo ? 1 : 0);
  }, 0);
}

async function iniciarPaginaDashboard() {
  const metricaHero = document.getElementById('metric-hero');
  const metricaDna = document.getElementById('metric-dna');
  const metricaVagas = document.getElementById('metric-vagas');
  const metricaFeedbacks = document.getElementById('metric-feedbacks');
  const metricaImagens = document.getElementById('metric-imagens');
  const metricaTotalItens = document.getElementById('metric-total-itens');

  try {
    const [conteudo, imagens, textos, popupEventos, popupLeads] = await Promise.all([
      requisicaoApi('/api/admin/content'),
      requisicaoApi('/api/developer/imagens'),
      requisicaoApi('/api/developer/textos'),
      requisicaoApi('/api/popup-events').catch(() => null),
      requisicaoApi('/api/leads').catch(() => null)
    ]);

    const heroSlides = Array.isArray(conteudo.content.heroSlides) ? conteudo.content.heroSlides : [];
    const dnaSlides = Array.isArray(conteudo.content.dnaSlides) ? conteudo.content.dnaSlides : [];
    const vagas = Array.isArray(conteudo.content.vagas) ? conteudo.content.vagas : [];
    const feedbacks = Array.isArray(conteudo.content.feedbacks) ? conteudo.content.feedbacks : [];
    const imagensLista = Array.isArray(imagens.images) ? imagens.images : [];
    const siteTexts = textos && textos.texts ? textos.texts : {};

    const heroAtivos = heroSlides.filter((item) => item.active).length;
    const dnaAtivos = dnaSlides.filter((item) => item.active).length;
    const vagasAtivas = vagas.filter((item) => item.active).length;
    const vagasDestaque = vagas.filter((item) => item.active && item.featured).length;
    const feedbacksAtivos = feedbacks.filter((item) => item.active).length;
    const imagensConteudo = imagensLista.filter((item) => item.source === 'conteudo').length;
    const imagensUpload = imagensLista.filter((item) => item.source === 'upload').length;

    const totalItensEditaveis = heroSlides.length + dnaSlides.length + vagas.length + feedbacks.length;
    const totalAtivos = heroAtivos + dnaAtivos + vagasAtivas + feedbacksAtivos;
    const taxaPublicacao = calcularPercentual(totalAtivos, totalItensEditaveis || 1);

    if (metricaHero) metricaHero.textContent = String(heroSlides.length);
    if (metricaDna) metricaDna.textContent = String(dnaSlides.length);
    if (metricaVagas) metricaVagas.textContent = String(vagas.length);
    if (metricaFeedbacks) metricaFeedbacks.textContent = String(feedbacks.length);
    if (metricaImagens) metricaImagens.textContent = String(imagensLista.length);
    if (metricaTotalItens) metricaTotalItens.textContent = String(totalItensEditaveis);

    preencherTextoPorId('ana-hero-active', heroAtivos);
    preencherTextoPorId('ana-dna-active', dnaAtivos);
    preencherTextoPorId('ana-vagas-destaque', vagasDestaque);
    preencherTextoPorId('ana-feedbacks-active', feedbacksAtivos);
    preencherTextoPorId('ana-imagens-conteudo', imagensConteudo);

    preencherTextoPorId('metric-publicacao', `${taxaPublicacao}%`);
    preencherTextoPorId('metric-uploads', imagensUpload);

    const coberturaHome = calcularPercentual(
      (heroAtivos > 0 ? 1 : 0) + (dnaAtivos > 0 ? 1 : 0) + (vagasAtivas > 0 ? 1 : 0),
      3
    );

    const coberturaServicos = calcularPercentual(
      (feedbacksAtivos > 0 ? 1 : 0) +
      (siteTexts.servicesFeedbackTitle ? 1 : 0) +
      (siteTexts.servicesFeedbackSubtitle ? 1 : 0),
      3
    );

    const coberturaSobre = calcularPercentual(
      contarCamposPreenchidos([
        siteTexts.aboutHeroTag,
        siteTexts.aboutHeroTitle,
        siteTexts.aboutHeroSubtitle,
        siteTexts.aboutHeroImage,
        siteTexts.aboutStat1Number,
        siteTexts.aboutStat1Description,
        siteTexts.aboutStat2Number,
        siteTexts.aboutStat2Description,
        siteTexts.aboutStat3Number,
        siteTexts.aboutStat3Description
      ]),
      10
    );

    const coberturaContato = calcularPercentual(
      contarCamposPreenchidos([
        siteTexts.contactPageTitle,
        siteTexts.contactPageSubtitle,
        siteTexts.contactPhoneNumber,
        siteTexts.contactPhoneHours,
        siteTexts.contactEmailAddress,
        siteTexts.contactEmailResponse,
        siteTexts.contactWhatsappUrl,
        siteTexts.contactWhatsappLabel,
        siteTexts.contactAddressLine,
        siteTexts.contactAddressZip,
        siteTexts.contactAddressCountry,
        siteTexts.contactCtaLabel,
        siteTexts.contactCtaUrl
      ]),
      13
    );

    const coberturaGeral = Math.round((coberturaHome + coberturaServicos + coberturaSobre + coberturaContato) / 4);

    atualizarCobertura('cov-home', coberturaHome);
    atualizarCobertura('cov-servicos', coberturaServicos);
    atualizarCobertura('cov-sobre', coberturaSobre);
    atualizarCobertura('cov-contato', coberturaContato);
    atualizarCobertura('cov-geral', coberturaGeral);

    const popupAnalytics = popupEventos && popupEventos.analytics ? popupEventos.analytics : null;
    const popupTotals = popupAnalytics && popupAnalytics.totals ? popupAnalytics.totals : {};
    const popupLeadsLista = popupLeads && Array.isArray(popupLeads.leads) ? popupLeads.leads : [];
    const popupLast7Days = popupAnalytics && popupAnalytics.last7Days ? popupAnalytics.last7Days : {};
    const popupTopPages = popupAnalytics && Array.isArray(popupAnalytics.topPages) ? popupAnalytics.topPages : [];

    preencherTextoPorId('dash-popup-shown', popupTotals.popup_shown || 0);
    preencherTextoPorId('dash-popup-closed', popupTotals.popup_closed || 0);
    preencherTextoPorId('dash-popup-submitted', popupTotals.popup_submitted || 0);
    preencherTextoPorId('dash-popup-ignored', popupTotals.popup_ignored || 0);
    preencherTextoPorId('dash-popup-conversion', `${Number(popupAnalytics && popupAnalytics.conversionRate ? popupAnalytics.conversionRate : 0).toFixed(2)}%`);
    preencherTextoPorId('dash-popup-leads', popupLeadsLista.length);
    preencherTextoPorId('dash-popup-events-7d', popupLast7Days.events || 0);
    preencherTextoPorId('dash-popup-leads-7d', popupLast7Days.leads || 0);

    const popupTopPagesList = document.getElementById('dash-popup-top-pages');
    if (popupTopPagesList) {
      popupTopPagesList.replaceChildren();
      if (popupTopPages.length === 0) {
        const vazio = document.createElement('li');
        vazio.innerHTML = '<span>Sem eventos ainda</span><strong>0</strong>';
        popupTopPagesList.appendChild(vazio);
      } else {
        popupTopPages.slice(0, 5).forEach((item) => {
          const li = document.createElement('li');
          const nome = document.createElement('span');
          const total = document.createElement('strong');
          nome.textContent = item.pagePath || '/';
          total.textContent = String(item.total || 0);
          li.append(nome, total);
          popupTopPagesList.appendChild(li);
        });
      }
    }

    const atualizado = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    preencherTextoPorId('dash-updated-at', `Atualizado em ${atualizado}`);
  } catch (erro) {
    if (erro && erro.status === 401) {
      redirecionarNaoAutorizado();
      return;
    }
    exibirMensagem(erro.message || 'Falha ao carregar dashboard.', 'error');
  }

  vincularLinksRapidos();
}

async function hidratarPagina(pagina) {
  const contexto = criarContextoPagina();

  if (pagina === 'dashboard') return iniciarPaginaDashboard();
  if (pagina === 'home-hero') return iniciarGerenciadorHero(contexto);
  if (pagina === 'home-dna') return iniciarGerenciadorDna(contexto);
  if (pagina === 'servicos-feedbacks') return iniciarGerenciadorFeedbacks(contexto);
  if (pagina === 'sobre-hero') return iniciarGerenciadorSobre(contexto);
  if (pagina === 'contato-info') return iniciarGerenciadorContato(contexto);
  if (pagina === 'imagens') return iniciarGerenciadorImagens(contexto);
  if (pagina === 'popup-exit') return iniciarGerenciadorPopup(contexto);
  if (pagina === 'analytics-dashboard') return iniciarGerenciadorAnalytics(contexto);
  return undefined;
}

async function navegar(pagina, adicionarHistorico = true) {
  const paginaDestino = resolverPaginaSolicitada(pagina);
  const container = document.getElementById('page-container');
  if (!container) return;

  estadoPainel.paginaAtual = paginaDestino;
  atualizarNavegacaoAtiva(paginaDestino);
  renderizarCabecalho(paginaDestino);
  fecharSidebarMobile();

  try {
    const markup = await carregarTemplatePagina(paginaDestino);
    container.replaceChildren(montarFragmentoSeguro(markup));
    atualizarHistoricoNavegacao(paginaDestino, adicionarHistorico);
    await hidratarPagina(paginaDestino);
    aplicarSistemaAjuda(container);
  } catch (erro) {
    container.replaceChildren();
    const bloco = document.createElement('section');
    bloco.className = 'panel-card';
    const titulo = document.createElement('h2');
    titulo.textContent = 'Falha ao carregar pagina';
    const texto = document.createElement('p');
    texto.textContent = erro.message || 'Erro inesperado.';
    bloco.append(titulo, texto);
    container.appendChild(bloco);
  }
}

async function executarLogout() {
  try {
    await requisicaoApi('/api/auth/logout', {
      method: 'POST',
      body: {}
    });
  } catch {
    // Nao impede saida.
  }
  window.location.href = '/auth/entrar.html?area=staff';
}

function atualizarEstadoBotaoColapso() {
  const botaoColapso = document.getElementById('sidebar-collapse-btn');
  if (!botaoColapso) return;

  if (window.innerWidth <= 1020) {
    const rotuloMobile = 'Fechar menu lateral';
    botaoColapso.setAttribute('aria-label', rotuloMobile);
    botaoColapso.setAttribute('title', rotuloMobile);
    return;
  }

  const colapsado = document.body.classList.contains('sidebar-collapsed');
  const rotulo = colapsado ? 'Expandir menu' : 'Colapsar menu';
  botaoColapso.setAttribute('aria-label', rotulo);
  botaoColapso.setAttribute('title', rotulo);
}

function vincularEventosShell() {
  document.querySelectorAll('[data-nav-page]').forEach((link) => {
    link.addEventListener('click', (evento) => {
      evento.preventDefault();
      const pagina = resolverPaginaSolicitada(link.dataset.navPage);
      navegar(pagina, true);
    });
  });

  const botaoColapso = document.getElementById('sidebar-collapse-btn');
  if (botaoColapso) {
    botaoColapso.addEventListener('click', () => {
      if (window.innerWidth <= 1020) {
        fecharSidebarMobile();
        atualizarEstadoBotaoColapso();
        return;
      }
      document.body.classList.toggle('sidebar-collapsed');
      atualizarEstadoBotaoColapso();
    });
  }

  const botaoMenuMobile = document.getElementById('mobile-menu-btn');
  if (botaoMenuMobile) {
    botaoMenuMobile.addEventListener('click', () => {
      if (document.body.classList.contains('sidebar-open')) {
        fecharSidebarMobile();
      } else {
        abrirSidebarMobile();
      }
    });
  }

  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', fecharSidebarMobile);
  }

  const botaoLogout = document.getElementById('logout-btn');
  if (botaoLogout) {
    botaoLogout.addEventListener('click', executarLogout);
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1020) {
      fecharSidebarMobile();
      atualizarEstadoBotaoColapso();
    }
  });

  window.addEventListener('popstate', (evento) => {
    const paginaState = evento.state && evento.state.page ? evento.state.page : obterPaginaSolicitada();
    navegar(resolverPaginaSolicitada(paginaState), false);
  });

  atualizarEstadoBotaoColapso();
}

async function iniciarNavegacaoPainel() {
  estadoPainel.paginaAtual = obterPaginaSolicitada();
  vincularEventosShell();
  await carregarSessaoDeveloper();
  await navegar(estadoPainel.paginaAtual, false);
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarNavegacaoPainel().catch(() => {
    redirecionarNaoAutorizado();
  });
});

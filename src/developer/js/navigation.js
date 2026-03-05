/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/navigation.js
Modulo  : Frontend - shell do painel developer
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js, /developer/js/managers/hero-manager.js, /developer/js/managers/dna-manager.js, /developer/js/managers/vagas-manager.js, /developer/js/managers/image-manager.js
- Endpoints/rotas: /api/developer/session, /api/developer/textos, /api/admin/content, /api/developer/imagens, /api/auth/logout
- Classes/seletores/chaves: [data-nav-page], button[type=, [data-go-page], #page-title, #page-breadcrumb, #sidebar-overlay, #dev-message, #session-user

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: obterPaginaSolicitada, atualizarNavegacaoAtiva, renderizarCabecalho, fecharSidebarMobile, abrirSidebarMobile, redirecionarNaoAutorizado, exibirMensagem, carregarSessaoDeveloper, carregarTemplatePagina, sanitizarTemplateHtml
[DOC-FILE-END]============================================================== */

import { definirTokenCsrf, requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { iniciarGerenciadorHero } from '/developer/js/managers/hero-manager.js';
import { iniciarGerenciadorDna } from '/developer/js/managers/dna-manager.js';
import { iniciarGerenciadorVagas } from '/developer/js/managers/vagas-manager.js';
import { iniciarGerenciadorImagens } from '/developer/js/managers/image-manager.js';

const CONFIG_PAGINAS = {
  dashboard: { titulo: 'Dashboard', breadcrumb: 'Dashboard' },
  'carrossel-hero': { titulo: 'Carrossel Hero', breadcrumb: 'Carrossel Hero' },
  'carrossel-dna': { titulo: 'Carrossel DNA', breadcrumb: 'Carrossel DNA' },
  vagas: { titulo: 'Vagas', breadcrumb: 'Vagas' },
  imagens: { titulo: 'Imagens', breadcrumb: 'Imagens' }
};

const estadoPainel = {
  paginaAtual: 'dashboard',
  sessao: null,
  timerFlash: null
};

function obterPaginaSolicitada() {
  const params = new URLSearchParams(window.location.search);
  const pagina = params.get('page');
  return CONFIG_PAGINAS[pagina] ? pagina : 'dashboard';
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
    const raiz = document.createElement('li');
    raiz.textContent = 'Gerenciamento';
    const atual = document.createElement('li');
    atual.textContent = config.breadcrumb;
    breadcrumb.replaceChildren(raiz, atual);
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

function preencherFormularioTextos(form, textos) {
  form.dashboardTitle.value = textos.dashboardTitle || '';
  form.dashboardSubtitle.value = textos.dashboardSubtitle || '';
  form.heroSectionTitle.value = textos.heroSectionTitle || '';
  form.heroSectionSubtitle.value = textos.heroSectionSubtitle || '';
  form.dnaSectionTitle.value = textos.dnaSectionTitle || '';
  form.dnaSectionSubtitle.value = textos.dnaSectionSubtitle || '';
  form.vagasSectionTitle.value = textos.vagasSectionTitle || '';
  form.vagasSectionSubtitle.value = textos.vagasSectionSubtitle || '';
  form.ctaPrimaryLabel.value = textos.ctaPrimaryLabel || '';
  form.ctaPrimaryUrl.value = textos.ctaPrimaryUrl || '';
  form.ctaSecondaryLabel.value = textos.ctaSecondaryLabel || '';
  form.ctaSecondaryUrl.value = textos.ctaSecondaryUrl || '';
}

function lerFormularioTextos(form) {
  return {
    dashboardTitle: sanitizarTexto(form.dashboardTitle.value, 80),
    dashboardSubtitle: sanitizarTexto(form.dashboardSubtitle.value, 180),
    heroSectionTitle: sanitizarTexto(form.heroSectionTitle.value, 120),
    heroSectionSubtitle: sanitizarTexto(form.heroSectionSubtitle.value, 220),
    dnaSectionTitle: sanitizarTexto(form.dnaSectionTitle.value, 120),
    dnaSectionSubtitle: sanitizarTexto(form.dnaSectionSubtitle.value, 220),
    vagasSectionTitle: sanitizarTexto(form.vagasSectionTitle.value, 120),
    vagasSectionSubtitle: sanitizarTexto(form.vagasSectionSubtitle.value, 220),
    ctaPrimaryLabel: sanitizarTexto(form.ctaPrimaryLabel.value, 40),
    ctaPrimaryUrl: sanitizarUrl(form.ctaPrimaryUrl.value),
    ctaSecondaryLabel: sanitizarTexto(form.ctaSecondaryLabel.value, 40),
    ctaSecondaryUrl: sanitizarUrl(form.ctaSecondaryUrl.value)
  };
}

function vincularFormularioTextos(form) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botaoSubmit = form.querySelector('button[type="submit"]');
    if (botaoSubmit) botaoSubmit.disabled = true;

    try {
      await requisicaoApi('/api/developer/textos', {
        method: 'PUT',
        body: lerFormularioTextos(form)
      });
      exibirMensagem('Textos atualizados com sucesso.', 'success');
    } catch (erro) {
      if (erro && erro.status === 401) {
        redirecionarNaoAutorizado();
        return;
      }
      exibirMensagem(erro.message || 'Falha ao salvar textos.', 'error');
    } finally {
      if (botaoSubmit) botaoSubmit.disabled = false;
    }
  });
}

async function iniciarPaginaDashboard() {
  const metricaHero = document.getElementById('metric-hero');
  const metricaDna = document.getElementById('metric-dna');
  const metricaVagas = document.getElementById('metric-vagas');
  const metricaImagens = document.getElementById('metric-imagens');

  try {
    const [conteudo, imagens, textos] = await Promise.all([
      requisicaoApi('/api/admin/content'),
      requisicaoApi('/api/developer/imagens'),
      requisicaoApi('/api/developer/textos')
    ]);

    if (metricaHero) metricaHero.textContent = String((conteudo.content.heroSlides || []).length);
    if (metricaDna) metricaDna.textContent = String((conteudo.content.dnaSlides || []).length);
    if (metricaVagas) metricaVagas.textContent = String((conteudo.content.vagas || []).length);
    if (metricaImagens) metricaImagens.textContent = String((imagens.images || []).length);

    const formTextos = document.getElementById('site-texts-form');
    if (formTextos) {
      preencherFormularioTextos(formTextos, textos.texts || {});
      vincularFormularioTextos(formTextos);
    }
  } catch (erro) {
    if (erro && erro.status === 401) {
      redirecionarNaoAutorizado();
      return;
    }
    exibirMensagem(erro.message || 'Falha ao carregar dashboard.', 'error');
  }

  document.querySelectorAll('[data-go-page]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const paginaDestino = botao.dataset.goPage;
      if (!paginaDestino) return;
      navegar(paginaDestino, true);
    });
  });
}

async function hidratarPagina(pagina) {
  const contexto = criarContextoPagina();

  if (pagina === 'dashboard') return iniciarPaginaDashboard();
  if (pagina === 'carrossel-hero') return iniciarGerenciadorHero(contexto);
  if (pagina === 'carrossel-dna') return iniciarGerenciadorDna(contexto);
  if (pagina === 'vagas') return iniciarGerenciadorVagas(contexto);
  if (pagina === 'imagens') return iniciarGerenciadorImagens(contexto);
  return undefined;
}

async function navegar(pagina, adicionarHistorico = true) {
  const paginaDestino = CONFIG_PAGINAS[pagina] ? pagina : 'dashboard';
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

function vincularEventosShell() {
  document.querySelectorAll('[data-nav-page]').forEach((link) => {
    link.addEventListener('click', (evento) => {
      evento.preventDefault();
      const pagina = link.dataset.navPage;
      if (!pagina) return;
      navegar(pagina, true);
    });
  });

  const botaoColapso = document.getElementById('sidebar-collapse-btn');
  if (botaoColapso) {
    botaoColapso.addEventListener('click', () => {
      if (window.innerWidth <= 1020) return;
      document.body.classList.toggle('sidebar-collapsed');
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
    }
  });

  window.addEventListener('popstate', (evento) => {
    const pagina = evento.state && evento.state.page ? evento.state.page : obterPaginaSolicitada();
    navegar(pagina, false);
  });
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



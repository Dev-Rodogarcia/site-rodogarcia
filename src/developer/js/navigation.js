import { apiRequest, setCsrfToken } from '/assets/js/api.js';
import { sanitizeText, sanitizeUrl } from '/assets/js/utils/sanitize.js';
import { initHeroManager } from '/developer/js/hero-manager.js';
import { initDnaManager } from '/developer/js/dna-manager.js';
import { initVagasManager } from '/developer/js/vagas-manager.js';
import { initImageManager } from '/developer/js/image-manager.js';

const PAGE_CONFIG = {
  dashboard: {
    title: 'Dashboard',
    breadcrumb: 'Dashboard'
  },
  'carrossel-hero': {
    title: 'Carrossel Hero',
    breadcrumb: 'Carrossel Hero'
  },
  'carrossel-dna': {
    title: 'Carrossel DNA',
    breadcrumb: 'Carrossel DNA'
  },
  vagas: {
    title: 'Vagas',
    breadcrumb: 'Vagas'
  },
  imagens: {
    title: 'Imagens',
    breadcrumb: 'Imagens'
  }
};

const state = {
  page: 'dashboard',
  session: null,
  flashTimer: null
};

function getRequestedPage() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  return PAGE_CONFIG[page] ? page : 'dashboard';
}

function setActiveNav(page) {
  const links = document.querySelectorAll('[data-nav-page]');
  links.forEach((link) => {
    const active = link.dataset.navPage === page;
    link.classList.toggle('is-active', active);
    link.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function renderHeader(page) {
  const config = PAGE_CONFIG[page] || PAGE_CONFIG.dashboard;
  const title = document.getElementById('page-title');
  const breadcrumb = document.getElementById('page-breadcrumb');

  if (title) {
    title.textContent = config.title;
  }

  if (breadcrumb) {
    breadcrumb.innerHTML = '';
    const root = document.createElement('li');
    root.textContent = 'Gerenciamento';
    const current = document.createElement('li');
    current.textContent = config.breadcrumb;
    breadcrumb.append(root, current);
  }
}

function closeMobileSidebar() {
  document.body.classList.remove('sidebar-open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.hidden = true;
  }
}

function openMobileSidebar() {
  document.body.classList.add('sidebar-open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.hidden = false;
  }
}

function handleUnauthorized() {
  const next = encodeURIComponent(`/developer/index.html?page=${state.page}`);
  window.location.href = `/auth/entrar.html?area=staff&next=${next}`;
}

function showMessage(message, type = 'info') {
  const box = document.getElementById('dev-message');
  if (!box) return;

  if (state.flashTimer) {
    window.clearTimeout(state.flashTimer);
  }

  box.textContent = String(message || '');
  box.dataset.state = type;
  box.classList.add('is-visible');

  state.flashTimer = window.setTimeout(() => {
    box.classList.remove('is-visible');
  }, 4200);
}

async function fetchDeveloperSession() {
  try {
    const payload = await apiRequest('/api/developer/session');
    state.session = payload;

    if (payload && typeof payload.csrfToken === 'string') {
      setCsrfToken(payload.csrfToken);
    }

    const userBox = document.getElementById('session-user');
    if (userBox && payload && payload.user) {
      userBox.textContent = `${payload.user.name} (${payload.user.email})`;
    }
  } catch {
    handleUnauthorized();
    throw new Error('Sessao invalida.');
  }
}

async function loadPageTemplate(page) {
  const response = await fetch(`/developer/pages/${page}.html`, {
    method: 'GET',
    credentials: 'same-origin'
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar pagina do painel.');
  }

  return response.text();
}

function updateHistory(page, pushHistory) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);

  if (pushHistory) {
    window.history.pushState({ page }, '', url.toString());
    return;
  }

  window.history.replaceState({ page }, '', url.toString());
}

function buildPageContext() {
  return {
    session: state.session,
    flash: showMessage,
    onUnauthorized: handleUnauthorized
  };
}

async function initDashboardPage() {
  const metricHero = document.getElementById('metric-hero');
  const metricDna = document.getElementById('metric-dna');
  const metricVagas = document.getElementById('metric-vagas');
  const metricImagens = document.getElementById('metric-imagens');

  try {
    const [contentPayload, imagesPayload, textsPayload] = await Promise.all([
      apiRequest('/api/admin/content'),
      apiRequest('/api/developer/imagens'),
      apiRequest('/api/developer/textos')
    ]);

    if (metricHero) metricHero.textContent = String((contentPayload.content.heroSlides || []).length);
    if (metricDna) metricDna.textContent = String((contentPayload.content.dnaSlides || []).length);
    if (metricVagas) metricVagas.textContent = String((contentPayload.content.vagas || []).length);
    if (metricImagens) metricImagens.textContent = String((imagesPayload.images || []).length);

    const form = document.getElementById('site-texts-form');
    if (form) {
      fillSiteTextsForm(form, textsPayload.texts || {});
      bindSiteTextsForm(form);
    }
  } catch (error) {
    if (error && error.status === 401) {
      handleUnauthorized();
      return;
    }

    showMessage(error.message || 'Falha ao carregar dashboard.', 'error');
  }

  document.querySelectorAll('[data-go-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetPage = button.dataset.goPage;
      if (!targetPage) return;
      navigate(targetPage, true);
    });
  });
}

function fillSiteTextsForm(form, texts) {
  form.dashboardTitle.value = texts.dashboardTitle || '';
  form.dashboardSubtitle.value = texts.dashboardSubtitle || '';
  form.heroSectionTitle.value = texts.heroSectionTitle || '';
  form.heroSectionSubtitle.value = texts.heroSectionSubtitle || '';
  form.dnaSectionTitle.value = texts.dnaSectionTitle || '';
  form.dnaSectionSubtitle.value = texts.dnaSectionSubtitle || '';
  form.vagasSectionTitle.value = texts.vagasSectionTitle || '';
  form.vagasSectionSubtitle.value = texts.vagasSectionSubtitle || '';
  form.ctaPrimaryLabel.value = texts.ctaPrimaryLabel || '';
  form.ctaPrimaryUrl.value = texts.ctaPrimaryUrl || '';
  form.ctaSecondaryLabel.value = texts.ctaSecondaryLabel || '';
  form.ctaSecondaryUrl.value = texts.ctaSecondaryUrl || '';
}

function readSiteTextsForm(form) {
  return {
    dashboardTitle: sanitizeText(form.dashboardTitle.value, 80),
    dashboardSubtitle: sanitizeText(form.dashboardSubtitle.value, 180),
    heroSectionTitle: sanitizeText(form.heroSectionTitle.value, 120),
    heroSectionSubtitle: sanitizeText(form.heroSectionSubtitle.value, 220),
    dnaSectionTitle: sanitizeText(form.dnaSectionTitle.value, 120),
    dnaSectionSubtitle: sanitizeText(form.dnaSectionSubtitle.value, 220),
    vagasSectionTitle: sanitizeText(form.vagasSectionTitle.value, 120),
    vagasSectionSubtitle: sanitizeText(form.vagasSectionSubtitle.value, 220),
    ctaPrimaryLabel: sanitizeText(form.ctaPrimaryLabel.value, 40),
    ctaPrimaryUrl: sanitizeUrl(form.ctaPrimaryUrl.value),
    ctaSecondaryLabel: sanitizeText(form.ctaSecondaryLabel.value, 40),
    ctaSecondaryUrl: sanitizeUrl(form.ctaSecondaryUrl.value)
  };
}

function bindSiteTextsForm(form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const payload = readSiteTextsForm(form);
      await apiRequest('/api/developer/textos', {
        method: 'PUT',
        body: payload
      });
      showMessage('Textos atualizados com sucesso.', 'success');
    } catch (error) {
      if (error && error.status === 401) {
        handleUnauthorized();
        return;
      }
      showMessage(error.message || 'Falha ao salvar textos.', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function hydratePage(page) {
  const context = buildPageContext();

  if (page === 'dashboard') {
    await initDashboardPage();
    return;
  }

  if (page === 'carrossel-hero') {
    await initHeroManager(context);
    return;
  }

  if (page === 'carrossel-dna') {
    await initDnaManager(context);
    return;
  }

  if (page === 'vagas') {
    await initVagasManager(context);
    return;
  }

  if (page === 'imagens') {
    await initImageManager(context);
  }
}

async function navigate(page, pushHistory = true) {
  const targetPage = PAGE_CONFIG[page] ? page : 'dashboard';
  const container = document.getElementById('page-container');
  if (!container) return;

  state.page = targetPage;
  setActiveNav(targetPage);
  renderHeader(targetPage);
  closeMobileSidebar();

  try {
    const markup = await loadPageTemplate(targetPage);
    container.innerHTML = markup;
    updateHistory(targetPage, pushHistory);
    await hydratePage(targetPage);
  } catch (error) {
    container.innerHTML = '';
    const block = document.createElement('section');
    block.className = 'panel-card';
    const title = document.createElement('h2');
    title.textContent = 'Falha ao carregar pagina';
    const text = document.createElement('p');
    text.textContent = error.message || 'Erro inesperado.';
    block.append(title, text);
    container.appendChild(block);
  }
}

async function logout() {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      body: {}
    });
  } catch {
    // Fluxo de saida deve continuar.
  }

  window.location.href = '/auth/entrar.html?area=staff';
}

function bindShellEvents() {
  document.querySelectorAll('[data-nav-page]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = link.dataset.navPage;
      if (!page) return;
      navigate(page, true);
    });
  });

  const collapseButton = document.getElementById('sidebar-collapse-btn');
  if (collapseButton) {
    collapseButton.addEventListener('click', () => {
      if (window.innerWidth <= 1020) return;
      document.body.classList.toggle('sidebar-collapsed');
    });
  }

  const mobileMenuButton = document.getElementById('mobile-menu-btn');
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => {
      if (document.body.classList.contains('sidebar-open')) {
        closeMobileSidebar();
        return;
      }
      openMobileSidebar();
    });
  }

  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1020) {
      closeMobileSidebar();
    }
  });

  window.addEventListener('popstate', (event) => {
    const page = event.state && event.state.page ? event.state.page : getRequestedPage();
    navigate(page, false);
  });
}

async function start() {
  state.page = getRequestedPage();
  bindShellEvents();
  await fetchDeveloperSession();
  await navigate(state.page, false);
}

document.addEventListener('DOMContentLoaded', () => {
  start().catch(() => {
    handleUnauthorized();
  });
});

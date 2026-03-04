import { apiRequest, loadSession } from '/assets/js/api.js';
import { sanitizeText } from '/assets/js/utils/sanitize.js';

const state = {
  setupRequired: false,
  authenticated: false,
  next: '/developer/index.html',
  accessArea: 'staff'
};

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

function getAccessArea() {
  const params = getQueryParams();
  const area = params.get('area');
  return area === 'client' ? 'client' : 'staff';
}

function getNextPath() {
  const params = getQueryParams();
  const next = params.get('next');
  if (!next || !next.startsWith('/')) {
    return '/developer/index.html';
  }
  return next;
}

function showMessage(container, message, type = 'info') {
  if (!container) return;
  container.textContent = message;
  container.dataset.state = type;
}

function ensureRedirectIfAuthenticated() {
  if (state.authenticated && state.accessArea === 'staff') {
    window.location.href = state.next;
  }
}

function updateAccessUI() {
  const links = document.querySelectorAll('[data-access-link]');
  links.forEach((link) => {
    const isActive = link.dataset.accessLink === state.accessArea;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  const staffBlock = document.getElementById('staff-login-block');
  const clientBlock = document.getElementById('client-coming-soon');

  if (staffBlock && clientBlock) {
    const isClient = state.accessArea === 'client';
    staffBlock.hidden = isClient;
    clientBlock.hidden = !isClient;
  }
}

function bindLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const message = document.getElementById('auth-message');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = sanitizeText(form.email.value, 160).toLowerCase();
    const password = typeof form.password.value === 'string' ? form.password.value : '';

    if (!email || !password) {
      showMessage(message, 'Informe e-mail e senha.', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      showMessage(message, 'Login realizado. Redirecionando...', 'success');
      window.location.href = state.next;
    } catch (error) {
      showMessage(message, error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
}

function updateSetupFieldVisibility() {
  const wrapper = document.getElementById('setup-code-wrapper');
  const input = document.getElementById('setupCode');
  if (!wrapper || !input) return;

  if (state.setupRequired) {
    wrapper.hidden = false;
    input.required = true;
    return;
  }

  wrapper.hidden = true;
  input.required = false;
}

function bindRegister() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const message = document.getElementById('auth-message');
  updateSetupFieldVisibility();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = sanitizeText(form.name.value, 80);
    const email = sanitizeText(form.email.value, 160).toLowerCase();
    const password = typeof form.password.value === 'string' ? form.password.value : '';
    const confirmPassword = typeof form.confirmPassword.value === 'string' ? form.confirmPassword.value : '';
    const setupCode = form.setupCode ? sanitizeText(form.setupCode.value, 80) : '';

    if (!name || !email || !password || !confirmPassword) {
      showMessage(message, 'Preencha todos os campos obrigatorios.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showMessage(message, 'As senhas nao conferem.', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const payload = { name, email, password, confirmPassword };
      if (state.setupRequired) {
        payload.setupCode = setupCode;
      }

      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: payload
      });

      showMessage(message, 'Conta criada com sucesso.', 'success');
      window.location.href = '/developer/index.html';
    } catch (error) {
      showMessage(message, error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function initAuthPage() {
  state.next = getNextPath();
  state.accessArea = getAccessArea();

  try {
    const session = await loadSession();
    state.authenticated = Boolean(session.authenticated);
    state.setupRequired = Boolean(session.setupRequired);
  } catch {
    state.authenticated = false;
    state.setupRequired = false;
  }

  const pageType = document.body.dataset.page;

  if (pageType === 'login') {
    updateAccessUI();

    if (state.accessArea === 'client') {
      showMessage(
        document.getElementById('auth-message'),
        'Area de clientes ainda nao esta habilitada. Use o acesso de Funcionarios/Dev.',
        'info'
      );
      return;
    }

    ensureRedirectIfAuthenticated();
    bindLogin();
    return;
  }

  if (pageType === 'register') {
    if (state.accessArea === 'client') {
      window.location.href = '/auth/entrar.html?area=client';
      return;
    }

    if (!state.setupRequired && !state.authenticated) {
      const notice = document.getElementById('auth-notice');
      if (notice) {
        notice.textContent = 'Cadastro controlado: entre como administrador para criar novas contas internas.';
      }
    }

    bindRegister();
  }
}

document.addEventListener('DOMContentLoaded', initAuthPage);

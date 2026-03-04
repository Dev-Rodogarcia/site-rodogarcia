import { apiRequest, loadSession } from '/assets/js/api.js';

export async function requireAdminSession() {
  const session = await loadSession();

  if (!session.authenticated) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth/entrar.html?next=${next}`;
    throw new Error('Sessao nao autenticada.');
  }

  return session;
}

export function bindLogout(buttonId = 'logout-btn') {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', body: {} });
    } catch {
      // Nao interrompe fluxo de saida.
    }

    window.location.href = '/auth/entrar.html';
  });
}

export function renderCurrentUser(session, selector = '#session-user') {
  const target = document.querySelector(selector);
  if (!target || !session || !session.user) return;

  target.textContent = `${session.user.name} (${session.user.email})`;
}

export function showPanelMessage(message, type = 'info') {
  const target = document.getElementById('panel-message');
  if (!target) return;

  target.textContent = message;
  target.dataset.state = type;
}

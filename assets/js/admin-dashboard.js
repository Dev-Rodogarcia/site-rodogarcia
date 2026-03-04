import { requireAdminSession, bindLogout, renderCurrentUser } from '/assets/js/admin-common.js';

async function initDashboard() {
  const session = await requireAdminSession();
  renderCurrentUser(session);
  bindLogout();
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard().catch(() => {
    // Redirecionamento tratado no guard.
  });
});

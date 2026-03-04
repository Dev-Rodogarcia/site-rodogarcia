import { apiRequest } from '/assets/js/api.js';
import { sanitizeText, sanitizeUrl } from '/assets/js/utils/sanitize.js';
import { clearElement, createElement } from '/assets/js/utils/dom.js';
import { requireAdminSession, bindLogout, renderCurrentUser, showPanelMessage } from '/assets/js/admin-common.js';

const state = {
  heroSlides: [],
  dnaSlides: []
};

function byOrder(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function sortCollection(collection) {
  return [...collection].sort(byOrder);
}

function normalizeButtons(rawButtons) {
  const buttons = Array.isArray(rawButtons) ? rawButtons.slice(0, 2) : [];
  const output = [];

  for (let i = 0; i < 2; i += 1) {
    const current = buttons[i] || {};
    output.push({
      label: sanitizeText(current.label || '', 40),
      url: sanitizeUrl(current.url || ''),
      enabled: Boolean(current.enabled)
    });
  }

  return output;
}

function resetHeroForm() {
  const form = document.getElementById('hero-form');
  if (!form) return;
  form.reset();
  form.heroId.value = '';
  form.heroActive.checked = true;
  form.heroBtn1Enabled.checked = false;
  form.heroBtn2Enabled.checked = false;
}

function resetDnaForm() {
  const form = document.getElementById('dna-form');
  if (!form) return;
  form.reset();
  form.dnaId.value = '';
  form.dnaActive.checked = true;
}

function fillHeroForm(item) {
  const form = document.getElementById('hero-form');
  if (!form || !item) return;

  const buttons = normalizeButtons(item.buttons);
  form.heroId.value = item.id;
  form.heroTitle.value = item.title || '';
  form.heroDescription.value = item.description || '';
  form.heroImage.value = item.image || '';
  form.heroActive.checked = Boolean(item.active);
  form.heroBtn1Text.value = buttons[0].label || '';
  form.heroBtn1Url.value = buttons[0].url || '';
  form.heroBtn1Enabled.checked = Boolean(buttons[0].enabled);
  form.heroBtn2Text.value = buttons[1].label || '';
  form.heroBtn2Url.value = buttons[1].url || '';
  form.heroBtn2Enabled.checked = Boolean(buttons[1].enabled);
}

function fillDnaForm(item) {
  const form = document.getElementById('dna-form');
  if (!form || !item) return;

  form.dnaId.value = item.id;
  form.dnaTitle.value = item.title || '';
  form.dnaText.value = item.text || '';
  form.dnaImage.value = item.image || '';
  form.dnaActive.checked = Boolean(item.active);
}

function buildHeroPayload(form) {
  return {
    title: sanitizeText(form.heroTitle.value, 120),
    description: sanitizeText(form.heroDescription.value, 420),
    image: sanitizeUrl(form.heroImage.value),
    active: form.heroActive.checked,
    buttons: [
      {
        label: sanitizeText(form.heroBtn1Text.value, 40),
        url: sanitizeUrl(form.heroBtn1Url.value),
        enabled: form.heroBtn1Enabled.checked
      },
      {
        label: sanitizeText(form.heroBtn2Text.value, 40),
        url: sanitizeUrl(form.heroBtn2Url.value),
        enabled: form.heroBtn2Enabled.checked
      }
    ]
  };
}

function buildDnaPayload(form) {
  return {
    title: sanitizeText(form.dnaTitle.value, 120),
    text: sanitizeText(form.dnaText.value, 420),
    image: sanitizeUrl(form.dnaImage.value),
    active: form.dnaActive.checked
  };
}

function createActionButton(label, handler) {
  const button = createElement('button', 'btn-small', label);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

async function reorderEntity(entity, items, itemId, direction) {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) return;

  const ordered = [...items];
  const [picked] = ordered.splice(index, 1);
  ordered.splice(targetIndex, 0, picked);

  const orderedIds = ordered.map((item) => item.id);
  const response = await apiRequest(`/api/admin/${entity}/reorder`, {
    method: 'POST',
    body: { orderedIds }
  });

  if (entity === 'hero') {
    state.heroSlides = sortCollection(response.items || []);
    renderHeroList();
  }

  if (entity === 'dna') {
    state.dnaSlides = sortCollection(response.items || []);
    renderDnaList();
  }
}

async function toggleEntityActive(entity, item) {
  const payload = { ...item, active: !item.active };
  const response = await apiRequest(`/api/admin/${entity}/${item.id}`, {
    method: 'PUT',
    body: payload
  });

  if (entity === 'hero') {
    state.heroSlides = sortCollection(response.items || []);
    renderHeroList();
  }

  if (entity === 'dna') {
    state.dnaSlides = sortCollection(response.items || []);
    renderDnaList();
  }
}

async function deleteEntity(entity, itemId) {
  const response = await apiRequest(`/api/admin/${entity}/${itemId}`, {
    method: 'DELETE',
    body: {}
  });

  if (entity === 'hero') {
    state.heroSlides = sortCollection(response.items || []);
    renderHeroList();
    return;
  }

  if (entity === 'dna') {
    state.dnaSlides = sortCollection(response.items || []);
    renderDnaList();
  }
}

function createListMeta(item, subtitle) {
  const wrapper = createElement('div', 'item-meta');
  const title = createElement('strong', '', item.title || 'Sem titulo');
  const text = createElement('p', '', subtitle);
  wrapper.append(title, text);
  return wrapper;
}

function createItemContainer(item, subtitle) {
  const li = createElement('li', 'admin-item');
  li.dataset.id = item.id;

  const status = createElement('span', `status-pill ${item.active ? 'on' : 'off'}`, item.active ? 'Ativo' : 'Inativo');
  const head = createElement('div', 'item-head');
  head.append(createListMeta(item, subtitle), status);

  li.appendChild(head);
  return li;
}

function renderHeroList() {
  const list = document.getElementById('hero-list');
  if (!list) return;

  clearElement(list);

  state.heroSlides.forEach((item) => {
    const subtitle = `${item.description || ''} | Ordem: ${item.order}`;
    const li = createItemContainer(item, subtitle);

    const actions = createElement('div', 'item-actions');
    actions.append(
      createActionButton('Editar', () => fillHeroForm(item)),
      createActionButton('Ativar/Desativar', async () => {
        await toggleEntityActive('hero', item);
      }),
      createActionButton('Subir', async () => {
        await reorderEntity('hero', state.heroSlides, item.id, -1);
      }),
      createActionButton('Descer', async () => {
        await reorderEntity('hero', state.heroSlides, item.id, 1);
      }),
      createActionButton('Excluir', async () => {
        if (!window.confirm('Excluir slide Hero?')) return;
        await deleteEntity('hero', item.id);
      })
    );

    li.appendChild(actions);
    list.appendChild(li);
  });
}

function renderDnaList() {
  const list = document.getElementById('dna-list');
  if (!list) return;

  clearElement(list);

  state.dnaSlides.forEach((item) => {
    const subtitle = `${item.text || ''} | Ordem: ${item.order}`;
    const li = createItemContainer(item, subtitle);

    const actions = createElement('div', 'item-actions');
    actions.append(
      createActionButton('Editar', () => fillDnaForm(item)),
      createActionButton('Ativar/Desativar', async () => {
        await toggleEntityActive('dna', item);
      }),
      createActionButton('Subir', async () => {
        await reorderEntity('dna', state.dnaSlides, item.id, -1);
      }),
      createActionButton('Descer', async () => {
        await reorderEntity('dna', state.dnaSlides, item.id, 1);
      }),
      createActionButton('Excluir', async () => {
        if (!window.confirm('Excluir slide DNA?')) return;
        await deleteEntity('dna', item.id);
      })
    );

    li.appendChild(actions);
    list.appendChild(li);
  });
}

function bindHeroForm() {
  const form = document.getElementById('hero-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = buildHeroPayload(form);
    const isUpdate = Boolean(form.heroId.value);

    try {
      const response = isUpdate
        ? await apiRequest(`/api/admin/hero/${form.heroId.value}`, { method: 'PUT', body: payload })
        : await apiRequest('/api/admin/hero', { method: 'POST', body: payload });

      state.heroSlides = sortCollection(response.items || []);
      renderHeroList();
      resetHeroForm();
      showPanelMessage('Slide Hero salvo com sucesso.', 'success');
    } catch (error) {
      showPanelMessage(error.message, 'error');
    }
  });

  const clearBtn = document.getElementById('hero-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      resetHeroForm();
    });
  }
}

function bindDnaForm() {
  const form = document.getElementById('dna-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = buildDnaPayload(form);
    const isUpdate = Boolean(form.dnaId.value);

    try {
      const response = isUpdate
        ? await apiRequest(`/api/admin/dna/${form.dnaId.value}`, { method: 'PUT', body: payload })
        : await apiRequest('/api/admin/dna', { method: 'POST', body: payload });

      state.dnaSlides = sortCollection(response.items || []);
      renderDnaList();
      resetDnaForm();
      showPanelMessage('Slide DNA salvo com sucesso.', 'success');
    } catch (error) {
      showPanelMessage(error.message, 'error');
    }
  });

  const clearBtn = document.getElementById('dna-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      resetDnaForm();
    });
  }
}

async function loadContent() {
  const response = await apiRequest('/api/admin/content');
  state.heroSlides = sortCollection(response.content.heroSlides || []);
  state.dnaSlides = sortCollection(response.content.dnaSlides || []);
  renderHeroList();
  renderDnaList();
}

async function initPage() {
  const session = await requireAdminSession();
  renderCurrentUser(session);
  bindLogout();
  bindHeroForm();
  bindDnaForm();
  resetHeroForm();
  resetDnaForm();

  try {
    await loadContent();
  } catch (error) {
    showPanelMessage(error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPage().catch(() => {
    // Guard redireciona se sessao estiver invalida.
  });
});

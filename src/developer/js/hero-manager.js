import { apiRequest } from '/assets/js/api.js';
import { sanitizeText, sanitizeUrl } from '/assets/js/utils/sanitize.js';
import { clearElement, createElement } from '/assets/js/utils/dom.js';

const state = {
  heroSlides: []
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

function resetForm() {
  const form = document.getElementById('hero-form');
  if (!form) return;
  form.reset();
  form.heroId.value = '';
  form.heroActive.checked = true;
  form.heroBtn1Enabled.checked = false;
  form.heroBtn2Enabled.checked = false;
}

function fillForm(item) {
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

function buildPayload(form) {
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

function actionButton(label, className, handler) {
  const button = createElement('button', className, label);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

async function reorder(itemId, direction) {
  const index = state.heroSlides.findIndex((item) => item.id === itemId);
  if (index === -1) return;

  const target = index + direction;
  if (target < 0 || target >= state.heroSlides.length) return;

  const ordered = [...state.heroSlides];
  const [picked] = ordered.splice(index, 1);
  ordered.splice(target, 0, picked);

  const response = await apiRequest('/api/admin/hero/reorder', {
    method: 'POST',
    body: { orderedIds: ordered.map((item) => item.id) }
  });

  state.heroSlides = sortCollection(response.items || []);
  renderList();
}

async function toggleActive(item) {
  const response = await apiRequest(`/api/admin/hero/${item.id}`, {
    method: 'PUT',
    body: { ...item, active: !item.active }
  });

  state.heroSlides = sortCollection(response.items || []);
  renderList();
}

async function remove(itemId) {
  const response = await apiRequest(`/api/admin/hero/${itemId}`, {
    method: 'DELETE',
    body: {}
  });

  state.heroSlides = sortCollection(response.items || []);
  renderList();
}

function renderList() {
  const list = document.getElementById('hero-list');
  if (!list) return;

  clearElement(list);

  if (state.heroSlides.length === 0) {
    const empty = createElement('li', 'empty-state', 'Nenhum slide Hero cadastrado.');
    list.appendChild(empty);
    return;
  }

  state.heroSlides.forEach((item) => {
    const li = createElement('li', 'entity-item');

    const head = createElement('div', 'entity-item__head');
    const meta = createElement('div');
    const title = createElement('h4', 'entity-item__title', item.title || 'Sem titulo');
    const detail = createElement(
      'p',
      'entity-item__meta',
      `Ordem: ${item.order} | Botoes ativos: ${
        (Array.isArray(item.buttons) ? item.buttons : []).filter((button) => button.enabled).length
      }`
    );
    meta.append(title, detail);

    const pills = createElement('div', 'status-pills');
    pills.appendChild(
      createElement('span', `status-pill ${item.active ? 'on' : 'off'}`, item.active ? 'Ativo' : 'Inativo')
    );

    head.append(meta, pills);

    const actions = createElement('div', 'entity-item__actions');
    actions.append(
      actionButton('Editar', 'btn-secondary', () => fillForm(item)),
      actionButton(item.active ? 'Desativar' : 'Ativar', 'btn-ghost', async () => {
        await toggleActive(item);
      }),
      actionButton('Subir', 'btn-ghost', async () => {
        await reorder(item.id, -1);
      }),
      actionButton('Descer', 'btn-ghost', async () => {
        await reorder(item.id, 1);
      }),
      actionButton('Excluir', 'btn-danger', async () => {
        if (!window.confirm('Excluir slide Hero?')) return;
        await remove(item.id);
      })
    );

    li.append(head, actions);
    list.appendChild(li);
  });
}

function bindForm(context) {
  const form = document.getElementById('hero-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = buildPayload(form);
    const isUpdate = Boolean(form.heroId.value);

    try {
      const response = isUpdate
        ? await apiRequest(`/api/admin/hero/${form.heroId.value}`, { method: 'PUT', body: payload })
        : await apiRequest('/api/admin/hero', { method: 'POST', body: payload });

      state.heroSlides = sortCollection(response.items || []);
      renderList();
      resetForm();
      context.flash('Slide Hero salvo com sucesso.', 'success');
    } catch (error) {
      if (error && error.status === 401) {
        context.onUnauthorized();
        return;
      }
      context.flash(error.message || 'Falha ao salvar slide Hero.', 'error');
    }
  });

  const clearButton = document.getElementById('hero-clear-btn');
  if (clearButton) {
    clearButton.addEventListener('click', resetForm);
  }
}

async function loadData(context) {
  try {
    const response = await apiRequest('/api/admin/content');
    state.heroSlides = sortCollection(response.content.heroSlides || []);
    renderList();
  } catch (error) {
    if (error && error.status === 401) {
      context.onUnauthorized();
      return;
    }
    context.flash(error.message || 'Falha ao carregar slides Hero.', 'error');
  }
}

export async function initHeroManager(context) {
  resetForm();
  bindForm(context);
  await loadData(context);
}

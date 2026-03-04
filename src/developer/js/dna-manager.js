import { apiRequest } from '/assets/js/api.js';
import { sanitizeText, sanitizeUrl } from '/assets/js/utils/sanitize.js';
import { clearElement, createElement } from '/assets/js/utils/dom.js';

const state = {
  dnaSlides: []
};

function byOrder(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function sortCollection(collection) {
  return [...collection].sort(byOrder);
}

function resetForm() {
  const form = document.getElementById('dna-form');
  if (!form) return;
  form.reset();
  form.dnaId.value = '';
  form.dnaActive.checked = true;
}

function fillForm(item) {
  const form = document.getElementById('dna-form');
  if (!form || !item) return;
  form.dnaId.value = item.id;
  form.dnaTitle.value = item.title || '';
  form.dnaText.value = item.text || '';
  form.dnaImage.value = item.image || '';
  form.dnaActive.checked = Boolean(item.active);
}

function buildPayload(form) {
  return {
    title: sanitizeText(form.dnaTitle.value, 120),
    text: sanitizeText(form.dnaText.value, 420),
    image: sanitizeUrl(form.dnaImage.value),
    active: form.dnaActive.checked
  };
}

function actionButton(label, className, handler) {
  const button = createElement('button', className, label);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

async function reorder(itemId, direction) {
  const index = state.dnaSlides.findIndex((item) => item.id === itemId);
  if (index === -1) return;

  const target = index + direction;
  if (target < 0 || target >= state.dnaSlides.length) return;

  const ordered = [...state.dnaSlides];
  const [picked] = ordered.splice(index, 1);
  ordered.splice(target, 0, picked);

  const response = await apiRequest('/api/admin/dna/reorder', {
    method: 'POST',
    body: { orderedIds: ordered.map((item) => item.id) }
  });

  state.dnaSlides = sortCollection(response.items || []);
  renderList();
}

async function toggleActive(item) {
  const response = await apiRequest(`/api/admin/dna/${item.id}`, {
    method: 'PUT',
    body: { ...item, active: !item.active }
  });

  state.dnaSlides = sortCollection(response.items || []);
  renderList();
}

async function remove(itemId) {
  const response = await apiRequest(`/api/admin/dna/${itemId}`, {
    method: 'DELETE',
    body: {}
  });

  state.dnaSlides = sortCollection(response.items || []);
  renderList();
}

function renderList() {
  const list = document.getElementById('dna-list');
  if (!list) return;

  clearElement(list);

  if (state.dnaSlides.length === 0) {
    const empty = createElement('li', 'empty-state', 'Nenhum slide DNA cadastrado.');
    list.appendChild(empty);
    return;
  }

  state.dnaSlides.forEach((item) => {
    const li = createElement('li', 'entity-item');

    const head = createElement('div', 'entity-item__head');
    const meta = createElement('div');
    const title = createElement('h4', 'entity-item__title', item.title || 'Sem titulo');
    const detail = createElement('p', 'entity-item__meta', `Ordem: ${item.order}`);
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
        if (!window.confirm('Excluir slide DNA?')) return;
        await remove(item.id);
      })
    );

    li.append(head, actions);
    list.appendChild(li);
  });
}

function bindForm(context) {
  const form = document.getElementById('dna-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = buildPayload(form);
    const isUpdate = Boolean(form.dnaId.value);

    try {
      const response = isUpdate
        ? await apiRequest(`/api/admin/dna/${form.dnaId.value}`, { method: 'PUT', body: payload })
        : await apiRequest('/api/admin/dna', { method: 'POST', body: payload });

      state.dnaSlides = sortCollection(response.items || []);
      renderList();
      resetForm();
      context.flash('Slide DNA salvo com sucesso.', 'success');
    } catch (error) {
      if (error && error.status === 401) {
        context.onUnauthorized();
        return;
      }
      context.flash(error.message || 'Falha ao salvar slide DNA.', 'error');
    }
  });

  const clearButton = document.getElementById('dna-clear-btn');
  if (clearButton) {
    clearButton.addEventListener('click', resetForm);
  }
}

async function loadData(context) {
  try {
    const response = await apiRequest('/api/admin/content');
    state.dnaSlides = sortCollection(response.content.dnaSlides || []);
    renderList();
  } catch (error) {
    if (error && error.status === 401) {
      context.onUnauthorized();
      return;
    }
    context.flash(error.message || 'Falha ao carregar slides DNA.', 'error');
  }
}

export async function initDnaManager(context) {
  resetForm();
  bindForm(context);
  await loadData(context);
}

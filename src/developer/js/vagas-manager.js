import { apiRequest } from '/assets/js/api.js';
import { sanitizeText, sanitizeUrl } from '/assets/js/utils/sanitize.js';
import { clearElement, createElement } from '/assets/js/utils/dom.js';

const state = {
  vagas: []
};

function byOrder(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function sortCollection(collection) {
  return [...collection].sort(byOrder);
}

function resetForm() {
  const form = document.getElementById('vaga-form');
  if (!form) return;

  form.reset();
  form.vagaId.value = '';
  form.vagaStatus.value = 'Novo';
  form.vagaWorkType.value = 'Presencial';
  form.vagaContractType.value = 'Integral';
  form.vagaFeatured.checked = true;
  form.vagaActive.checked = true;
}

function fillForm(vaga) {
  const form = document.getElementById('vaga-form');
  if (!form || !vaga) return;

  form.vagaId.value = vaga.id;
  form.vagaTitle.value = vaga.title || '';
  form.vagaStatus.value = vaga.status || 'Novo';
  form.vagaLocation.value = vaga.location || '';
  form.vagaWorkType.value = vaga.workType || 'Presencial';
  form.vagaContractType.value = vaga.contractType || 'Integral';
  form.vagaDescription.value = vaga.description || '';
  form.vagaApplyUrl.value = vaga.applyUrl || '';
  form.vagaFeatured.checked = Boolean(vaga.featured);
  form.vagaActive.checked = Boolean(vaga.active);
}

function buildPayload(form) {
  return {
    title: sanitizeText(form.vagaTitle.value, 120),
    status: sanitizeText(form.vagaStatus.value, 20),
    location: sanitizeText(form.vagaLocation.value, 120),
    workType: sanitizeText(form.vagaWorkType.value, 30),
    contractType: sanitizeText(form.vagaContractType.value, 30),
    description: sanitizeText(form.vagaDescription.value, 600),
    applyUrl: sanitizeUrl(form.vagaApplyUrl.value),
    featured: form.vagaFeatured.checked,
    active: form.vagaActive.checked
  };
}

function actionButton(label, className, handler) {
  const button = createElement('button', className, label);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

async function reorder(itemId, direction) {
  const index = state.vagas.findIndex((item) => item.id === itemId);
  if (index === -1) return;

  const target = index + direction;
  if (target < 0 || target >= state.vagas.length) return;

  const ordered = [...state.vagas];
  const [picked] = ordered.splice(index, 1);
  ordered.splice(target, 0, picked);

  const response = await apiRequest('/api/admin/vagas/reorder', {
    method: 'POST',
    body: { orderedIds: ordered.map((item) => item.id) }
  });

  state.vagas = sortCollection(response.items || []);
  renderList();
}

async function updateItem(item) {
  const response = await apiRequest(`/api/admin/vagas/${item.id}`, {
    method: 'PUT',
    body: item
  });

  state.vagas = sortCollection(response.items || []);
  renderList();
}

async function remove(itemId) {
  const response = await apiRequest(`/api/admin/vagas/${itemId}`, {
    method: 'DELETE',
    body: {}
  });

  state.vagas = sortCollection(response.items || []);
  renderList();
}

function renderList() {
  const list = document.getElementById('vagas-list');
  if (!list) return;

  clearElement(list);

  if (state.vagas.length === 0) {
    const empty = createElement('li', 'empty-state', 'Nenhuma vaga cadastrada.');
    list.appendChild(empty);
    return;
  }

  state.vagas.forEach((item) => {
    const li = createElement('li', 'entity-item');

    const head = createElement('div', 'entity-item__head');
    const meta = createElement('div');
    const title = createElement('h4', 'entity-item__title', item.title || 'Sem titulo');
    const detail = createElement(
      'p',
      'entity-item__meta',
      `${item.location || ''} | ${item.status || ''} | Ordem: ${item.order}`
    );
    meta.append(title, detail);

    const pills = createElement('div', 'status-pills');
    pills.append(
      createElement('span', `status-pill ${item.active ? 'on' : 'off'}`, item.active ? 'Ativa' : 'Inativa'),
      createElement('span', `status-pill ${item.featured ? 'on' : 'warn'}`, item.featured ? 'Destaque' : 'Normal')
    );

    head.append(meta, pills);

    const actions = createElement('div', 'entity-item__actions');
    actions.append(
      actionButton('Editar', 'btn-secondary', () => fillForm(item)),
      actionButton(item.featured ? 'Tirar destaque' : 'Destacar', 'btn-ghost', async () => {
        await updateItem({ ...item, featured: !item.featured });
      }),
      actionButton(item.active ? 'Desativar' : 'Ativar', 'btn-ghost', async () => {
        await updateItem({ ...item, active: !item.active });
      }),
      actionButton('Subir', 'btn-ghost', async () => {
        await reorder(item.id, -1);
      }),
      actionButton('Descer', 'btn-ghost', async () => {
        await reorder(item.id, 1);
      }),
      actionButton('Excluir', 'btn-danger', async () => {
        if (!window.confirm('Excluir vaga?')) return;
        await remove(item.id);
      })
    );

    li.append(head, actions);
    list.appendChild(li);
  });
}

function bindForm(context) {
  const form = document.getElementById('vaga-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = buildPayload(form);
    const isUpdate = Boolean(form.vagaId.value);

    try {
      const response = isUpdate
        ? await apiRequest(`/api/admin/vagas/${form.vagaId.value}`, { method: 'PUT', body: payload })
        : await apiRequest('/api/admin/vagas', { method: 'POST', body: payload });

      state.vagas = sortCollection(response.items || []);
      renderList();
      resetForm();
      context.flash('Vaga salva com sucesso.', 'success');
    } catch (error) {
      if (error && error.status === 401) {
        context.onUnauthorized();
        return;
      }
      context.flash(error.message || 'Falha ao salvar vaga.', 'error');
    }
  });

  const clearButton = document.getElementById('vaga-clear-btn');
  if (clearButton) {
    clearButton.addEventListener('click', resetForm);
  }
}

async function loadData(context) {
  try {
    const response = await apiRequest('/api/admin/content');
    state.vagas = sortCollection(response.content.vagas || []);
    renderList();
  } catch (error) {
    if (error && error.status === 401) {
      context.onUnauthorized();
      return;
    }
    context.flash(error.message || 'Falha ao carregar vagas.', 'error');
  }
}

export async function initVagasManager(context) {
  resetForm();
  bindForm(context);
  await loadData(context);
}

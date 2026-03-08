/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/feedback-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Gerencia CRUD de feedbacks da pagina Servicos com ordenacao, ativacao e persistencia via API admin.

Responsabilidades:
- Validar/sanitizar campos do formulario antes de enviar para a API.
- Renderizar lista com acoes de editar, ativar/desativar, subir/descer e excluir.
- Sincronizar estado local (`estadoFeedbacks`) com o retorno oficial do backend.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js, /src/js/shared/utils/dom.js
- Endpoints/rotas: /api/admin/content, /api/admin/feedbacks, /api/admin/feedbacks/:id, /api/admin/feedbacks/reorder
- Classes/seletores/chaves: #feedback-form, #feedback-list, #feedback-clear-btn

Entradas e saidas:
- Entradas: submissao de formulario, clique em botoes de acao e carga inicial de dados.
- Saidas  : mutacao de DOM e requisicoes autenticadas para persistencia.

Elementos tecnicos: limparFormularioFeedback, preencherFormularioFeedback, montarPayloadFeedback, renderizarListaFeedbacks, vincularFormularioFeedback
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { criarElemento, limparElemento } from '/src/js/shared/utils/dom.js';

const estadoFeedbacks = {
  lista: []
};

function ordenarPorOrdem(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function ordenarColecao(colecao) {
  return [...colecao].sort(ordenarPorOrdem);
}

function limparFormularioFeedback() {
  const form = document.getElementById('feedback-form');
  if (!form) return;

  form.reset();
  form.feedbackId.value = '';
  form.feedbackResultadoIcon.value = '';
  form.feedbackResultadoTexto.value = '';
  form.feedbackActive.checked = true;
}

function preencherFormularioFeedback(item) {
  const form = document.getElementById('feedback-form');
  if (!form || !item) return;

  form.feedbackId.value = item.id;
  form.feedbackName.value = item.name || '';
  form.feedbackRole.value = item.role || '';
  form.feedbackCompany.value = item.company || '';
  form.feedbackComment.value = item.comment || '';
  form.feedbackPhoto.value = item.photo || '';
  form.feedbackResultadoIcon.value = item.resultadoIcon || '';
  form.feedbackResultadoTexto.value = item.resultadoTexto || '';
  form.feedbackActive.checked = Boolean(item.active);
}

function montarPayloadFeedback(form) {
  return {
    name: sanitizarTexto(form.feedbackName.value, 80),
    role: sanitizarTexto(form.feedbackRole.value, 80),
    company: sanitizarTexto(form.feedbackCompany.value, 120),
    comment: sanitizarTexto(form.feedbackComment.value, 800),
    photo: sanitizarUrl(form.feedbackPhoto.value),
    resultadoIcon: sanitizarTexto(form.feedbackResultadoIcon.value, 40),
    resultadoTexto: sanitizarTexto(form.feedbackResultadoTexto.value, 120),
    active: form.feedbackActive.checked
  };
}

function criarBotaoAcao(rotulo, classeCss, handler) {
  const botao = criarElemento('button', classeCss, rotulo);
  botao.type = 'button';
  botao.addEventListener('click', handler);
  return botao;
}

async function reordenarFeedback(itemId, direcao) {
  const indiceAtual = estadoFeedbacks.lista.findIndex((item) => item.id === itemId);
  if (indiceAtual === -1) return;

  const indiceDestino = indiceAtual + direcao;
  if (indiceDestino < 0 || indiceDestino >= estadoFeedbacks.lista.length) return;

  const ordenado = [...estadoFeedbacks.lista];
  const [selecionado] = ordenado.splice(indiceAtual, 1);
  ordenado.splice(indiceDestino, 0, selecionado);

  const response = await requisicaoApi('/api/admin/feedbacks/reorder', {
    method: 'POST',
    body: { orderedIds: ordenado.map((item) => item.id) }
  });

  estadoFeedbacks.lista = ordenarColecao(response.items || []);
  renderizarListaFeedbacks();
}

async function atualizarFeedback(item) {
  const response = await requisicaoApi(`/api/admin/feedbacks/${item.id}`, {
    method: 'PUT',
    body: item
  });

  estadoFeedbacks.lista = ordenarColecao(response.items || []);
  renderizarListaFeedbacks();
}

async function removerFeedback(itemId) {
  const response = await requisicaoApi(`/api/admin/feedbacks/${itemId}`, {
    method: 'DELETE',
    body: {}
  });

  estadoFeedbacks.lista = ordenarColecao(response.items || []);
  renderizarListaFeedbacks();
}

function renderizarListaFeedbacks() {
  const lista = document.getElementById('feedback-list');
  if (!lista) return;

  limparElemento(lista);

  if (estadoFeedbacks.lista.length === 0) {
    lista.appendChild(criarElemento('li', 'empty-state', 'Nenhum feedback cadastrado.'));
    return;
  }

  estadoFeedbacks.lista.forEach((item) => {
    const li = criarElemento('li', 'entity-item');

    const cabecalho = criarElemento('div', 'entity-item__head');
    const meta = criarElemento('div');
    const titulo = criarElemento('h4', 'entity-item__title', item.name || 'Sem nome');
    const detalhe = criarElemento(
      'p',
      'entity-item__meta',
      `${item.role || ''} - ${item.company || ''} | Ordem: ${item.order}`
    );
    meta.append(titulo, detalhe);

    const pills = criarElemento('div', 'status-pills');
    pills.append(
      criarElemento('span', `status-pill ${item.active ? 'on' : 'off'}`, item.active ? 'Ativo' : 'Inativo')
    );
    cabecalho.append(meta, pills);

    const comentario = criarElemento('p', 'entity-item__meta', item.comment || '');

    const acoes = criarElemento('div', 'entity-item__actions');
    acoes.append(
      criarBotaoAcao('Editar', 'btn-secondary', () => preencherFormularioFeedback(item)),
      criarBotaoAcao(item.active ? 'Desativar' : 'Ativar', 'btn-ghost', async () => {
        await atualizarFeedback({ ...item, active: !item.active });
      }),
      criarBotaoAcao('Subir', 'btn-ghost', async () => {
        await reordenarFeedback(item.id, -1);
      }),
      criarBotaoAcao('Descer', 'btn-ghost', async () => {
        await reordenarFeedback(item.id, 1);
      }),
      criarBotaoAcao('Excluir', 'btn-danger', async () => {
        if (!window.confirm('Excluir feedback?')) return;
        await removerFeedback(item.id);
      })
    );

    li.append(cabecalho, comentario, acoes);
    lista.appendChild(li);
  });
}

function vincularFormularioFeedback(contexto) {
  const form = document.getElementById('feedback-form');
  if (!form) return;

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const payload = montarPayloadFeedback(form);
    const ehAtualizacao = Boolean(form.feedbackId.value);

    try {
      const response = ehAtualizacao
        ? await requisicaoApi(`/api/admin/feedbacks/${form.feedbackId.value}`, { method: 'PUT', body: payload })
        : await requisicaoApi('/api/admin/feedbacks', { method: 'POST', body: payload });

      estadoFeedbacks.lista = ordenarColecao(response.items || []);
      renderizarListaFeedbacks();
      limparFormularioFeedback();
      contexto.flash('Feedback salvo com sucesso.', 'success');
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha ao salvar feedback.', 'error');
    }
  });

  const botaoLimpar = document.getElementById('feedback-clear-btn');
  if (botaoLimpar) {
    botaoLimpar.addEventListener('click', limparFormularioFeedback);
  }
}

async function carregarFeedbacks(contexto) {
  try {
    const response = await requisicaoApi('/api/admin/content');
    estadoFeedbacks.lista = ordenarColecao(response.content.feedbacks || []);
    renderizarListaFeedbacks();
  } catch (erro) {
    if (erro && erro.status === 401) {
      contexto.onUnauthorized();
      return;
    }
    contexto.flash(erro.message || 'Falha ao carregar feedbacks.', 'error');
  }
}

export async function iniciarGerenciadorFeedbacks(contexto) {
  limparFormularioFeedback();
  vincularFormularioFeedback(contexto);
  await carregarFeedbacks(contexto);
}

export const initFeedbackManager = iniciarGerenciadorFeedbacks;

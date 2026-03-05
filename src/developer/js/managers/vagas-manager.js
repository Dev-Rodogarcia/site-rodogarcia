/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/vagas-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js, /src/js/shared/utils/dom.js
- Endpoints/rotas: /api/admin/vagas/reorder, /api/admin/vagas, /api/admin/content
- Classes/seletores/chaves: #vaga-form, #vagas-list, #vaga-clear-btn

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: ordenarPorOrdem, ordenarColecao, limparFormularioVaga, preencherFormularioVaga, montarPayloadVaga, criarBotaoAcao, reordenarVaga, atualizarVaga, removerVaga, renderizarListaVagas
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { criarElemento, limparElemento } from '/src/js/shared/utils/dom.js';

const estadoVagas = {
  lista: []
};

function ordenarPorOrdem(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function ordenarColecao(colecao) {
  return [...colecao].sort(ordenarPorOrdem);
}

function limparFormularioVaga() {
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

function preencherFormularioVaga(vaga) {
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

function montarPayloadVaga(form) {
  return {
    title: sanitizarTexto(form.vagaTitle.value, 120),
    status: sanitizarTexto(form.vagaStatus.value, 20),
    location: sanitizarTexto(form.vagaLocation.value, 120),
    workType: sanitizarTexto(form.vagaWorkType.value, 30),
    contractType: sanitizarTexto(form.vagaContractType.value, 30),
    description: sanitizarTexto(form.vagaDescription.value, 600),
    applyUrl: sanitizarUrl(form.vagaApplyUrl.value),
    featured: form.vagaFeatured.checked,
    active: form.vagaActive.checked
  };
}

function criarBotaoAcao(rotulo, classeCss, handler) {
  const botao = criarElemento('button', classeCss, rotulo);
  botao.type = 'button';
  botao.addEventListener('click', handler);
  return botao;
}

async function reordenarVaga(itemId, direcao) {
  const indiceAtual = estadoVagas.lista.findIndex((item) => item.id === itemId);
  if (indiceAtual === -1) return;

  const indiceDestino = indiceAtual + direcao;
  if (indiceDestino < 0 || indiceDestino >= estadoVagas.lista.length) return;

  const ordenado = [...estadoVagas.lista];
  const [selecionado] = ordenado.splice(indiceAtual, 1);
  ordenado.splice(indiceDestino, 0, selecionado);

  const response = await requisicaoApi('/api/admin/vagas/reorder', {
    method: 'POST',
    body: { orderedIds: ordenado.map((item) => item.id) }
  });

  estadoVagas.lista = ordenarColecao(response.items || []);
  renderizarListaVagas();
}

async function atualizarVaga(item) {
  const response = await requisicaoApi(`/api/admin/vagas/${item.id}`, {
    method: 'PUT',
    body: item
  });

  estadoVagas.lista = ordenarColecao(response.items || []);
  renderizarListaVagas();
}

async function removerVaga(itemId) {
  const response = await requisicaoApi(`/api/admin/vagas/${itemId}`, {
    method: 'DELETE',
    body: {}
  });

  estadoVagas.lista = ordenarColecao(response.items || []);
  renderizarListaVagas();
}

function renderizarListaVagas() {
  const lista = document.getElementById('vagas-list');
  if (!lista) return;

  limparElemento(lista);

  if (estadoVagas.lista.length === 0) {
    lista.appendChild(criarElemento('li', 'empty-state', 'Nenhuma vaga cadastrada.'));
    return;
  }

  estadoVagas.lista.forEach((item) => {
    const li = criarElemento('li', 'entity-item');

    const cabecalho = criarElemento('div', 'entity-item__head');
    const meta = criarElemento('div');
    const titulo = criarElemento('h4', 'entity-item__title', item.title || 'Sem titulo');
    const detalhe = criarElemento(
      'p',
      'entity-item__meta',
      `${item.location || ''} | ${item.status || ''} | Ordem: ${item.order}`
    );
    meta.append(titulo, detalhe);

    const pills = criarElemento('div', 'status-pills');
    pills.append(
      criarElemento('span', `status-pill ${item.active ? 'on' : 'off'}`, item.active ? 'Ativa' : 'Inativa'),
      criarElemento('span', `status-pill ${item.featured ? 'on' : 'warn'}`, item.featured ? 'Destaque' : 'Normal')
    );
    cabecalho.append(meta, pills);

    const acoes = criarElemento('div', 'entity-item__actions');
    acoes.append(
      criarBotaoAcao('Editar', 'btn-secondary', () => preencherFormularioVaga(item)),
      criarBotaoAcao(item.featured ? 'Tirar destaque' : 'Destacar', 'btn-ghost', async () => {
        await atualizarVaga({ ...item, featured: !item.featured });
      }),
      criarBotaoAcao(item.active ? 'Desativar' : 'Ativar', 'btn-ghost', async () => {
        await atualizarVaga({ ...item, active: !item.active });
      }),
      criarBotaoAcao('Subir', 'btn-ghost', async () => {
        await reordenarVaga(item.id, -1);
      }),
      criarBotaoAcao('Descer', 'btn-ghost', async () => {
        await reordenarVaga(item.id, 1);
      }),
      criarBotaoAcao('Excluir', 'btn-danger', async () => {
        if (!window.confirm('Excluir vaga?')) return;
        await removerVaga(item.id);
      })
    );

    li.append(cabecalho, acoes);
    lista.appendChild(li);
  });
}

function vincularFormularioVaga(contexto) {
  const form = document.getElementById('vaga-form');
  if (!form) return;

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const payload = montarPayloadVaga(form);
    const ehAtualizacao = Boolean(form.vagaId.value);

    try {
      const response = ehAtualizacao
        ? await requisicaoApi(`/api/admin/vagas/${form.vagaId.value}`, { method: 'PUT', body: payload })
        : await requisicaoApi('/api/admin/vagas', { method: 'POST', body: payload });

      estadoVagas.lista = ordenarColecao(response.items || []);
      renderizarListaVagas();
      limparFormularioVaga();
      contexto.flash('Vaga salva com sucesso.', 'success');
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha ao salvar vaga.', 'error');
    }
  });

  const botaoLimpar = document.getElementById('vaga-clear-btn');
  if (botaoLimpar) {
    botaoLimpar.addEventListener('click', limparFormularioVaga);
  }
}

async function carregarVagas(contexto) {
  try {
    const response = await requisicaoApi('/api/admin/content');
    estadoVagas.lista = ordenarColecao(response.content.vagas || []);
    renderizarListaVagas();
  } catch (erro) {
    if (erro && erro.status === 401) {
      contexto.onUnauthorized();
      return;
    }
    contexto.flash(erro.message || 'Falha ao carregar vagas.', 'error');
  }
}

export async function iniciarGerenciadorVagas(contexto) {
  limparFormularioVaga();
  vincularFormularioVaga(contexto);
  await carregarVagas(contexto);
}

// Alias de compatibilidade.
export const initVagasManager = iniciarGerenciadorVagas;


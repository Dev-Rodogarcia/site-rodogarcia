/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/dna-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js, /src/js/shared/utils/dom.js
- Endpoints/rotas: /api/admin/dna/reorder, /api/admin/dna, /api/admin/content
- Classes/seletores/chaves: #dna-form, #dna-list, #dna-clear-btn

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: ordenarPorOrdem, ordenarColecao, limparFormularioDna, preencherFormularioDna, montarPayloadDna, criarBotaoAcao, reordenarSlideDna, alternarSlideDnaAtivo, removerSlideDna, renderizarListaDna
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { criarElemento, limparElemento } from '/src/js/shared/utils/dom.js';

const estadoDna = {
  slides: []
};

function ordenarPorOrdem(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function ordenarColecao(colecao) {
  return [...colecao].sort(ordenarPorOrdem);
}

function limparFormularioDna() {
  const form = document.getElementById('dna-form');
  if (!form) return;
  form.reset();
  form.dnaId.value = '';
  form.dnaActive.checked = true;
}

function preencherFormularioDna(item) {
  const form = document.getElementById('dna-form');
  if (!form || !item) return;
  form.dnaId.value = item.id;
  form.dnaTitle.value = item.title || '';
  form.dnaText.value = item.text || '';
  form.dnaImage.value = item.image || '';
  form.dnaActive.checked = Boolean(item.active);
}

function montarPayloadDna(form) {
  return {
    title: sanitizarTexto(form.dnaTitle.value, 120),
    text: sanitizarTexto(form.dnaText.value, 420),
    image: sanitizarUrl(form.dnaImage.value),
    active: form.dnaActive.checked
  };
}

function criarBotaoAcao(rotulo, classeCss, handler) {
  const botao = criarElemento('button', classeCss, rotulo);
  botao.type = 'button';
  botao.addEventListener('click', handler);
  return botao;
}

async function reordenarSlideDna(itemId, direcao) {
  const indiceAtual = estadoDna.slides.findIndex((item) => item.id === itemId);
  if (indiceAtual === -1) return;

  const indiceDestino = indiceAtual + direcao;
  if (indiceDestino < 0 || indiceDestino >= estadoDna.slides.length) return;

  const ordenado = [...estadoDna.slides];
  const [selecionado] = ordenado.splice(indiceAtual, 1);
  ordenado.splice(indiceDestino, 0, selecionado);

  const response = await requisicaoApi('/api/admin/dna/reorder', {
    method: 'POST',
    body: { orderedIds: ordenado.map((item) => item.id) }
  });

  estadoDna.slides = ordenarColecao(response.items || []);
  renderizarListaDna();
}

async function alternarSlideDnaAtivo(item) {
  const response = await requisicaoApi(`/api/admin/dna/${item.id}`, {
    method: 'PUT',
    body: { ...item, active: !item.active }
  });
  estadoDna.slides = ordenarColecao(response.items || []);
  renderizarListaDna();
}

async function removerSlideDna(itemId) {
  const response = await requisicaoApi(`/api/admin/dna/${itemId}`, {
    method: 'DELETE',
    body: {}
  });
  estadoDna.slides = ordenarColecao(response.items || []);
  renderizarListaDna();
}

function renderizarListaDna() {
  const lista = document.getElementById('dna-list');
  if (!lista) return;

  limparElemento(lista);

  if (estadoDna.slides.length === 0) {
    lista.appendChild(criarElemento('li', 'empty-state', 'Nenhum slide DNA cadastrado.'));
    return;
  }

  estadoDna.slides.forEach((item) => {
    const li = criarElemento('li', 'entity-item');

    const cabecalho = criarElemento('div', 'entity-item__head');
    const meta = criarElemento('div');
    const titulo = criarElemento('h4', 'entity-item__title', item.title || 'Sem titulo');
    const detalhe = criarElemento('p', 'entity-item__meta', `Ordem: ${item.order}`);
    meta.append(titulo, detalhe);

    const pills = criarElemento('div', 'status-pills');
    pills.appendChild(
      criarElemento('span', `status-pill ${item.active ? 'on' : 'off'}`, item.active ? 'Ativo' : 'Inativo')
    );
    cabecalho.append(meta, pills);

    const acoes = criarElemento('div', 'entity-item__actions');
    acoes.append(
      criarBotaoAcao('Editar', 'btn-secondary', () => preencherFormularioDna(item)),
      criarBotaoAcao(item.active ? 'Desativar' : 'Ativar', 'btn-ghost', async () => {
        await alternarSlideDnaAtivo(item);
      }),
      criarBotaoAcao('Subir', 'btn-ghost', async () => {
        await reordenarSlideDna(item.id, -1);
      }),
      criarBotaoAcao('Descer', 'btn-ghost', async () => {
        await reordenarSlideDna(item.id, 1);
      }),
      criarBotaoAcao('Excluir', 'btn-danger', async () => {
        if (!window.confirm('Excluir slide DNA?')) return;
        await removerSlideDna(item.id);
      })
    );

    li.append(cabecalho, acoes);
    lista.appendChild(li);
  });
}

function vincularFormularioDna(contexto) {
  const form = document.getElementById('dna-form');
  if (!form) return;

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const payload = montarPayloadDna(form);
    const ehAtualizacao = Boolean(form.dnaId.value);

    try {
      const response = ehAtualizacao
        ? await requisicaoApi(`/api/admin/dna/${form.dnaId.value}`, { method: 'PUT', body: payload })
        : await requisicaoApi('/api/admin/dna', { method: 'POST', body: payload });

      estadoDna.slides = ordenarColecao(response.items || []);
      renderizarListaDna();
      limparFormularioDna();
      contexto.flash('Slide DNA salvo com sucesso.', 'success');
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha ao salvar slide DNA.', 'error');
    }
  });

  const botaoLimpar = document.getElementById('dna-clear-btn');
  if (botaoLimpar) {
    botaoLimpar.addEventListener('click', limparFormularioDna);
  }
}

async function carregarSlidesDna(contexto) {
  try {
    const response = await requisicaoApi('/api/admin/content');
    estadoDna.slides = ordenarColecao(response.content.dnaSlides || []);
    renderizarListaDna();
  } catch (erro) {
    if (erro && erro.status === 401) {
      contexto.onUnauthorized();
      return;
    }
    contexto.flash(erro.message || 'Falha ao carregar slides DNA.', 'error');
  }
}

export async function iniciarGerenciadorDna(contexto) {
  limparFormularioDna();
  vincularFormularioDna(contexto);
  await carregarSlidesDna(contexto);
}

// Alias de compatibilidade.
export const initDnaManager = iniciarGerenciadorDna;


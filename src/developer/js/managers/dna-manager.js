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

const DNA_LAYOUT_TEXT_IMAGE = 'text-image';
const DNA_LAYOUT_FULL_IMAGE = 'full-image';

function normalizarLayoutDna(valor) {
  return String(valor || '').trim().toLowerCase() === DNA_LAYOUT_FULL_IMAGE
    ? DNA_LAYOUT_FULL_IMAGE
    : DNA_LAYOUT_TEXT_IMAGE;
}

function obterLayoutSelecionado(form) {
  const selecionado = form.querySelector('input[name="dnaLayoutMode"]:checked');
  return normalizarLayoutDna(selecionado ? selecionado.value : DNA_LAYOUT_TEXT_IMAGE);
}

function alternarDesabilitado(elemento, desabilitar) {
  if (!elemento) return;
  const campos = elemento.querySelectorAll('input, textarea, select, button');
  campos.forEach((campo) => {
    if (!(campo instanceof HTMLInputElement || campo instanceof HTMLTextAreaElement || campo instanceof HTMLSelectElement || campo instanceof HTMLButtonElement)) {
      return;
    }
    campo.disabled = Boolean(desabilitar);
  });
}

function atualizarVisibilidadeCamposDna(form) {
  if (!form) return;
  const layout = obterLayoutSelecionado(form);
  const modoImagemCompleta = layout === DNA_LAYOUT_FULL_IMAGE;
  const blocoTexto = document.getElementById('dna-text-field-wrap');
  if (blocoTexto) blocoTexto.hidden = modoImagemCompleta;
  alternarDesabilitado(blocoTexto, modoImagemCompleta);

  if (form.dnaText instanceof HTMLTextAreaElement) {
    form.dnaText.required = !modoImagemCompleta;
  }
  if (form.dnaTitle instanceof HTMLInputElement) {
    form.dnaTitle.required = true;
  }
}

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
  if (form.dnaLayoutTextImage) form.dnaLayoutTextImage.checked = true;
  if (form.dnaLayoutFullImage) form.dnaLayoutFullImage.checked = false;
  atualizarVisibilidadeCamposDna(form);
}

function preencherFormularioDna(item) {
  const form = document.getElementById('dna-form');
  if (!form || !item) return;
  const layout = normalizarLayoutDna(item.layoutMode);
  form.dnaId.value = item.id;
  form.dnaTitle.value = item.title || '';
  form.dnaText.value = item.text || '';
  form.dnaImage.value = item.image || '';
  form.dnaActive.checked = Boolean(item.active);
  if (form.dnaLayoutTextImage) form.dnaLayoutTextImage.checked = layout === DNA_LAYOUT_TEXT_IMAGE;
  if (form.dnaLayoutFullImage) form.dnaLayoutFullImage.checked = layout === DNA_LAYOUT_FULL_IMAGE;
  atualizarVisibilidadeCamposDna(form);
}

function montarPayloadDna(form) {
  const layoutMode = obterLayoutSelecionado(form);
  return {
    title: sanitizarTexto(form.dnaTitle.value, 120),
    text: sanitizarTexto(form.dnaText.value, 420),
    image: sanitizarUrl(form.dnaImage.value),
    active: form.dnaActive.checked,
    layoutMode
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
    const detalhe = criarElemento(
      'p',
      'entity-item__meta',
      `Ordem: ${item.order} | Layout: ${
        normalizarLayoutDna(item.layoutMode) === DNA_LAYOUT_FULL_IMAGE
          ? 'Imagem completa'
          : 'Texto + imagem'
      }`
    );
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

  form.querySelectorAll('input[name="dnaLayoutMode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      atualizarVisibilidadeCamposDna(form);
    });
  });

  atualizarVisibilidadeCamposDna(form);

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


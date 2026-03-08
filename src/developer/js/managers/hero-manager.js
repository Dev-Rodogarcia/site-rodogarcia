/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/hero-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js, /src/js/shared/utils/dom.js
- Endpoints/rotas: /api/admin/hero/reorder, /api/admin/hero, /api/admin/content
- Classes/seletores/chaves: #hero-form, #hero-list, #hero-clear-btn

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: ordenarPorOrdem, ordenarColecao, normalizarBotoesHero, limparFormularioHero, preencherFormularioHero, montarPayloadHero, criarBotaoAcao, reordenarSlideHero, alternarSlideHeroAtivo, removerSlideHero
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { criarElemento, limparElemento } from '/src/js/shared/utils/dom.js';

const estadoHero = {
  slides: []
};

const HERO_LAYOUT_TEXT_IMAGE = 'text-image';
const HERO_LAYOUT_FULL_IMAGE = 'full-image';

function normalizarLayoutHero(valor) {
  return String(valor || '').trim().toLowerCase() === HERO_LAYOUT_FULL_IMAGE
    ? HERO_LAYOUT_FULL_IMAGE
    : HERO_LAYOUT_TEXT_IMAGE;
}

function normalizarFundoHero(valor) {
  return String(valor || '').trim().toLowerCase() === 'straight'
    ? 'straight'
    : 'wavy';
}

function normalizarVarianteBotao(valor) {
  return String(valor || '').trim().toLowerCase() === 'outline'
    ? 'outline'
    : 'solid';
}

function sanitizarCorHex(valor) {
  const texto = String(valor || '').trim();
  const match = texto.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return '';

  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  return `#${hex}`.toUpperCase();
}

function corPadraoBotao1() {
  return '#FFFFFF';
}

function obterLayoutSelecionado(form) {
  const selecionado = form.querySelector('input[name="heroLayoutMode"]:checked');
  return normalizarLayoutHero(selecionado ? selecionado.value : HERO_LAYOUT_TEXT_IMAGE);
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

function atualizarVisibilidadeCamposHero(form) {
  if (!form) return;

  const layout = obterLayoutSelecionado(form);
  const modoImagemCompleta = layout === HERO_LAYOUT_FULL_IMAGE;
  const botoesSobreImagemAtivos = Boolean(form.heroFullButtonsEnabled && form.heroFullButtonsEnabled.checked);

  const blocoDescricao = document.getElementById('hero-description-wrap');
  const blocoFundo = document.getElementById('hero-full-background-wrap');
  const blocoOpcoesFull = document.getElementById('hero-full-options');
  const blocoBotoes = document.getElementById('hero-buttons-fields');

  if (blocoDescricao) blocoDescricao.hidden = modoImagemCompleta;
  if (blocoFundo) blocoFundo.hidden = !modoImagemCompleta;
  if (blocoOpcoesFull) blocoOpcoesFull.hidden = !modoImagemCompleta;

  const exibirBotoes = !modoImagemCompleta || botoesSobreImagemAtivos;
  if (blocoBotoes) blocoBotoes.hidden = !exibirBotoes;

  alternarDesabilitado(blocoDescricao, modoImagemCompleta);
  alternarDesabilitado(blocoFundo, !modoImagemCompleta);
  alternarDesabilitado(blocoOpcoesFull, !modoImagemCompleta);
  alternarDesabilitado(blocoBotoes, !exibirBotoes);

  if (form.heroDescription instanceof HTMLTextAreaElement) {
    form.heroDescription.required = !modoImagemCompleta;
  }
  if (form.heroTitle instanceof HTMLInputElement) {
    form.heroTitle.required = true;
  }
}

function ordenarPorOrdem(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

function ordenarColecao(colecao) {
  return [...colecao].sort(ordenarPorOrdem);
}

function normalizarBotoesHero(botoesBrutos) {
  const botoes = Array.isArray(botoesBrutos) ? botoesBrutos.slice(0, 2) : [];
  const saida = [];

  for (let i = 0; i < 2; i += 1) {
    const atual = botoes[i] || {};
    saida.push({
      label: sanitizarTexto(atual.label || '', 40),
      url: sanitizarUrl(atual.url || ''),
      enabled: Boolean(atual.enabled),
      color: sanitizarCorHex(atual.color || ''),
      variant: normalizarVarianteBotao(atual.variant || '')
    });
  }

  return saida;
}

function limparFormularioHero() {
  const form = document.getElementById('hero-form');
  if (!form) return;
  form.reset();
  form.heroId.value = '';
  form.heroActive.checked = true;
  if (form.heroLayoutTextImage) form.heroLayoutTextImage.checked = true;
  if (form.heroLayoutFullImage) form.heroLayoutFullImage.checked = false;
  if (form.heroFullBackgroundType) form.heroFullBackgroundType.value = 'wavy';
  if (form.heroFullButtonsEnabled) form.heroFullButtonsEnabled.checked = false;
  form.heroBtn1Enabled.checked = false;
  form.heroBtn2Enabled.checked = false;
  if (form.heroBtn1Color) form.heroBtn1Color.value = corPadraoBotao1();
  if (form.heroBtn2Outline) form.heroBtn2Outline.checked = true;
  atualizarVisibilidadeCamposHero(form);
}

function preencherFormularioHero(item) {
  const form = document.getElementById('hero-form');
  if (!form || !item) return;

  const botoes = normalizarBotoesHero(item.buttons);
  const layout = normalizarLayoutHero(item.layoutMode);
  form.heroId.value = item.id;
  form.heroTitle.value = item.title || '';
  form.heroDescription.value = item.description || '';
  form.heroImage.value = item.image || '';
  if (form.heroDesktopImage) form.heroDesktopImage.value = item.desktopImage || '';
  if (form.heroMobileImage) form.heroMobileImage.value = item.mobileImage || '';
  form.heroActive.checked = Boolean(item.active);
  if (form.heroLayoutTextImage) form.heroLayoutTextImage.checked = layout === HERO_LAYOUT_TEXT_IMAGE;
  if (form.heroLayoutFullImage) form.heroLayoutFullImage.checked = layout === HERO_LAYOUT_FULL_IMAGE;
  if (form.heroFullBackgroundType) {
    form.heroFullBackgroundType.value = normalizarFundoHero(item.fullImageBackgroundType);
  }
  if (form.heroFullButtonsEnabled) {
    form.heroFullButtonsEnabled.checked = Boolean(item.fullImageButtonsEnabled);
  }
  form.heroBtn1Text.value = botoes[0].label || '';
  form.heroBtn1Url.value = botoes[0].url || '';
  form.heroBtn1Enabled.checked = Boolean(botoes[0].enabled);
  if (form.heroBtn1Color) {
    form.heroBtn1Color.value = botoes[0].color || corPadraoBotao1();
  }
  form.heroBtn2Text.value = botoes[1].label || '';
  form.heroBtn2Url.value = botoes[1].url || '';
  form.heroBtn2Enabled.checked = Boolean(botoes[1].enabled);
  if (form.heroBtn2Outline) {
    form.heroBtn2Outline.checked = normalizarVarianteBotao(botoes[1].variant) === 'outline';
  }
  atualizarVisibilidadeCamposHero(form);
}

function montarPayloadHero(form) {
  const layoutMode = obterLayoutSelecionado(form);
  const modoImagemCompleta = layoutMode === HERO_LAYOUT_FULL_IMAGE;
  const fullImageButtonsEnabled = modoImagemCompleta && form.heroFullButtonsEnabled.checked;
  const habilitarBotoesNoPayload = !modoImagemCompleta || fullImageButtonsEnabled;

  const botao1Cor = sanitizarCorHex(form.heroBtn1Color.value) || corPadraoBotao1();
  const botao2Variant = form.heroBtn2Outline.checked ? 'outline' : 'solid';

  return {
    title: sanitizarTexto(form.heroTitle.value, 120),
    description: sanitizarTexto(form.heroDescription.value, 420),
    image: sanitizarUrl(form.heroImage.value),
    desktopImage: sanitizarUrl(form.heroDesktopImage ? form.heroDesktopImage.value : ''),
    mobileImage: sanitizarUrl(form.heroMobileImage ? form.heroMobileImage.value : ''),
    active: form.heroActive.checked,
    layoutMode,
    fullImageButtonsEnabled,
    fullImageBackgroundType: normalizarFundoHero(form.heroFullBackgroundType.value),
    buttons: [
      {
        label: sanitizarTexto(form.heroBtn1Text.value, 40),
        url: sanitizarUrl(form.heroBtn1Url.value),
        enabled: habilitarBotoesNoPayload && form.heroBtn1Enabled.checked,
        color: botao1Cor,
        variant: 'solid'
      },
      {
        label: sanitizarTexto(form.heroBtn2Text.value, 40),
        url: sanitizarUrl(form.heroBtn2Url.value),
        enabled: habilitarBotoesNoPayload && form.heroBtn2Enabled.checked,
        color: '',
        variant: botao2Variant
      }
    ]
  };
}

function criarBotaoAcao(rotulo, classeCss, handler) {
  const botao = criarElemento('button', classeCss, rotulo);
  botao.type = 'button';
  botao.addEventListener('click', handler);
  return botao;
}

async function reordenarSlideHero(itemId, direcao) {
  const indiceAtual = estadoHero.slides.findIndex((item) => item.id === itemId);
  if (indiceAtual === -1) return;

  const indiceDestino = indiceAtual + direcao;
  if (indiceDestino < 0 || indiceDestino >= estadoHero.slides.length) return;

  const ordenado = [...estadoHero.slides];
  const [selecionado] = ordenado.splice(indiceAtual, 1);
  ordenado.splice(indiceDestino, 0, selecionado);

  const response = await requisicaoApi('/api/admin/hero/reorder', {
    method: 'POST',
    body: { orderedIds: ordenado.map((item) => item.id) }
  });

  estadoHero.slides = ordenarColecao(response.items || []);
  renderizarListaHero();
}

async function alternarSlideHeroAtivo(item) {
  const response = await requisicaoApi(`/api/admin/hero/${item.id}`, {
    method: 'PUT',
    body: { ...item, active: !item.active }
  });
  estadoHero.slides = ordenarColecao(response.items || []);
  renderizarListaHero();
}

async function removerSlideHero(itemId) {
  const response = await requisicaoApi(`/api/admin/hero/${itemId}`, {
    method: 'DELETE',
    body: {}
  });
  estadoHero.slides = ordenarColecao(response.items || []);
  renderizarListaHero();
}

function renderizarListaHero() {
  const lista = document.getElementById('hero-list');
  if (!lista) return;

  limparElemento(lista);

  if (estadoHero.slides.length === 0) {
    lista.appendChild(criarElemento('li', 'empty-state', 'Nenhum slide Hero cadastrado.'));
    return;
  }

  estadoHero.slides.forEach((item) => {
    const li = criarElemento('li', 'entity-item');

    const cabecalho = criarElemento('div', 'entity-item__head');
    const meta = criarElemento('div');
    const titulo = criarElemento('h4', 'entity-item__title', item.title || 'Sem titulo');
    const detalhe = criarElemento(
      'p',
      'entity-item__meta',
      `Ordem: ${item.order} | Layout: ${
        normalizarLayoutHero(item.layoutMode) === HERO_LAYOUT_FULL_IMAGE
          ? 'Imagem completa'
          : 'Texto + imagem'
      }${
        normalizarLayoutHero(item.layoutMode) === HERO_LAYOUT_FULL_IMAGE
          ? ` | Fundo: ${normalizarFundoHero(item.fullImageBackgroundType) === 'straight' ? 'Reto' : 'Ondulado'}`
          : ''
      } | Botoes ativos: ${
        (Array.isArray(item.buttons) ? item.buttons : []).filter((botao) => botao.enabled).length
      } | Imagens responsivas: ${
        item.desktopImage || item.mobileImage ? 'Configuradas' : 'Usando imagem padrao'
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
      criarBotaoAcao('Editar', 'btn-secondary', () => preencherFormularioHero(item)),
      criarBotaoAcao(item.active ? 'Desativar' : 'Ativar', 'btn-ghost', async () => {
        await alternarSlideHeroAtivo(item);
      }),
      criarBotaoAcao('Subir', 'btn-ghost', async () => {
        await reordenarSlideHero(item.id, -1);
      }),
      criarBotaoAcao('Descer', 'btn-ghost', async () => {
        await reordenarSlideHero(item.id, 1);
      }),
      criarBotaoAcao('Excluir', 'btn-danger', async () => {
        if (!window.confirm('Excluir slide Hero?')) return;
        await removerSlideHero(item.id);
      })
    );

    li.append(cabecalho, acoes);
    lista.appendChild(li);
  });
}

function vincularFormularioHero(contexto) {
  const form = document.getElementById('hero-form');
  if (!form) return;

  form.querySelectorAll('input[name="heroLayoutMode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      atualizarVisibilidadeCamposHero(form);
    });
  });

  if (form.heroFullButtonsEnabled) {
    form.heroFullButtonsEnabled.addEventListener('change', () => {
      atualizarVisibilidadeCamposHero(form);
    });
  }

  atualizarVisibilidadeCamposHero(form);

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const payload = montarPayloadHero(form);
    const ehAtualizacao = Boolean(form.heroId.value);

    try {
      const response = ehAtualizacao
        ? await requisicaoApi(`/api/admin/hero/${form.heroId.value}`, { method: 'PUT', body: payload })
        : await requisicaoApi('/api/admin/hero', { method: 'POST', body: payload });

      estadoHero.slides = ordenarColecao(response.items || []);
      renderizarListaHero();
      limparFormularioHero();
      contexto.flash('Slide Hero salvo com sucesso.', 'success');
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha ao salvar slide Hero.', 'error');
    }
  });

  const botaoLimpar = document.getElementById('hero-clear-btn');
  if (botaoLimpar) {
    botaoLimpar.addEventListener('click', limparFormularioHero);
  }
}

async function carregarSlidesHero(contexto) {
  try {
    const response = await requisicaoApi('/api/admin/content');
    estadoHero.slides = ordenarColecao(response.content.heroSlides || []);
    renderizarListaHero();
  } catch (erro) {
    if (erro && erro.status === 401) {
      contexto.onUnauthorized();
      return;
    }
    contexto.flash(erro.message || 'Falha ao carregar slides Hero.', 'error');
  }
}

export async function iniciarGerenciadorHero(contexto) {
  limparFormularioHero();
  vincularFormularioHero(contexto);
  await carregarSlidesHero(contexto);
}

// Alias de compatibilidade.
export const initHeroManager = iniciarGerenciadorHero;


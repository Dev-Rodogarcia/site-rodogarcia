/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/image-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js, /src/js/shared/utils/dom.js
- Endpoints/rotas: /api/developer/imagens, /api/developer/imagens/upload, /api/developer/imagens/replace-reference
- Classes/seletores/chaves: button[type=, #image-url-options, #image-grid, #toImageUrl, #image-preview, #image-preview-empty, #image-upload-form, #imageFile

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: validarArquivoUpload, carregarImagens, preencherDatalistImagens, copiarParaAreaTransferencia, renderizarImagens, atualizarPreviewImagem, arquivoParaDataUrl, vincularFormularioUpload, vincularFormularioSubstituicao, iniciarGerenciadorImagens
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { criarElemento, limparElemento } from '/src/js/shared/utils/dom.js';

const estadoImagens = {
  imagens: [],
  dataUrlSelecionada: ''
};

const LIMITE_UPLOAD_BYTES = 2 * 1024 * 1024;
const TIPOS_UPLOAD_PERMITIDOS = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

function validarArquivoUpload(file) {
  if (!file) {
    return 'Selecione uma imagem para enviar.';
  }

  const tipo = String(file.type || '').toLowerCase();
  if (!TIPOS_UPLOAD_PERMITIDOS.has(tipo)) {
    return 'Tipo invalido. Envie apenas PNG, JPEG, WEBP ou GIF.';
  }

  if (Number(file.size) > LIMITE_UPLOAD_BYTES) {
    return 'Imagem excede limite de 2MB.';
  }

  return '';
}

async function carregarImagens(contexto) {
  try {
    const payload = await requisicaoApi('/api/developer/imagens');
    estadoImagens.imagens = Array.isArray(payload.images) ? payload.images : [];
    renderizarImagens(contexto);
    preencherDatalistImagens();
  } catch (erro) {
    if (erro && erro.status === 401) {
      contexto.onUnauthorized();
      return;
    }
    contexto.flash(erro.message || 'Falha ao carregar imagens.', 'error');
  }
}

function preencherDatalistImagens() {
  const list = document.getElementById('image-url-options');
  if (!list) return;

  limparElemento(list);
  estadoImagens.imagens.forEach((imagem) => {
    const option = document.createElement('option');
    option.value = imagem.url;
    list.appendChild(option);
  });
}

function copiarParaAreaTransferencia(texto, contexto) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    contexto.flash('Clipboard nao suportado neste navegador.', 'info');
    return;
  }

  navigator.clipboard.writeText(texto).then(() => {
    contexto.flash('URL copiada para a area de transferencia.', 'success');
  }).catch(() => {
    contexto.flash('Nao foi possivel copiar a URL.', 'error');
  });
}

function renderizarImagens(contexto) {
  const grid = document.getElementById('image-grid');
  if (!grid) return;

  limparElemento(grid);

  if (estadoImagens.imagens.length === 0) {
    grid.appendChild(criarElemento('li', 'empty-state', 'Nenhuma imagem encontrada.'));
    return;
  }

  estadoImagens.imagens.forEach((imagem) => {
    const card = criarElemento('li', 'image-card');
    const img = criarElemento('img');
    img.src = sanitizarUrl(imagem.url);
    img.alt = imagem.name || 'Imagem';
    img.loading = 'lazy';
    img.decoding = 'async';

    const body = criarElemento('div', 'image-card__body');
    const nome = criarElemento('p', 'image-card__name', imagem.name || 'sem-nome');
    const url = criarElemento('p', 'image-card__url', imagem.url);

    const acoes = criarElemento('div', 'form-actions');
    const botaoUsarUrl = criarElemento('button', 'btn-secondary', 'Usar URL');
    botaoUsarUrl.type = 'button';
    botaoUsarUrl.addEventListener('click', () => {
      const inputDestino = document.getElementById('toImageUrl');
      if (!inputDestino) return;
      inputDestino.value = imagem.url;
      contexto.flash('URL preenchida no campo de substituicao.', 'info');
    });

    const botaoCopiar = criarElemento('button', 'btn-ghost', 'Copiar URL');
    botaoCopiar.type = 'button';
    botaoCopiar.addEventListener('click', () => {
      copiarParaAreaTransferencia(imagem.url, contexto);
    });

    acoes.append(botaoUsarUrl, botaoCopiar);
    body.append(nome, url, acoes);
    card.append(img, body);
    grid.appendChild(card);
  });
}

function atualizarPreviewImagem(dataUrl) {
  const preview = document.getElementById('image-preview');
  const labelVazio = document.getElementById('image-preview-empty');
  if (!preview || !labelVazio) return;

  if (!dataUrl) {
    preview.hidden = true;
    preview.removeAttribute('src');
    labelVazio.hidden = false;
    return;
  }

  preview.src = dataUrl;
  preview.hidden = false;
  labelVazio.hidden = true;
}

function arquivoParaDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

function vincularFormularioUpload(contexto) {
  const form = document.getElementById('image-upload-form');
  const fileInput = document.getElementById('imageFile');
  if (!form || !fileInput) return;

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (!file) {
      estadoImagens.dataUrlSelecionada = '';
      atualizarPreviewImagem('');
      return;
    }

    const erroValidacao = validarArquivoUpload(file);
    if (erroValidacao) {
      contexto.flash(erroValidacao, 'error');
      form.reset();
      estadoImagens.dataUrlSelecionada = '';
      atualizarPreviewImagem('');
      return;
    }

    try {
      estadoImagens.dataUrlSelecionada = await arquivoParaDataUrl(file);
      atualizarPreviewImagem(estadoImagens.dataUrlSelecionada);
    } catch (erro) {
      contexto.flash(erro.message, 'error');
      estadoImagens.dataUrlSelecionada = '';
      atualizarPreviewImagem('');
    }
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    const erroValidacao = validarArquivoUpload(file);
    if (erroValidacao) {
      contexto.flash(erroValidacao, 'error');
      return;
    }

    let dataUrl = estadoImagens.dataUrlSelecionada;
    if (!dataUrl) {
      try {
        dataUrl = await arquivoParaDataUrl(file);
      } catch (erro) {
        contexto.flash(erro.message, 'error');
        return;
      }
    }

    const botaoSubmit = form.querySelector('button[type="submit"]');
    if (botaoSubmit) botaoSubmit.disabled = true;

    try {
      await requisicaoApi('/api/developer/imagens/upload', {
        method: 'POST',
        body: { fileName: file.name, dataUrl }
      });

      form.reset();
      estadoImagens.dataUrlSelecionada = '';
      atualizarPreviewImagem('');
      contexto.flash('Imagem enviada com sucesso.', 'success');
      await carregarImagens(contexto);
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha no upload da imagem.', 'error');
    } finally {
      if (botaoSubmit) botaoSubmit.disabled = false;
    }
  });
}

function vincularFormularioSubstituicao(contexto) {
  const form = document.getElementById('image-replace-form');
  if (!form) return;

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const fromUrl = sanitizarUrl(form.fromImageUrl.value);
    const toUrl = sanitizarUrl(form.toImageUrl.value);
    if (!fromUrl || !toUrl) {
      contexto.flash('Informe URLs validas para substituir referencias.', 'error');
      return;
    }

    const botaoSubmit = form.querySelector('button[type="submit"]');
    if (botaoSubmit) botaoSubmit.disabled = true;

    try {
      const payload = await requisicaoApi('/api/developer/imagens/replace-reference', {
        method: 'POST',
        body: { fromUrl, toUrl }
      });
      contexto.flash(payload.message || 'Referencias atualizadas.', 'success');
      await carregarImagens(contexto);
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha ao substituir referencias.', 'error');
    } finally {
      if (botaoSubmit) botaoSubmit.disabled = false;
    }
  });
}

export async function iniciarGerenciadorImagens(contexto) {
  estadoImagens.imagens = [];
  estadoImagens.dataUrlSelecionada = '';
  vincularFormularioUpload(contexto);
  vincularFormularioSubstituicao(contexto);
  await carregarImagens(contexto);
}

// Alias de compatibilidade.
export const initImageManager = iniciarGerenciadorImagens;


import { apiRequest } from '/assets/js/api.js';
import { sanitizeUrl } from '/assets/js/utils/sanitize.js';
import { clearElement, createElement } from '/assets/js/utils/dom.js';

const state = {
  images: [],
  selectedDataUrl: ''
};

async function loadImages(context) {
  try {
    const payload = await apiRequest('/api/developer/imagens');
    state.images = Array.isArray(payload.images) ? payload.images : [];
    renderImages(context);
    fillImageDatalist();
  } catch (error) {
    if (error && error.status === 401) {
      context.onUnauthorized();
      return;
    }
    context.flash(error.message || 'Falha ao carregar imagens.', 'error');
  }
}

function fillImageDatalist() {
  const list = document.getElementById('image-url-options');
  if (!list) return;

  clearElement(list);
  state.images.forEach((image) => {
    const option = document.createElement('option');
    option.value = image.url;
    list.appendChild(option);
  });
}

function copyToClipboard(text, context) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    context.flash('Clipboard nao suportado neste navegador.', 'info');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    context.flash('URL copiada para a area de transferencia.', 'success');
  }).catch(() => {
    context.flash('Nao foi possivel copiar a URL.', 'error');
  });
}

function renderImages(context) {
  const grid = document.getElementById('image-grid');
  if (!grid) return;

  clearElement(grid);

  if (state.images.length === 0) {
    const empty = createElement('li', 'empty-state', 'Nenhuma imagem encontrada.');
    grid.appendChild(empty);
    return;
  }

  state.images.forEach((image) => {
    const card = createElement('li', 'image-card');
    const img = createElement('img');
    img.src = sanitizeUrl(image.url);
    img.alt = image.name || 'Imagem';
    img.loading = 'lazy';
    img.decoding = 'async';

    const body = createElement('div', 'image-card__body');
    const name = createElement('p', 'image-card__name', image.name || 'sem-nome');
    const url = createElement('p', 'image-card__url', image.url);

    const actions = createElement('div', 'form-actions');
    const useButton = createElement('button', 'btn-secondary', 'Usar URL');
    useButton.type = 'button';
    useButton.addEventListener('click', () => {
      const toInput = document.getElementById('toImageUrl');
      if (!toInput) return;
      toInput.value = image.url;
      context.flash('URL preenchida no campo de substituicao.', 'info');
    });

    const copyButton = createElement('button', 'btn-ghost', 'Copiar URL');
    copyButton.type = 'button';
    copyButton.addEventListener('click', () => {
      copyToClipboard(image.url, context);
    });

    actions.append(useButton, copyButton);
    body.append(name, url, actions);
    card.append(img, body);
    grid.appendChild(card);
  });
}

function previewImage(dataUrl) {
  const preview = document.getElementById('image-preview');
  const emptyLabel = document.getElementById('image-preview-empty');
  if (!preview || !emptyLabel) return;

  if (!dataUrl) {
    preview.hidden = true;
    preview.removeAttribute('src');
    emptyLabel.hidden = false;
    return;
  }

  preview.src = dataUrl;
  preview.hidden = false;
  emptyLabel.hidden = true;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

function bindUploadForm(context) {
  const form = document.getElementById('image-upload-form');
  const fileInput = document.getElementById('imageFile');
  if (!form || !fileInput) return;

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (!file) {
      state.selectedDataUrl = '';
      previewImage('');
      return;
    }

    try {
      state.selectedDataUrl = await fileToDataUrl(file);
      previewImage(state.selectedDataUrl);
    } catch (error) {
      context.flash(error.message, 'error');
      state.selectedDataUrl = '';
      previewImage('');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (!file) {
      context.flash('Selecione uma imagem para enviar.', 'error');
      return;
    }

    let dataUrl = state.selectedDataUrl;
    if (!dataUrl) {
      try {
        dataUrl = await fileToDataUrl(file);
      } catch (error) {
        context.flash(error.message, 'error');
        return;
      }
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      await apiRequest('/api/developer/imagens/upload', {
        method: 'POST',
        body: {
          fileName: file.name,
          dataUrl
        }
      });

      form.reset();
      state.selectedDataUrl = '';
      previewImage('');
      context.flash('Imagem enviada com sucesso.', 'success');
      await loadImages(context);
    } catch (error) {
      if (error && error.status === 401) {
        context.onUnauthorized();
        return;
      }
      context.flash(error.message || 'Falha no upload da imagem.', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

function bindReplaceForm(context) {
  const form = document.getElementById('image-replace-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fromUrl = sanitizeUrl(form.fromImageUrl.value);
    const toUrl = sanitizeUrl(form.toImageUrl.value);

    if (!fromUrl || !toUrl) {
      context.flash('Informe URLs validas para substituir referencias.', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const payload = await apiRequest('/api/developer/imagens/replace-reference', {
        method: 'POST',
        body: { fromUrl, toUrl }
      });

      context.flash(payload.message || 'Referencias atualizadas.', 'success');
      await loadImages(context);
    } catch (error) {
      if (error && error.status === 401) {
        context.onUnauthorized();
        return;
      }
      context.flash(error.message || 'Falha ao substituir referencias.', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

export async function initImageManager(context) {
  state.images = [];
  state.selectedDataUrl = '';
  bindUploadForm(context);
  bindReplaceForm(context);
  await loadImages(context);
}

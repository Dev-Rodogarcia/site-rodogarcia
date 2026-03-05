/* ==[DOC-FILE]===============================================================
Arquivo : src/js/image-processing/upload-optimizer.js
Modulo  : Frontend - processamento de imagem
Papel   : Redimensiona e comprime imagens no navegador para respeitar limite de upload com alta qualidade.

Responsabilidades:
- Validar tipo/tamanho de arquivo para processamento local seguro.
- Redimensionar imagens muito grandes preservando proporcao.
- Comprimir em etapas de qualidade ate atingir limite configurado (padrao 2MB).

Integracoes:
- Dependencias: APIs nativas do navegador (FileReader, Image, Canvas, Blob)
- Endpoints/rotas: nao se aplica (consumido por managers de upload)
- Classes/seletores/chaves: MAX_UPLOAD_BYTES, MAX_SOURCE_BYTES, ALLOWED_UPLOAD_TYPES

Entradas e saidas:
- Entradas: objeto File selecionado pelo usuario.
- Saidas  : objeto com `dataUrl` otimizada, metadados de tamanho/dimensoes e aviso opcional.

Elementos tecnicos: validarArquivoParaOtimizacao, otimizarImagemParaUpload, formatarTamanhoBytes
[DOC-FILE-END]============================================================== */

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION_PX = 2560;
const QUALITY_STEPS = [0.92, 0.86, 0.8, 0.74, 0.68, 0.62, 0.56, 0.5, 0.44];

const ALLOWED_UPLOAD_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

function normalizarMimeType(tipo) {
  const valor = String(tipo || '').toLowerCase();
  if (valor === 'image/jpg') return 'image/jpeg';
  return valor;
}

export function formatarTamanhoBytes(bytes) {
  const valor = Number(bytes) || 0;
  if (valor < 1024) return `${valor} B`;
  if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(1)} KB`;
  return `${(valor / (1024 * 1024)).toFixed(2)} MB`;
}

export function validarArquivoParaOtimizacao(file) {
  if (!file) {
    return 'Selecione uma imagem para enviar.';
  }

  const tipo = normalizarMimeType(file.type);
  if (!ALLOWED_UPLOAD_TYPES.has(tipo)) {
    return 'Tipo invalido. Envie apenas PNG, JPEG, WEBP ou GIF.';
  }

  if (Number(file.size) > MAX_SOURCE_BYTES) {
    return 'Arquivo muito grande para processamento automatico (maximo 20MB).';
  }

  return '';
}

function arquivoParaDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

function carregarImagem(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Nao foi possivel carregar a imagem selecionada.'));
    img.src = dataUrl;
  });
}

function calcularDimensoes(origWidth, origHeight, maxDimension, escalaExtra = 1) {
  const width = Number(origWidth) || 1;
  const height = Number(origHeight) || 1;
  const maiorLado = Math.max(width, height);

  const fatorBase = maiorLado > maxDimension ? maxDimension / maiorLado : 1;
  const fatorFinal = Math.min(1, fatorBase * escalaExtra);

  return {
    width: Math.max(1, Math.round(width * fatorFinal)),
    height: Math.max(1, Math.round(height * fatorFinal))
  };
}

function criarCanvas(image, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  if (!ctx) {
    throw new Error('Nao foi possivel preparar o canvas para processamento.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function canvasParaBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Falha ao gerar arquivo processado.'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

function blobParaDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao converter imagem processada.'));
    reader.readAsDataURL(blob);
  });
}

function obterMimesCandidatos(tipoOriginal) {
  const tipo = normalizarMimeType(tipoOriginal);
  if (tipo === 'image/png') return ['image/webp', 'image/png', 'image/jpeg'];
  if (tipo === 'image/gif') return ['image/webp', 'image/jpeg'];
  if (tipo === 'image/webp') return ['image/webp', 'image/jpeg'];
  return ['image/jpeg', 'image/webp'];
}

export async function otimizarImagemParaUpload(file, options = {}) {
  const limiteBytes = Number(options.maxBytes) || MAX_UPLOAD_BYTES;
  const maxDimension = Number(options.maxDimension) || MAX_DIMENSION_PX;
  const tipoOriginal = normalizarMimeType(file && file.type);

  const erroValidacao = validarArquivoParaOtimizacao(file);
  if (erroValidacao) {
    throw new Error(erroValidacao);
  }

  if (Number(file.size) <= limiteBytes) {
    return {
      dataUrl: await arquivoParaDataUrl(file),
      mimeType: tipoOriginal,
      bytesFinal: Number(file.size),
      bytesOriginais: Number(file.size),
      width: null,
      height: null,
      quality: null,
      optimized: false,
      warning: ''
    };
  }

  const dataUrlOriginal = await arquivoParaDataUrl(file);
  const image = await carregarImagem(dataUrlOriginal);
  const mimesCandidatos = obterMimesCandidatos(tipoOriginal);

  let melhorTentativa = null;
  let escalaExtra = 1;
  let warning = '';

  if (tipoOriginal === 'image/gif') {
    warning = 'GIF acima de 2MB foi convertido para imagem estatica para caber no limite.';
  }

  for (let rodada = 0; rodada < 6; rodada += 1) {
    const dimensoes = calcularDimensoes(image.naturalWidth, image.naturalHeight, maxDimension, escalaExtra);
    const canvas = criarCanvas(image, dimensoes.width, dimensoes.height);

    for (const mimeType of mimesCandidatos) {
      for (const quality of QUALITY_STEPS) {
        let blob;
        try {
          blob = await canvasParaBlob(canvas, mimeType, quality);
        } catch {
          continue;
        }

        if (!melhorTentativa || blob.size < melhorTentativa.bytesFinal) {
          melhorTentativa = {
            blob,
            mimeType: blob.type || mimeType,
            bytesFinal: blob.size,
            width: dimensoes.width,
            height: dimensoes.height,
            quality
          };
        }

        if (blob.size <= limiteBytes) {
          return {
            dataUrl: await blobParaDataUrl(blob),
            mimeType: blob.type || mimeType,
            bytesFinal: blob.size,
            bytesOriginais: Number(file.size),
            width: dimensoes.width,
            height: dimensoes.height,
            quality,
            optimized: true,
            warning
          };
        }
      }
    }

    escalaExtra *= 0.86;
  }

  if (melhorTentativa) {
    throw new Error(
      `Nao foi possivel reduzir para 2MB. Melhor resultado: ${formatarTamanhoBytes(melhorTentativa.bytesFinal)}.`
    );
  }

  throw new Error('Falha ao otimizar imagem para upload.');
}

export const IMAGE_UPLOAD_MAX_BYTES = MAX_UPLOAD_BYTES;

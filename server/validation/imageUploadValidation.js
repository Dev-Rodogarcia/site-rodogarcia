/* ==[DOC-FILE]===============================================================
Arquivo : server/validation/imageUploadValidation.js
Modulo  : Backend Node.js - validacao
Papel   : Implementa regras de backend, validacoes e efeitos de persistencia/HTTP do modulo.

Responsabilidades:
- Processa regras de negocio e validacao de dados do backend.
- Integra com persistencia local e/ou fluxo de autenticacao.
- Produz respostas HTTP consistentes com seguranca e tratamento de erro.

Integracoes:
- Dependencias: nao ha dependencias explicitas no arquivo.
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Requisicoes HTTP, payload JSON, cookies e variaveis de ambiente.
- Saidas  : Respostas HTTP, escrita/leitura de store local e logs operacionais.

Elementos tecnicos: normalizeMimeType, detectMimeTypeBySignature, parseImageUploadPayload
[DOC-FILE-END]============================================================== */

const ALLOWED_IMAGE_MIME = Object.freeze({
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif'
});

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function normalizeMimeType(mimeType) {
  if (mimeType === 'image/jpg') return 'image/jpeg';
  return mimeType;
}

function detectMimeTypeBySignature(buffer) {
  if (!buffer || buffer.length < 4) return '';

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  if (buffer.length >= 6) {
    const gifHeader = buffer.subarray(0, 6).toString('ascii');
    if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
      return 'image/gif';
    }
  }

  return '';
}

function parseImageUploadPayload(body) {
  const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl.trim() : '';
  if (!dataUrl) {
    return { ok: false, statusCode: 400, error: 'Arquivo de imagem nao informado.' };
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    return { ok: false, statusCode: 400, error: 'Formato de imagem invalido.' };
  }

  const declaredMime = normalizeMimeType(String(match[1]).toLowerCase());
  const base64Data = match[2];

  if (!ALLOWED_IMAGE_MIME[declaredMime]) {
    return { ok: false, statusCode: 415, error: 'Tipo de imagem nao permitido.' };
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    return { ok: false, statusCode: 400, error: 'Imagem invalida.' };
  }

  if (!buffer || buffer.length === 0) {
    return { ok: false, statusCode: 400, error: 'Imagem vazia.' };
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, statusCode: 413, error: 'Imagem excede limite de 2MB.' };
  }

  const detectedMime = detectMimeTypeBySignature(buffer);
  if (!detectedMime) {
    return { ok: false, statusCode: 415, error: 'Nao foi possivel validar o tipo real da imagem.' };
  }

  if (detectedMime !== declaredMime) {
    return { ok: false, statusCode: 415, error: 'Tipo real da imagem nao corresponde ao tipo declarado.' };
  }

  return {
    ok: true,
    mimeType: detectedMime,
    buffer
  };
}

module.exports = {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  parseImageUploadPayload
};

/* ==[DOC-FILE]===============================================================
Arquivo : server/routes/developerRoutes.js
Modulo  : Backend Node.js - roteamento
Papel   : Implementa regras de backend, validacoes e efeitos de persistencia/HTTP do modulo.

Responsabilidades:
- Processa regras de negocio e validacao de dados do backend.
- Integra com persistencia local e/ou fluxo de autenticacao.
- Produz respostas HTTP consistentes com seguranca e tratamento de erro.

Integracoes:
- Dependencias: fs, path, ../middleware/middlewareAuth, ../validation/imageUploadValidation
- Endpoints/rotas: /api/developer, /api/developer/session, /api/developer/textos, /api/developer/imagens, /api/developer/imagens/upload, /api/developer/imagens/replace-reference
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Requisicoes HTTP, payload JSON, cookies e variaveis de ambiente.
- Saidas  : Respostas HTTP, escrita/leitura de store local e logs operacionais.

Elementos tecnicos: createDeveloperRoutes, guardDeveloperPages, handleDeveloperApi, sanitizeSiteTexts, collectAvailableImages, sanitizeFileName, addImage
[DOC-FILE-END]============================================================== */

const fs = require('fs');
const path = require('path');
const {
  requireDeveloperPageSession,
  requireDeveloperApiSession
} = require('../middleware/middlewareAuth');
const {
  ALLOWED_IMAGE_MIME,
  parseImageUploadPayload
} = require('../validation/imageUploadValidation');

function createDeveloperRoutes(deps) {
  const {
    getAuthContext,
    requireAuth,
    sendJson,
    redirectResponse,
    publicUser,
    readContentData,
    writeContentData,
    readSiteTextsData,
    writeSiteTextsData,
    readJsonBody,
    verifyCsrf,
    sanitizeText,
    sanitizeUrl,
    rootDir
  } = deps;

  const uploadDir = path.join(rootDir, 'public', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  function guardDeveloperPages(req, res, pathname, search = '') {
    if (pathname.startsWith('/src/developer/')) {
      const authContext = getAuthContext(req);
      if (!authContext) {
        const next = encodeURIComponent('/developer/index.html');
        redirectResponse(res, 302, `/auth/entrar.html?area=staff&next=${next}`);
        return true;
      }

      redirectResponse(res, 302, '/developer/index.html');
      return true;
    }

    if (!pathname.startsWith('/developer/')) {
      return false;
    }

    const authContext = requireDeveloperPageSession({
      req,
      res,
      pathname,
      search,
      getAuthContext,
      redirectResponse
    });

    return !authContext;
  }

  async function handleDeveloperApi(req, res, pathname) {
    if (!pathname.startsWith('/api/developer')) {
      return false;
    }

    if (pathname === '/api/developer/session' && req.method === 'GET') {
      const authContext = getAuthContext(req);
      if (!authContext) {
        sendJson(res, 401, { authenticated: false, error: 'Sessao invalida ou expirada.' });
        return true;
      }

      sendJson(res, 200, {
        authenticated: true,
        user: publicUser(authContext.user),
        csrfToken: authContext.session.csrfToken,
        expiresAt: authContext.session.expiresAt,
        area: 'developer'
      });
      return true;
    }

    const authContext = requireDeveloperApiSession({
      req,
      res,
      requireAuth
    });

    if (!authContext) {
      return true;
    }

    if (pathname === '/api/developer/textos' && req.method === 'GET') {
      sendJson(res, 200, {
        texts: readSiteTextsData()
      });
      return true;
    }

    if (pathname === '/api/developer/textos' && req.method === 'PUT') {
      if (!verifyCsrf(req, res, authContext.session)) return true;

      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
        return true;
      }

      const sanitized = sanitizeSiteTexts(body, sanitizeText, sanitizeUrl);
      writeSiteTextsData(sanitized);
      sendJson(res, 200, { message: 'Textos atualizados com sucesso.', texts: sanitized });
      return true;
    }

    if (pathname === '/api/developer/imagens' && req.method === 'GET') {
      const content = readContentData();
      const images = collectAvailableImages(content, uploadDir, sanitizeUrl);
      sendJson(res, 200, { images });
      return true;
    }

    if (pathname === '/api/developer/imagens/upload' && req.method === 'POST') {
      if (!verifyCsrf(req, res, authContext.session)) return true;

      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
        return true;
      }

      const parsed = parseImageUploadPayload(body);
      if (!parsed.ok) {
        sendJson(res, parsed.statusCode || 422, { error: parsed.error });
        return true;
      }

      const fileNameBase = sanitizeFileName(body.fileName);
      const extension = ALLOWED_IMAGE_MIME[parsed.mimeType];
      const finalName = `${fileNameBase}-${Date.now()}${extension}`;
      const targetPath = path.join(uploadDir, finalName);
      fs.writeFileSync(targetPath, parsed.buffer);

      const imageUrl = `/public/uploads/${finalName}`;
      sendJson(res, 201, {
        message: 'Imagem enviada com sucesso.',
        image: { url: imageUrl, name: finalName, source: 'upload' }
      });
      return true;
    }

    if (pathname === '/api/developer/imagens/replace-reference' && req.method === 'POST') {
      if (!verifyCsrf(req, res, authContext.session)) return true;

      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
        return true;
      }

      const fromUrl = sanitizeUrl(body.fromUrl);
      const toUrl = sanitizeUrl(body.toUrl);

      if (!fromUrl || !toUrl) {
        sendJson(res, 422, { error: 'Informe URLs validas para substituir referencias.' });
        return true;
      }

      const content = readContentData();
      const nowIso = new Date().toISOString();
      let changed = 0;

      for (const slide of content.heroSlides) {
        if (slide.image === fromUrl) {
          slide.image = toUrl;
          slide.updatedAt = nowIso;
          changed += 1;
        }
      }

      for (const slide of content.dnaSlides) {
        if (slide.image === fromUrl) {
          slide.image = toUrl;
          slide.updatedAt = nowIso;
          changed += 1;
        }
      }

      if (changed > 0) {
        writeContentData(content);
      }

      sendJson(res, 200, {
        message: changed > 0
          ? 'Referencias de imagem atualizadas.'
          : 'Nenhuma referencia correspondente foi encontrada.',
        changed
      });
      return true;
    }

    sendJson(res, 404, { error: 'Endpoint developer nao encontrado.' });
    return true;
  }

  return {
    guardDeveloperPages,
    handleDeveloperApi
  };
}

function sanitizeSiteTexts(payload, sanitizeText, sanitizeUrl) {
  const source = payload && typeof payload === 'object' ? payload : {};

  return {
    dashboardTitle: sanitizeText(source.dashboardTitle, 80),
    dashboardSubtitle: sanitizeText(source.dashboardSubtitle, 180),
    heroSectionTitle: sanitizeText(source.heroSectionTitle, 120),
    heroSectionSubtitle: sanitizeText(source.heroSectionSubtitle, 220),
    dnaSectionTitle: sanitizeText(source.dnaSectionTitle, 120),
    dnaSectionSubtitle: sanitizeText(source.dnaSectionSubtitle, 220),
    vagasSectionTitle: sanitizeText(source.vagasSectionTitle, 120),
    vagasSectionSubtitle: sanitizeText(source.vagasSectionSubtitle, 220),
    ctaPrimaryLabel: sanitizeText(source.ctaPrimaryLabel, 40),
    ctaPrimaryUrl: sanitizeUrl(source.ctaPrimaryUrl),
    ctaSecondaryLabel: sanitizeText(source.ctaSecondaryLabel, 40),
    ctaSecondaryUrl: sanitizeUrl(source.ctaSecondaryUrl)
  };
}

function collectAvailableImages(content, uploadDir, sanitizeUrl) {
  const imageMap = new Map();
  const allowedExtensions = new Set(Object.values(ALLOWED_IMAGE_MIME).map((value) => value.toLowerCase()));

  const addImage = (url, source) => {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return;
    if (imageMap.has(safeUrl)) return;
    imageMap.set(safeUrl, {
      url: safeUrl,
      name: path.basename(safeUrl),
      source
    });
  };

  const heroSlides = Array.isArray(content.heroSlides) ? content.heroSlides : [];
  const dnaSlides = Array.isArray(content.dnaSlides) ? content.dnaSlides : [];

  heroSlides.forEach((slide) => addImage(slide.image, 'conteudo'));
  dnaSlides.forEach((slide) => addImage(slide.image, 'conteudo'));

  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir, { withFileTypes: true });
    files.forEach((file) => {
      if (!file.isFile()) return;
      const extension = path.extname(file.name).toLowerCase();
      if (!allowedExtensions.has(extension)) return;
      const fileUrl = `/public/uploads/${file.name}`;
      addImage(fileUrl, 'upload');
    });
  }

  return Array.from(imageMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function sanitizeFileName(input) {
  const raw = typeof input === 'string' ? input : '';
  const base = path.parse(raw).name || 'imagem';
  const normalized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return normalized || 'imagem';
}

module.exports = {
  createDeveloperRoutes
};

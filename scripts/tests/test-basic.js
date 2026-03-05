/* ==[DOC-FILE]===============================================================
Arquivo : scripts/tests/test-basic.js
Modulo  : Automacao - testes
Papel   : Executa tarefa operacional com leitura/escrita local e saida no console.

Responsabilidades:
- Executa uma tarefa operacional reutilizavel fora do fluxo de runtime web.
- Le/escreve arquivos do projeto quando necessario.
- Retorna status claro via console para uso em rotina de desenvolvimento.

Integracoes:
- Dependencias: child_process, fs, os, path
- Endpoints/rotas: /api/admin/content, /api/developer/imagens, /api/auth/register, /api/developer/imagens/upload, /api/admin/hero
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Arquivos locais, constantes internas e parametros fixos do script.
- Saidas  : Arquivo gerado/validado e feedback de execucao no terminal.

Elementos tecnicos: sleep, assert, waitForServer, startServer, run
[DOC-FILE-END]============================================================== */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 5410;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SETUP_CODE = 'test-setup-code-2026-safe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookie = '';
    this.csrfToken = '';
  }

  async request(pathname, options = {}) {
    const method = options.method || 'GET';
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {})
    };

    let body;
    if (options.body !== undefined) {
      body = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
    }

    if (this.cookie) {
      headers.Cookie = this.cookie;
    }

    if (options.withCsrf && this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    const response = await fetch(`${this.baseUrl}${pathname}`, {
      method,
      headers,
      body,
      redirect: options.redirect || 'manual'
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.cookie = setCookie.split(';')[0];
    }

    const contentType = String(response.headers.get('content-type') || '');
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (payload && typeof payload.csrfToken === 'string') {
      this.csrfToken = payload.csrfToken;
    }

    return { response, payload };
  }
}

async function waitForServer(baseUrl, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: 'GET',
        redirect: 'manual'
      });
      if (response.status === 200) {
        return;
      }
    } catch {
      // Aguarda proxima tentativa
    }
    await sleep(250);
  }
  throw new Error('Servidor nao ficou pronto dentro do tempo esperado.');
}

function startServer(usersStorePath, contentStorePath, siteTextsStorePath) {
  const env = {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'development',
    ADMIN_SETUP_CODE: SETUP_CODE,
    USERS_STORE_PATH: usersStorePath,
    CONTENT_STORE_PATH: contentStorePath,
    SITE_TEXTS_STORE_PATH: siteTextsStorePath
  };

  const child = spawn(process.execPath, ['server.js'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
  });

  return {
    child,
    getLogs: () => logs
  };
}

async function run() {
  if (typeof fetch !== 'function') {
    throw new Error('Este teste requer Node com fetch global habilitado.');
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rodogarcia-basic-test-'));
  const usersStorePath = path.join(tmpDir, 'users.json');
  const contentStorePath = path.join(tmpDir, 'content.json');
  const siteTextsStorePath = path.join(tmpDir, 'site-texts.json');
  const { child, getLogs } = startServer(usersStorePath, contentStorePath, siteTextsStorePath);

  try {
    await waitForServer(BASE_URL);
    const anonymous = new HttpClient(BASE_URL);

    const publicPaths = ['/', '/servicos.html', '/sobre.html'];
    for (const route of publicPaths) {
      const { response } = await anonymous.request(route, { redirect: 'manual' });
      assert(response.status === 200, `Rota publica ${route} deveria retornar 200, retornou ${response.status}.`);
    }

    const authPage = await anonymous.request('/auth/entrar.html', { redirect: 'manual' });
    assert(authPage.response.status === 200, 'Pagina /auth/entrar.html deveria retornar 200.');

    const authScript = await anonymous.request('/auth/js/auth.js', { redirect: 'manual' });
    assert(authScript.response.status === 200, 'Arquivo /auth/js/auth.js deveria retornar 200.');

    const legacyAdmin = await anonymous.request('/admin/index.html', { redirect: 'manual' });
    assert(legacyAdmin.response.status === 302, 'Rota /admin/index.html deveria redirecionar para /developer.');
    assert(
      String(legacyAdmin.response.headers.get('location') || '').startsWith('/developer/index.html'),
      'Redirecionamento legado de /admin nao apontou para /developer.'
    );

    const privatePage = await anonymous.request('/developer/index.html', { redirect: 'manual' });
    assert(privatePage.response.status === 302, 'Rota privada /developer/index.html deveria redirecionar sem sessao.');

    const privateApiAdmin = await anonymous.request('/api/admin/content');
    assert(privateApiAdmin.response.status === 401, 'API /api/admin/content sem sessao deveria retornar 401.');

    const privateApiDev = await anonymous.request('/api/developer/imagens');
    assert(privateApiDev.response.status === 401, 'API /api/developer/imagens sem sessao deveria retornar 401.');

    const registerPayload = {
      name: 'Teste Admin',
      email: 'teste.admin@rodogarcia.com.br',
      password: 'SenhaTesteForte123',
      confirmPassword: 'SenhaTesteForte123',
      setupCode: SETUP_CODE
    };
    const register = await anonymous.request('/api/auth/register', {
      method: 'POST',
      body: registerPayload
    });
    assert(register.response.status === 201, 'Cadastro inicial deveria retornar 201.');
    assert(anonymous.cookie, 'Cadastro inicial deveria criar cookie de sessao.');
    assert(anonymous.csrfToken, 'Cadastro inicial deveria retornar token CSRF.');

    const invalidSvgUpload = await anonymous.request('/api/developer/imagens/upload', {
      method: 'POST',
      withCsrf: true,
      body: {
        fileName: 'malicioso.svg',
        dataUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=='
      }
    });
    assert(invalidSvgUpload.response.status === 415, 'Upload SVG deveria retornar 415.');

    const createHero = await anonymous.request('/api/admin/hero', {
      method: 'POST',
      withCsrf: true,
      body: {
        title: 'Hero Teste',
        description: 'Descricao teste',
        image: '/public/foto1.png',
        active: true,
        buttons: [
          { label: 'Saiba Mais', url: '/sobre.html', enabled: true },
          { label: '', url: '', enabled: false }
        ]
      }
    });
    assert(createHero.response.status === 201, 'Criacao de Hero deveria retornar 201.');
    const createdId = createHero.payload && createHero.payload.item ? createHero.payload.item.id : '';
    assert(Boolean(createdId), 'Criacao de Hero deveria retornar item com id.');

    const updateHero = await anonymous.request(`/api/admin/hero/${createdId}`, {
      method: 'PUT',
      withCsrf: true,
      body: {
        title: 'Hero Teste Atualizado',
        description: 'Descricao atualizada',
        image: '/public/foto2.png',
        active: true,
        buttons: [
          { label: 'Cotacao', url: '/cotacao.html', enabled: true },
          { label: '', url: '', enabled: false }
        ]
      }
    });
    assert(updateHero.response.status === 200, 'Atualizacao de Hero deveria retornar 200.');
    assert(
      updateHero.payload && updateHero.payload.item && updateHero.payload.item.title === 'Hero Teste Atualizado',
      'Atualizacao de Hero nao refletiu o novo titulo.'
    );

    const deleteHero = await anonymous.request(`/api/admin/hero/${createdId}`, {
      method: 'DELETE',
      withCsrf: true
    });
    assert(deleteHero.response.status === 200, 'Remocao de Hero deveria retornar 200.');
    const stillExists = (deleteHero.payload && Array.isArray(deleteHero.payload.items))
      ? deleteHero.payload.items.some((item) => item.id === createdId)
      : false;
    assert(!stillExists, 'Hero removido ainda apareceu na colecao retornada.');

    console.log('TESTE_BASICO_OK');
  } catch (error) {
    console.error('TESTE_BASICO_FALHOU');
    console.error(error && error.message ? error.message : error);
    console.error('--- LOGS DO SERVIDOR ---');
    console.error(getLogs());
    process.exitCode = 1;
  } finally {
    child.kill();
  }
}

run();

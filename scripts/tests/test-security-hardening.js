const { spawn } = require('child_process');
const http = require('http');

const PORT = 5010;
const HOST = '127.0.0.1';
const SERVER_URL = `http://${HOST}:${PORT}`;
const BLOCKED_PATHS = [
  '/.env',
  '/.env.example',
  '/README.md',
  '/docs/checklist-tecnico.md',
  '/scripts/tests/test-basic.js',
  '/.claude/settings.local.json',
  '/data/analytics.json',
  '/data/analytics-config.json',
  '/src/index.html',
  '/src/developer/index.html'
];
const PUBLIC_PATHS = [
  '/',
  '/index.html',
  '/assets/js/public-content.js',
  '/assets/js/api.js'
];
const AUTH_PATHS = [
  '/api/admin/content',
  '/api/developer/imagens',
  '/api/popup-config/admin',
  '/api/analytics/config/admin'
];
const SENSITIVE_LOG_PATTERNS = [
  'admin_setup_code',
  '.env',
  'passwordhash',
  'email',
  'phone'
];

function request(pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function waitForServerReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await request('/');
      if (response.status === 200) {
        return;
      }
    } catch {
      // Continua tentando.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Servidor nao respondeu em ${SERVER_URL}.`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runChecks() {
  const results = [];

  for (const pathname of BLOCKED_PATHS) {
    const response = await request(pathname);
    results.push({
      name: `BLOCK ${pathname}`,
      pass: response.status === 404,
      detail: `status=${response.status}`
    });
  }

  for (const pathname of PUBLIC_PATHS) {
    const response = await request(pathname);
    results.push({
      name: `PUBLIC ${pathname}`,
      pass: response.status === 200,
      detail: `status=${response.status}`
    });
  }

  for (const pathname of AUTH_PATHS) {
    const response = await request(pathname);
    results.push({
      name: `AUTH ${pathname}`,
      pass: response.status === 401,
      detail: `status=${response.status}`
    });
  }

  const corsRoot = await request('/', {
    headers: { Origin: 'https://evil.example' }
  });
  results.push({
    name: 'CORS /',
    pass: !corsRoot.headers['access-control-allow-origin'],
    detail: `acao=${corsRoot.headers['access-control-allow-origin'] || 'none'}`
  });

  const corsApi = await request('/api/public/content', {
    headers: { Origin: 'https://evil.example' }
  });
  results.push({
    name: 'CORS /api/public/content',
    pass: !corsApi.headers['access-control-allow-origin'],
    detail: `acao=${corsApi.headers['access-control-allow-origin'] || 'none'}`
  });

  return results;
}

async function main() {
  const stdout = [];
  const stderr = [];
  const child = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (chunk) => {
    stdout.push(String(chunk));
  });
  child.stderr.on('data', (chunk) => {
    stderr.push(String(chunk));
  });

  try {
    await waitForServerReady();
    const results = await runChecks();
    const combinedLogs = `${stdout.join('')}\n${stderr.join('')}`.toLowerCase();
    const logLeaks = SENSITIVE_LOG_PATTERNS.filter((pattern) => combinedLogs.includes(pattern));

    results.push({
      name: 'LOGS startup',
      pass: logLeaks.length === 0,
      detail: logLeaks.length === 0 ? 'clean' : `found=${logLeaks.join(',')}`
    });

    const failed = results.filter((item) => !item.pass);
    results.forEach((item) => {
      const status = item.pass ? 'PASS' : 'FAIL';
      console.log(`${status} ${item.name} ${item.detail}`);
    });

    assert(failed.length === 0, `Falhas detectadas: ${failed.map((item) => item.name).join(', ')}`);
    console.log('ALL TESTS PASS');
  } finally {
    child.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});

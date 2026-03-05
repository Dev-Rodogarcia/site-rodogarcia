/* ==[DOC-FILE]===============================================================
Arquivo : server/repositories/userStore.js
Modulo  : Backend Node.js - persistencia
Papel   : Implementa regras de backend, validacoes e efeitos de persistencia/HTTP do modulo.

Responsabilidades:
- Processa regras de negocio e validacao de dados do backend.
- Integra com persistencia local e/ou fluxo de autenticacao.
- Produz respostas HTTP consistentes com seguranca e tratamento de erro.

Integracoes:
- Dependencias: fs, path
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Requisicoes HTTP, payload JSON, cookies e variaveis de ambiente.
- Saidas  : Respostas HTTP, escrita/leitura de store local e logs operacionais.

Elementos tecnicos: clone, resolveStorePath, readJsonFile, writeJsonFile, normalizeUsersPayload, createUserStore, ensure, read, write
[DOC-FILE-END]============================================================== */

const fs = require('fs');
const path = require('path');

const DEFAULT_USERS = { users: [] };

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveStorePath(rootDir, customPath) {
  if (!customPath) {
    return path.join(rootDir, 'server', 'storage', 'private', 'users.json');
  }

  if (path.isAbsolute(customPath)) {
    return path.normalize(customPath);
  }

  return path.normalize(path.join(rootDir, customPath));
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch {
    return clone(fallback);
  }
}

function writeJsonFile(filePath, payload) {
  const folder = path.dirname(filePath);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function normalizeUsersPayload(payload) {
  const users = payload && Array.isArray(payload.users) ? payload.users : [];
  return { users };
}

function createUserStore(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const usersFilePath = resolveStorePath(rootDir, options.usersFilePath);
  const legacyFilePath = options.legacyFilePath || path.join(rootDir, 'server', 'private', 'users.json');

  function ensure() {
    if (fs.existsSync(usersFilePath)) return;

    const legacyData = readJsonFile(legacyFilePath, DEFAULT_USERS);
    if (Array.isArray(legacyData.users) && legacyData.users.length > 0) {
      writeJsonFile(usersFilePath, normalizeUsersPayload(legacyData));
      return;
    }

    writeJsonFile(usersFilePath, clone(DEFAULT_USERS));
  }

  function read() {
    const data = readJsonFile(usersFilePath, DEFAULT_USERS);
    return normalizeUsersPayload(data);
  }

  function write(payload) {
    writeJsonFile(usersFilePath, normalizeUsersPayload(payload));
  }

  return {
    kind: 'json-file',
    filePath: usersFilePath,
    ensure,
    read,
    write
  };
}

module.exports = {
  createUserStore
};

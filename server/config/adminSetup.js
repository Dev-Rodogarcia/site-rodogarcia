/* ==[DOC-FILE]===============================================================
Arquivo : server/config/adminSetup.js
Modulo  : Backend Node.js - configuracao
Papel   : Implementa regras de backend, validacoes e efeitos de persistencia/HTTP do modulo.

Responsabilidades:
- Processa regras de negocio e validacao de dados do backend.
- Integra com persistencia local e/ou fluxo de autenticacao.
- Produz respostas HTTP consistentes com seguranca e tratamento de erro.

Integracoes:
- Dependencias: crypto
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Requisicoes HTTP, payload JSON, cookies e variaveis de ambiente.
- Saidas  : Respostas HTTP, escrita/leitura de store local e logs operacionais.

Elementos tecnicos: parseBooleanFlag, resolveAdminSetupConfig
[DOC-FILE-END]============================================================== */

const crypto = require('crypto');

function parseBooleanFlag(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function resolveAdminSetupConfig(options = {}) {
  const env = options.env || process.env;
  const isProduction = Boolean(options.isProduction);
  const configuredCode = typeof env.ADMIN_SETUP_CODE === 'string'
    ? env.ADMIN_SETUP_CODE.trim()
    : '';
  const allowInsecureDev = parseBooleanFlag(env.ALLOW_INSECURE_DEV_SETUP);

  if (configuredCode) {
    return {
      code: configuredCode,
      source: 'env',
      warnings: []
    };
  }

  if (isProduction) {
    throw new Error(
      'ADMIN_SETUP_CODE nao definido. Em producao o servidor nao pode iniciar sem esse valor.'
    );
  }

  if (!allowInsecureDev) {
    throw new Error(
      'ADMIN_SETUP_CODE nao definido. Em desenvolvimento use ALLOW_INSECURE_DEV_SETUP=true apenas de forma explicita.'
    );
  }

  const generatedCode = crypto.randomBytes(24).toString('hex');
  return {
    code: generatedCode,
    source: 'generated-dev',
    warnings: [
      'Modo de desenvolvimento inseguro ativado (ALLOW_INSECURE_DEV_SETUP=true).',
      `ADMIN_SETUP_CODE temporario desta execucao: ${generatedCode}`
    ]
  };
}

module.exports = {
  resolveAdminSetupConfig
};

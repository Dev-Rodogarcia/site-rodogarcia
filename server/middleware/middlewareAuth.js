/* ==[DOC-FILE]===============================================================
Arquivo : server/middleware/middlewareAuth.js
Modulo  : Backend Node.js - middleware
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

Elementos tecnicos: buildStaffLoginRedirect, requireDeveloperPageSession, requireDeveloperApiSession
[DOC-FILE-END]============================================================== */

function buildStaffLoginRedirect(pathname, search = '') {
  const next = encodeURIComponent(`${pathname}${search || ''}`);
  return `/auth/entrar.html?area=staff&next=${next}`;
}

function requireDeveloperPageSession(params) {
  const {
    req,
    res,
    pathname,
    search,
    getAuthContext,
    redirectResponse
  } = params;

  const authContext = getAuthContext(req);
  if (authContext) {
    return authContext;
  }

  const destination = buildStaffLoginRedirect(pathname, search);
  redirectResponse(res, 302, destination);
  return null;
}

function requireDeveloperApiSession(params) {
  const { req, res, requireAuth } = params;
  return requireAuth(req, res);
}

module.exports = {
  buildStaffLoginRedirect,
  requireDeveloperPageSession,
  requireDeveloperApiSession
};


/* ==[DOC-FILE]===============================================================
Arquivo : src/js/shared/api.js
Modulo  : Frontend - utilitarios compartilhados
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: nao ha dependencias explicitas no arquivo.
- Endpoints/rotas: /api/auth/session
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: montarCabecalhos, definirTokenCsrf, obterTokenCsrf, requisicaoApi, carregarSessao, setCsrfToken, getCsrfToken, apiRequest, loadSession
[DOC-FILE-END]============================================================== */

let tokenCsrfAtual = '';

function montarCabecalhos(metodoHttp, temCorpo) {
  const cabecalhos = {
    Accept: 'application/json'
  };

  if (temCorpo) {
    cabecalhos['Content-Type'] = 'application/json';
  }

  const metodoNormalizado = String(metodoHttp || 'GET').toUpperCase();
  const precisaCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodoNormalizado);
  if (precisaCsrf && tokenCsrfAtual) {
    cabecalhos['X-CSRF-Token'] = tokenCsrfAtual;
  }

  return cabecalhos;
}

export function definirTokenCsrf(token) {
  tokenCsrfAtual = typeof token === 'string' ? token : '';
}

export function obterTokenCsrf() {
  return tokenCsrfAtual;
}

export async function requisicaoApi(url, opcoes = {}) {
  const metodo = opcoes.method || 'GET';
  const possuiBody = opcoes.body !== undefined;

  const resposta = await fetch(url, {
    method: metodo,
    credentials: 'same-origin',
    headers: montarCabecalhos(metodo, possuiBody),
    body: possuiBody ? JSON.stringify(opcoes.body) : undefined
  });

  const ehJson = String(resposta.headers.get('content-type') || '').includes('application/json');
  const payload = ehJson ? await resposta.json() : null;

  if (!resposta.ok) {
    const mensagem = payload && payload.error ? payload.error : 'Falha na requisicao.';
    const erro = new Error(mensagem);
    erro.status = resposta.status;
    erro.payload = payload;
    throw erro;
  }

  if (payload && typeof payload.csrfToken === 'string') {
    tokenCsrfAtual = payload.csrfToken;
  }

  return payload;
}

export async function carregarSessao() {
  const sessao = await requisicaoApi('/api/auth/session');
  if (sessao && typeof sessao.csrfToken === 'string') {
    tokenCsrfAtual = sessao.csrfToken;
  }
  return sessao;
}

// Aliases para compatibilidade retroativa.
export const setCsrfToken = definirTokenCsrf;
export const getCsrfToken = obterTokenCsrf;
export const apiRequest = requisicaoApi;
export const loadSession = carregarSessao;



/* ==[DOC-FILE]===============================================================
Arquivo : src/js/shared/utils/sanitize.js
Modulo  : Frontend - utilitarios compartilhados
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: nao ha dependencias explicitas no arquivo.
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: sanitizarTexto, sanitizarUrl, paraBooleano, sanitizeText, sanitizeUrl, toBoolean
[DOC-FILE-END]============================================================== */

export function sanitizarTexto(valor, tamanhoMaximo = 500) {
  const texto = typeof valor === 'string' ? valor : '';
  return texto
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, tamanhoMaximo);
}

export function sanitizarUrl(valor) {
  if (typeof valor !== 'string') return '';
  const entrada = valor.trim();
  if (!entrada) return '';

  if (entrada.startsWith('/')) return entrada.slice(0, 300);
  if (entrada.startsWith('#')) return entrada.slice(0, 100);

  try {
    const url = new URL(entrada);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString().slice(0, 400);
    }
  } catch {
    return '';
  }

  return '';
}

export function paraBooleano(valor) {
  return Boolean(valor);
}

// Aliases para compatibilidade retroativa.
export const sanitizeText = sanitizarTexto;
export const sanitizeUrl = sanitizarUrl;
export const toBoolean = paraBooleano;



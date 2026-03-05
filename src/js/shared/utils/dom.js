/* ==[DOC-FILE]===============================================================
Arquivo : src/js/shared/utils/dom.js
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

Elementos tecnicos: limparElemento, criarElemento, definirAtributos, clearElement, createElement, setAttributes
[DOC-FILE-END]============================================================== */

export function limparElemento(elemento) {
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

export function criarElemento(nomeTag, classeCss, texto) {
  const elemento = document.createElement(nomeTag);
  if (classeCss) {
    elemento.className = classeCss;
  }
  if (typeof texto === 'string') {
    elemento.textContent = texto;
  }
  return elemento;
}

export function definirAtributos(elemento, atributos) {
  Object.entries(atributos).forEach(([chave, valor]) => {
    if (valor === null || valor === undefined || valor === false) {
      return;
    }
    elemento.setAttribute(chave, String(valor));
  });
  return elemento;
}

// Aliases para compatibilidade retroativa.
export const clearElement = limparElemento;
export const createElement = criarElemento;
export const setAttributes = definirAtributos;



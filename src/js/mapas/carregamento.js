/* ==[DOC-FILE]===============================================================
Arquivo : src/js/mapas/carregamento.js
Modulo  : Frontend - mapa interativo
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: ./config.js
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: .svg-mapa-brasil, parsererror, svg

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: renderLoadError, carregarMapa
[DOC-FILE-END]============================================================== */

import { CAMINHO_SVG } from './config.js';

function renderLoadError(container) {
  if (!container) return;

  const message = document.createElement('p');
  message.style.textAlign = 'center';
  message.style.color = '#e74c3c';
  message.style.padding = '40px';
  message.textContent = 'Erro ao carregar o mapa. Por favor, recarregue a pagina.';

  container.replaceChildren(message);
}

export async function carregarMapa() {
  try {
    const response = await fetch(CAMINHO_SVG);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const svgText = await response.text();
    const container = document.querySelector('.svg-mapa-brasil');
    if (!container) {
      return null;
    }

    const parser = new DOMParser();
    const parsed = parser.parseFromString(svgText, 'image/svg+xml');
    const parserError = parsed.querySelector('parsererror');
    if (parserError) {
      throw new Error('Falha ao interpretar o SVG.');
    }

    const svgNode = parsed.documentElement;
    if (!svgNode || svgNode.tagName.toLowerCase() !== 'svg') {
      throw new Error('Conteudo SVG invalido.');
    }

    const imported = document.importNode(svgNode, true);
    container.replaceChildren(imported);

    return container.querySelector('svg');
  } catch (error) {
    console.error('Erro ao carregar mapa:', error);
    renderLoadError(document.querySelector('.svg-mapa-brasil'));
    return null;
  }
}


/* ==[DOC-FILE]===============================================================
Arquivo : src/js/mapas/destaques.js
Modulo  : Frontend - mapa interativo
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: ./config.js, ./mapeamento.js
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: path[id]

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: resetarEstados, aplicarDestaquesFixos, destacarEstado, removerDestaqueEstado
[DOC-FILE-END]============================================================== */

/**
 * FunÃ§Ãµes de Destaque dos Estados
 * Aplica cores e estilos aos estados do mapa
 */

import { ESTADOS_COM_FILIAIS, CORES } from './config.js';
import { getIndicePorEstado } from './mapeamento.js';

/**
 * Reseta todos os estados para a cor base
 */
export function resetarEstados(svgElement) {
    const todosPaths = svgElement.querySelectorAll('path[id]');
    
    todosPaths.forEach(path => {
        const estadoId = path.id ? path.id.toLowerCase() : '';
        if (estadoId && estadoId.length === 2) {
            path.style.setProperty('fill', CORES.base, 'important');
            path.style.setProperty('stroke', CORES.stroke, 'important');
            path.style.setProperty('stroke-width', CORES.strokeWidth.normal, 'important');
            path.classList.remove('state-highlight');
            path.removeAttribute('data-estado');
        }
    });
}

/**
 * Aplica destaque aos estados com filiais
 */
export function aplicarDestaquesFixos(svgElement) {
    console.log('ðŸŽ¨ Aplicando destaques aos estados com filiais...');
    
    const todosPaths = svgElement.querySelectorAll('path[id]');
    const pathsArray = Array.from(todosPaths);
    
    // PRIMEIRO: Resetar TODOS os estados
    resetarEstados(svgElement);
    
    // SEGUNDO: Destacar APENAS os estados com filiais
    let estadosEncontrados = 0;
    
    ESTADOS_COM_FILIAIS.forEach(estadoDesejado => {
        const indiceCorreto = getIndicePorEstado(estadoDesejado);
        
        if (indiceCorreto !== null && pathsArray[indiceCorreto]) {
            const elemento = pathsArray[indiceCorreto];
            
            console.log(`âœ… Estado ${estadoDesejado.toUpperCase()} encontrado no Ã­ndice ${indiceCorreto} (ID no SVG: "${elemento.id}")`);
            
            // Aplicar destaque em azul
            elemento.style.setProperty('fill', CORES.destaque, 'important');
            elemento.style.setProperty('stroke', CORES.stroke, 'important');
            elemento.style.setProperty('stroke-width', CORES.strokeWidth.destacado, 'important');
            elemento.classList.add('state-highlight');
            elemento.setAttribute('data-estado', estadoDesejado);
            
            estadosEncontrados++;
        } else {
            console.warn(`âŒ Estado ${estadoDesejado.toUpperCase()} nÃ£o encontrado ou nÃ£o mapeado`);
        }
    });
    
    console.log(`âœ… ${estadosEncontrados}/${ESTADOS_COM_FILIAIS.length} estados destacados`);
}

/**
 * Destaca um estado especÃ­fico (para interaÃ§Ãµes - estado selecionado)
 */
export function destacarEstado(svgElement, estadoId) {
    const indice = getIndicePorEstado(estadoId);
    if (indice === null) return;
    
    const todosPaths = svgElement.querySelectorAll('path[id]');
    const pathsArray = Array.from(todosPaths);
    const elemento = pathsArray[indice];
    
    if (elemento) {
        // Aplicar cor de destaque (azul escuro) para estado selecionado
        elemento.style.setProperty('fill', CORES.destaque, 'important');
        elemento.style.setProperty('stroke', CORES.stroke, 'important');
        elemento.style.setProperty('stroke-width', CORES.strokeWidth.destacado, 'important');
        elemento.classList.add('state-highlight');
    }
}

/**
 * Remove destaque de um estado (volta para cor base ou destacado)
 */
export function removerDestaqueEstado(svgElement, estadoId) {
    const indice = getIndicePorEstado(estadoId);
    if (indice === null) return;
    
    const todosPaths = svgElement.querySelectorAll('path[id]');
    const pathsArray = Array.from(todosPaths);
    const elemento = pathsArray[indice];
    
    if (elemento) {
        const temFilial = ESTADOS_COM_FILIAIS.includes(estadoId.toLowerCase());
        elemento.style.setProperty('fill', temFilial ? CORES.destaque : CORES.base, 'important');
        elemento.style.setProperty('stroke-width', temFilial ? CORES.strokeWidth.destacado : CORES.strokeWidth.normal, 'important');
    }
}




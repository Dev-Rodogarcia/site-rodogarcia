/* ==[DOC-FILE]===============================================================
Arquivo : src/js/mapas/interacoes.js
Modulo  : Frontend - mapa interativo
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: ./filiais.js, ./mapeamento.js, ./destaques.js, ./config.js
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: .svg-mapa-brasil svg, [data-estado-selecionado], path[id], [data-estado-selecionado=, #cardDetalhesFilial, #selectFilial

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: criarItemInfo, atualizarCardFilial, configurarSelectFilial, configurarCliquesEstados, configurarInteracoes
[DOC-FILE-END]============================================================== */

import { getFilial, getFiliaisPorEstado, filiais } from './filiais.js';
import { getEstadoPorIndice, getIndicePorEstado } from './mapeamento.js';
import { destacarEstado, removerDestaqueEstado } from './destaques.js';
import { ESTADOS_COM_FILIAIS, CORES } from './config.js';

function criarItemInfo(iconeClasse, texto) {
    const item = document.createElement('li');
    const icone = document.createElement('i');
    icone.className = iconeClasse;
    const textoNode = document.createTextNode(` ${texto}`);
    item.append(icone, textoNode);
    return item;
}

/**
 * Atualiza o card de detalhes da filial
 */
export function atualizarCardFilial(filialId) {
    const filial = getFilial(filialId);
    if (!filial) return;

    const card = document.getElementById('cardDetalhesFilial');
    if (card) {
        const titulo = document.createElement('h3');
        titulo.textContent = filial.nome;

        const lista = document.createElement('ul');
        lista.append(
            criarItemInfo('ph ph-map-pin', filial.endereco),
            criarItemInfo('ph ph-phone', filial.telefone),
            criarItemInfo('ph ph-envelope', filial.email)
        );

        const botao = document.createElement('a');
        botao.href = '#';
        botao.className = 'botao botao-mini btn-contato-filial';
        botao.textContent = 'Entre em contato';

        card.replaceChildren(titulo, lista, botao);
    }

    // Atualiza o select
    const select = document.getElementById('selectFilial');
    if (select) {
        select.value = filialId;
    }
}

/**
 * Configura interaÃ§Ãµes do select de filiais
 */
export function configurarSelectFilial() {
    const select = document.getElementById('selectFilial');
    
    if (select) {
        select.addEventListener('change', (e) => {
            atualizarCardFilial(e.target.value);
            
            // Destacar estado no mapa (se houver)
            const filial = getFilial(e.target.value);
            if (filial && filial.estado) {
                const svgElement = document.querySelector('.svg-mapa-brasil svg');
                if (svgElement) {
                    // Remover destaque anterior
                    const estadosDestacados = svgElement.querySelectorAll('[data-estado-selecionado]');
                    estadosDestacados.forEach(el => {
                        el.removeAttribute('data-estado-selecionado');
                        removerDestaqueEstado(svgElement, el.getAttribute('data-estado'));
                    });
                    
                    // Destacar novo estado
                    destacarEstado(svgElement, filial.estado);
                    const indice = getIndicePorEstado(filial.estado);
                    if (indice !== null) {
                        const todosPaths = svgElement.querySelectorAll('path[id]');
                        const pathsArray = Array.from(todosPaths);
                        const elemento = pathsArray[indice];
                        if (elemento) {
                            elemento.setAttribute('data-estado-selecionado', 'true');
                        }
                    }
                }
            }
        });
    }
}

/**
 * Configura cliques nos estados do mapa
 */
export function configurarCliquesEstados(svgElement) {
    const todosPaths = svgElement.querySelectorAll('path[id]');
    const pathsArray = Array.from(todosPaths);
    
    pathsArray.forEach((path, index) => {
        // Obter estado pelo mapeamento (NÃƒO usar ID do SVG como fallback pois estÃ£o errados)
        let estadoId = getEstadoPorIndice(index);
        
        // Se nÃ£o encontrou no mapeamento, ainda assim adicionar interaÃ§Ãµes bÃ¡sicas
        // mas sem identificar o estado (serÃ¡ null)
        
        if (estadoId || true) { // Permitir interaÃ§Ãµes mesmo sem mapeamento
            // Adicionar cursor pointer
            path.style.cursor = 'pointer';
            path.setAttribute('data-estado-id', estadoId);
            
            // Adicionar evento de clique
            path.addEventListener('click', () => {
                if (!estadoId) {
                    console.log(`ðŸ“ Estado nÃ£o mapeado clicado (Ã­ndice ${index}, ID no SVG: "${path.id}")`);
                    // AnimaÃ§Ã£o de feedback
                    path.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        path.style.animation = '';
                    }, 500);
                    return;
                }
                
                console.log(`ðŸ“ Estado clicado: ${estadoId.toUpperCase()} (Ã­ndice ${index})`);
                
                // PRIMEIRO: Desmarcar TODOS os estados selecionados anteriormente
                const estadosSelecionados = svgElement.querySelectorAll('[data-estado-selecionado="true"]');
                estadosSelecionados.forEach(estadoAnterior => {
                    const estadoAnteriorId = estadoAnterior.getAttribute('data-estado-id');
                    if (estadoAnteriorId) {
                        removerDestaqueEstado(svgElement, estadoAnteriorId);
                    }
                    estadoAnterior.removeAttribute('data-estado-selecionado');
                });
                
                // Buscar filiais deste estado
                const filiaisEstado = getFiliaisPorEstado(estadoId);
                
                if (filiaisEstado.length > 0) {
                    // Se houver mÃºltiplas filiais, mostrar a primeira
                    // Buscar o ID da primeira filial
                    const primeiraFilial = filiaisEstado[0];
                    const filialId = Object.keys(filiais).find(
                        id => filiais[id] === primeiraFilial
                    );
                    if (filialId) {
                        atualizarCardFilial(filialId);
                    }
                    
                    // Destacar NOVO estado
                    destacarEstado(svgElement, estadoId);
                    path.setAttribute('data-estado-selecionado', 'true');
                } else {
                    // Estado sem filiais - pode mostrar mensagem ou animaÃ§Ã£o
                    console.log(`â„¹ï¸ Estado ${estadoId.toUpperCase()} nÃ£o possui filiais`);
                    
                    // AnimaÃ§Ã£o de "shake" ou feedback visual
                    path.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        path.style.animation = '';
                    }, 500);
                }
            });
            
            // Adicionar evento de hover (padronizado para todos os estados)
            path.addEventListener('mouseenter', () => {
                if (!path.hasAttribute('data-estado-selecionado')) {
                    // Aplicar hover padronizado para todos os estados
                    path.style.setProperty('fill', CORES.hover, 'important');
                    path.style.setProperty('opacity', '0.9', 'important');
                    path.style.setProperty('stroke-width', CORES.strokeWidth.destacado, 'important');
                }
            });
            
            path.addEventListener('mouseleave', () => {
                if (!path.hasAttribute('data-estado-selecionado')) {
                    // Voltar para cor base ou destacada dependendo se tem filial
                    if (estadoId) {
                        const temFilial = ESTADOS_COM_FILIAIS.includes(estadoId.toLowerCase());
                        const indice = getIndicePorEstado(estadoId);
                        
                        if (indice !== null) {
                            // Estado mapeado - usar funÃ§Ã£o de remover destaque
                            removerDestaqueEstado(svgElement, estadoId);
                        } else {
                            // Estado nÃ£o mapeado mas identificado - voltar para cor base ou destacada
                            path.style.setProperty('fill', temFilial ? CORES.destaque : CORES.base, 'important');
                            path.style.setProperty('opacity', '1', 'important');
                            path.style.setProperty('stroke-width', temFilial ? CORES.strokeWidth.destacado : CORES.strokeWidth.normal, 'important');
                        }
                    } else {
                        // Estado nÃ£o mapeado - voltar para cor base
                        path.style.setProperty('fill', CORES.base, 'important');
                        path.style.setProperty('opacity', '1', 'important');
                        path.style.setProperty('stroke-width', CORES.strokeWidth.normal, 'important');
                    }
                }
            });
        }
    });
}

/**
 * Configura todas as interaÃ§Ãµes do mapa
 */
export function configurarInteracoes(svgElement) {
    configurarSelectFilial();
    configurarCliquesEstados(svgElement);
}


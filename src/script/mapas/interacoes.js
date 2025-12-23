/**
 * Interações do Mapa
 * Cliques, hover, seleção de filiais, etc.
 */

import { getFilial, getFiliaisPorEstado, filiais } from './filiais.js';
import { getEstadoPorIndice, getIndicePorEstado } from './mapeamento.js';
import { destacarEstado, removerDestaqueEstado } from './destaques.js';
import { ESTADOS_COM_FILIAIS, CORES } from './config.js';

/**
 * Atualiza o card de detalhes da filial
 */
export function atualizarCardFilial(filialId) {
    const filial = getFilial(filialId);
    if (!filial) return;

    const card = document.getElementById('cardDetalhesFilial');
    if (card) {
        card.innerHTML = `
            <h3>${filial.nome}</h3>
            <ul>
                <li><i class="ph ph-map-pin"></i> ${filial.endereco}</li>
                <li><i class="ph ph-phone"></i> ${filial.telefone}</li>
                <li><i class="ph ph-envelope"></i> ${filial.email}</li>
            </ul>
            <a href="#" class="botao botao-mini btn-contato-filial">Entre em contato</a>
        `;
    }

    // Atualiza o select
    const select = document.getElementById('selectFilial');
    if (select) {
        select.value = filialId;
    }
}

/**
 * Configura interações do select de filiais
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
        // Obter estado pelo mapeamento (NÃO usar ID do SVG como fallback pois estão errados)
        let estadoId = getEstadoPorIndice(index);
        
        // Se não encontrou no mapeamento, ainda assim adicionar interações básicas
        // mas sem identificar o estado (será null)
        
        if (estadoId || true) { // Permitir interações mesmo sem mapeamento
            // Adicionar cursor pointer
            path.style.cursor = 'pointer';
            path.setAttribute('data-estado-id', estadoId);
            
            // Adicionar evento de clique
            path.addEventListener('click', () => {
                if (!estadoId) {
                    console.log(`📍 Estado não mapeado clicado (índice ${index}, ID no SVG: "${path.id}")`);
                    // Animação de feedback
                    path.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        path.style.animation = '';
                    }, 500);
                    return;
                }
                
                console.log(`📍 Estado clicado: ${estadoId.toUpperCase()} (índice ${index})`);
                
                // Buscar filiais deste estado
                const filiaisEstado = getFiliaisPorEstado(estadoId);
                
                if (filiaisEstado.length > 0) {
                    // Se houver múltiplas filiais, mostrar a primeira
                    // Buscar o ID da primeira filial
                    const primeiraFilial = filiaisEstado[0];
                    const filialId = Object.keys(filiais).find(
                        id => filiais[id] === primeiraFilial
                    );
                    if (filialId) {
                        atualizarCardFilial(filialId);
                    }
                    
                    // Destacar estado
                    destacarEstado(svgElement, estadoId);
                    path.setAttribute('data-estado-selecionado', 'true');
                } else {
                    // Estado sem filiais - pode mostrar mensagem ou animação
                    console.log(`ℹ️ Estado ${estadoId.toUpperCase()} não possui filiais`);
                    
                    // Animação de "shake" ou feedback visual
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
                            // Estado mapeado - usar função de remover destaque
                            removerDestaqueEstado(svgElement, estadoId);
                        } else {
                            // Estado não mapeado mas identificado - voltar para cor base ou destacada
                            path.style.setProperty('fill', temFilial ? CORES.destaque : CORES.base, 'important');
                            path.style.setProperty('opacity', '1', 'important');
                            path.style.setProperty('stroke-width', temFilial ? CORES.strokeWidth.destacado : CORES.strokeWidth.normal, 'important');
                        }
                    } else {
                        // Estado não mapeado - voltar para cor base
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
 * Configura todas as interações do mapa
 */
export function configurarInteracoes(svgElement) {
    configurarSelectFilial();
    configurarCliquesEstados(svgElement);
}


/**
 * Mapa do Brasil - Arquivo Principal
 * Inicializa e coordena todas as funcionalidades do mapa
 */

import { carregarMapa } from './carregamento.js';
import { aplicarDestaquesFixos } from './destaques.js';
import { configurarInteracoes } from './interacoes.js';

/**
 * Inicializa o mapa
 */
async function inicializarMapa() {
    // Carregar SVG
    const svgElement = await carregarMapa();
    
    if (!svgElement) {
        return;
    }
    
    // Aplicar destaques aos estados com filiais
    aplicarDestaquesFixos(svgElement);
    
    // Configurar interações (cliques, hover, select)
    configurarInteracoes(svgElement);
    
    console.log('✅ Mapa inicializado com sucesso!');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    console.log('⏳ Aguardando DOM carregar...');
    document.addEventListener('DOMContentLoaded', inicializarMapa);
} else {
    console.log('✅ DOM já carregado, iniciando mapa...');
    inicializarMapa();
}


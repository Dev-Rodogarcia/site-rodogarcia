/**
 * Carregamento do Mapa SVG
 * Funções para carregar e inserir o SVG no DOM
 */

import { CAMINHO_SVG } from './config.js';

/**
 * Carrega o SVG do mapa e insere no DOM
 */
export async function carregarMapa() {
    try {
        console.log('🗺️ Iniciando carregamento do mapa...');
        const response = await fetch(CAMINHO_SVG);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const svgText = await response.text();
        console.log('✅ SVG carregado com sucesso');

        const mapaContainer = document.querySelector('.svg-mapa-brasil');
        if (!mapaContainer) {
            console.error('❌ Container .svg-mapa-brasil não encontrado!');
            return null;
        }

        mapaContainer.innerHTML = svgText;
        console.log('✅ SVG inserido no DOM');

        const svgElement = mapaContainer.querySelector('svg');
        if (!svgElement) {
            console.error('❌ Elemento SVG não encontrado após inserção');
            return null;
        }

        return svgElement;
    } catch (error) {
        console.error('❌ Erro ao carregar mapa:', error);
        const mapaContainer = document.querySelector('.svg-mapa-brasil');
        if (mapaContainer) {
            mapaContainer.innerHTML = `
                <p style="text-align: center; color: #e74c3c; padding: 40px;">
                    Erro ao carregar o mapa. Por favor, recarregue a página.
                </p>
            `;
        }
        return null;
    }
}


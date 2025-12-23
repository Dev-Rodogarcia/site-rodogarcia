/**
 * Configurações do Mapa
 * Cores, estados e constantes gerais
 */

// Estados com filiais (serão destacados em azul)
export const ESTADOS_COM_FILIAIS = ['sp', 'pe', 'pr', 'rj', 'rs'];

// Cores do mapa
export const CORES = {
    base: '#A9D4EF',           // Azul claro para estados sem filiais
    destaque: '#2E2882',       // Azul escuro para estados com filiais
    hover: '#414D82',          // Azul médio no hover
    stroke: '#ffffff',         // Borda branca
    strokeWidth: {
        normal: '1.5',
        destacado: '2'
    }
};

// Caminho do SVG do mapa
export const CAMINHO_SVG = './src/script/mapas/map.svg';


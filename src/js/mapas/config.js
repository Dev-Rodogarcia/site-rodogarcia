/* ==[DOC-FILE]===============================================================
Arquivo : src/js/mapas/config.js
Modulo  : Frontend - mapa interativo
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

Elementos tecnicos: ESTADOS_COM_FILIAIS, CORES, CAMINHO_SVG
[DOC-FILE-END]============================================================== */

/**
 * ConfiguraÃ§Ãµes do Mapa
 * Cores, estados e constantes gerais
 */

// Estados com filiais (serÃ£o destacados em azul)
export const ESTADOS_COM_FILIAIS = ['sp', 'pe', 'pr', 'rj', 'rs'];

// Cores do mapa
export const CORES = {
    base: '#A9D4EF',           // Azul claro para estados sem filiais
    destaque: '#2E2882',       // Azul escuro para estados com filiais
    hover: '#414D82',          // Azul mÃ©dio no hover
    stroke: '#ffffff',         // Borda branca
    strokeWidth: {
        normal: '1.5',
        destacado: '2'
    }
};

// Caminho do SVG do mapa
export const CAMINHO_SVG = '/src/js/mapas/map.svg';




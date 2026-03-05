/* ==[DOC-FILE]===============================================================
Arquivo : src/js/mapas/mapa.js
Modulo  : Frontend - mapa interativo
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: ./carregamento.js, ./destaques.js, ./interacoes.js
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: inicializarMapa
[DOC-FILE-END]============================================================== */

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
    
    // Configurar interaÃ§Ãµes (cliques, hover, select)
    configurarInteracoes(svgElement);
    
    console.log('âœ… Mapa inicializado com sucesso!');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    console.log('â³ Aguardando DOM carregar...');
    document.addEventListener('DOMContentLoaded', inicializarMapa);
} else {
    console.log('âœ… DOM jÃ¡ carregado, iniciando mapa...');
    inicializarMapa();
}




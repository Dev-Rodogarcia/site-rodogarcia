/* ==[DOC-FILE]===============================================================
Arquivo : src/js/mapas/mapeamento.js
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

Elementos tecnicos: getIndicePorEstado, getEstadoPorIndice, MAPEAMENTO_INDICE_PARA_ESTADO
[DOC-FILE-END]============================================================== */

/**
 * Mapeamento de Ãndices para Estados
 * Os IDs no SVG estÃ£o atribuÃ­dos na ordem errada, entÃ£o precisamos mapear
 * qual Ã­ndice no array de paths corresponde a qual estado real
 */

// Mapeamento: qual ÃNDICE no array de paths corresponde a qual estado REAL
// Baseado na descriÃ§Ã£o: "no Acre tÃ¡ dizendo Alagoas 1" = Ã­ndice 1 Ã© o estado real AC
export const MAPEAMENTO_INDICE_PARA_ESTADO = {
    // RegiÃ£o Norte
    0: 'ro',   // RondÃ´nia (estÃ¡ mostrando "Acre 0")
    1: 'ac',   // Acre (estÃ¡ mostrando "Alagoas 1") âœ… CORRIGIDO
    2: 'am',   // Amazonas (estÃ¡ mostrando "AmapÃ¡ 2")
    3: 'rr',   // Roraima (estÃ¡ mostrando "Amazonas 3")
    4: 'ap',   // AmapÃ¡ (estÃ¡ mostrando "Bahia 4")
    21: 'pa',  // ParÃ¡ (estÃ¡ mostrando "RondÃ´nia 21")
    6: 'mt',   // Mato Grosso (estÃ¡ mostrando "Distrito Federal 6")
    5: 'to',   // Tocantins (estÃ¡ mostrando "CearÃ¡ 5")
    
    // RegiÃ£o Nordeste
    20: 'ma',  // MaranhÃ£o (estÃ¡ mostrando "Rio Grande do Sul 20")
    13: 'pi',  // PiauÃ­ (estÃ¡ mostrando "ParÃ¡ 13")
    14: 'ce',  // CearÃ¡ (estÃ¡ mostrando "ParaÃ­ba 14")
    15: 'rn',  // Rio Grande do Norte (estÃ¡ mostrando "ParanÃ¡ 15") âœ… CORRIGIDO
    19: 'pe',  // Pernambuco (estÃ¡ mostrando "Rio Grande do Norte 19")
    16: 'al',  // Alagoas (estÃ¡ mostrando "Pernambuco 16")
    17: 'se',  // Sergipe (estÃ¡ mostrando "PiauÃ­ 17")
    12: 'ba',  // Bahia (estÃ¡ mostrando "Minas Gerais 12")
    9: 'mg',   // Minas Gerais (estÃ¡ mostrando "MaranhÃ£o 9")
    26: 'pb',  // ParaÃ­ba (estÃ¡ mostrando "Tocantins 26") âœ… CORRIGIDO
    
    // RegiÃ£o Centro-Oeste
    8: 'ms',   // Mato Grosso do Sul (estÃ¡ mostrando "GoiÃ¡s 8")
    10: 'pr',  // ParanÃ¡ (estÃ¡ mostrando "Mato Grosso 10")
    // GO - GoiÃ¡s: precisa descobrir qual Ã­ndice mostra "EspÃ­rito Santo"
    // DF - Distrito Federal: precisa descobrir qual Ã­ndice
    
    // RegiÃ£o Sudeste
    22: 'sp',  // SÃ£o Paulo (estÃ¡ mostrando "Roraima 22")
    24: 'es',  // EspÃ­rito Santo (estÃ¡ mostrando "SÃ£o Paulo 24")
    23: 'rj',  // Rio de Janeiro (estÃ¡ mostrando "Santa Catarina 23" mas aponta para RJ) âœ… CORRIGIDO
    // DF - Distrito Federal: precisa descobrir qual Ã­ndice realmente Ã©
    // GO - GoiÃ¡s: vocÃª disse que estÃ¡ mostrando "EspÃ­rito Santo", entÃ£o preciso descobrir qual Ã­ndice
    
    // RegiÃ£o Sul
    25: 'sc',  // Santa Catarina (estÃ¡ mostrando "Sergipe 25")
    11: 'rs'   // Rio Grande do Sul (estÃ¡ mostrando "Mato Grosso do Sul 11")
    
    // Estados ainda faltantes:
    // GO - GoiÃ¡s (estÃ¡ mostrando "EspÃ­rito Santo" - qual Ã­ndice?)
    // DF - Distrito Federal (nÃ£o mencionado - qual Ã­ndice?)
};

/**
 * Busca o Ã­ndice de um estado no array de paths
 */
export function getIndicePorEstado(estadoId) {
    const indice = Object.keys(MAPEAMENTO_INDICE_PARA_ESTADO).find(
        idx => MAPEAMENTO_INDICE_PARA_ESTADO[idx] === estadoId.toLowerCase()
    );
    return indice !== undefined ? parseInt(indice) : null;
}

/**
 * Busca o estado real pelo Ã­ndice
 */
export function getEstadoPorIndice(indice) {
    return MAPEAMENTO_INDICE_PARA_ESTADO[indice] || null;
}




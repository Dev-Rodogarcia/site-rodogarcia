/* ==[DOC-FILE]===============================================================
Arquivo : src/js/carousels.js
Modulo  : Frontend - scripts publicos
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: nao ha dependencias explicitas no arquivo.
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: .carousel-slide, .card-depoimento, #carouselCertificados, #carouselDepoimentos

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: sem funcoes nomeadas; fluxo concentrado em expressoes inline.
[DOC-FILE-END]============================================================== */

// Script para clonar carrossÃ©is automaticamente (evita duplicaÃ§Ã£o no HTML)

document.addEventListener('DOMContentLoaded', function() {
    // Clonar Certificados (index.html)
    const carouselCertificados = document.getElementById('carouselCertificados');
    if (carouselCertificados) {
        const originalSlide = carouselCertificados.querySelector('.carousel-slide');
        if (originalSlide) {
            // Clonar 3 vezes para criar 4 grupos total
            for (let i = 0; i < 3; i++) {
                const clone = originalSlide.cloneNode(true);
                carouselCertificados.appendChild(clone);
            }
        }
    }

    // Clonar Depoimentos (servicos.html)
    const carouselDepoimentos = document.getElementById('carouselDepoimentos');
    if (carouselDepoimentos) {
        const cards = carouselDepoimentos.querySelectorAll('.card-depoimento');
        if (cards.length > 0) {
            // Clonar todos os cards uma vez para criar loop infinito
            cards.forEach(card => {
                const clone = card.cloneNode(true);
                carouselDepoimentos.appendChild(clone);
            });
        }
    }
});




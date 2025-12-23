// Script para clonar carrosséis automaticamente (evita duplicação no HTML)

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


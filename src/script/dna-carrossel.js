document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('carrossel-dna');
    if (!container) return;

    const slides = Array.from(container.querySelectorAll('[data-dna-slide]'));
    if (slides.length < 2) return;

    const btnAnterior = container.querySelector('[data-dna-anterior]');
    const btnProximo = container.querySelector('[data-dna-proximo]');
    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const intervaloMs = 5000;

    let indiceAtual = 0;
    let temporizador = null;
    let toqueInicioX = 0;
    let toqueInicioY = 0;

    const atualizarSlides = (novoIndice) => {
        indiceAtual = novoIndice;
        slides.forEach((slide, indice) => {
            const ativo = indice === indiceAtual;
            slide.classList.toggle('carrossel-dna__slide--ativo', ativo);
            slide.setAttribute('aria-hidden', ativo ? 'false' : 'true');
        });
    };

    const proximo = () => {
        const novoIndice = (indiceAtual + 1) % slides.length;
        atualizarSlides(novoIndice);
    };

    const anterior = () => {
        const novoIndice = (indiceAtual - 1 + slides.length) % slides.length;
        atualizarSlides(novoIndice);
    };

    const pararAutoplay = () => {
        if (!temporizador) return;
        clearInterval(temporizador);
        temporizador = null;
    };

    const iniciarAutoplay = () => {
        if (reduzMovimento) return;
        pararAutoplay();
        temporizador = setInterval(proximo, intervaloMs);
    };

    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            anterior();
            iniciarAutoplay();
        });
    }

    if (btnProximo) {
        btnProximo.addEventListener('click', () => {
            proximo();
            iniciarAutoplay();
        });
    }

    container.addEventListener('mouseenter', pararAutoplay);
    container.addEventListener('mouseleave', iniciarAutoplay);
    container.addEventListener('focusin', pararAutoplay);
    container.addEventListener('focusout', iniciarAutoplay);

    container.addEventListener('touchstart', (evento) => {
        const toque = evento.changedTouches[0];
        toqueInicioX = toque.clientX;
        toqueInicioY = toque.clientY;
    }, { passive: true });

    container.addEventListener('touchend', (evento) => {
        const toque = evento.changedTouches[0];
        const deltaX = toque.clientX - toqueInicioX;
        const deltaY = toque.clientY - toqueInicioY;
        const limiarSwipe = 45;

        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        if (Math.abs(deltaX) < limiarSwipe) return;

        if (deltaX < 0) {
            proximo();
        } else {
            anterior();
        }

        iniciarAutoplay();
    }, { passive: true });

    container.addEventListener('keydown', (evento) => {
        if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            anterior();
            iniciarAutoplay();
        }

        if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            proximo();
            iniciarAutoplay();
        }
    });

    atualizarSlides(0);
    iniciarAutoplay();
});

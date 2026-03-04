/**
 * CarrosselHero
 * Carrossel completo para a seção Hero da página inicial.
 *
 * Funcionalidades:
 *  - Troca de slides com animação (fade + slide)
 *  - Autoplay configurável com pausar ao hover/foco
 *  - Navegação por botões anterior/próximo
 *  - Indicadores clicáveis (dots)
 *  - Suporte a teclado (setas esquerda/direita, Home, End)
 *  - Suporte a swipe em telas touch
 *  - Prefere reduzir movimento (prefers-reduced-motion)
 *  - Callbacks de ciclo de vida: aoMudar, aoIniciar, aoPausar
 */

class CarrosselHero {
    /**
     * @param {string} seletorContainer - Seletor CSS do elemento raiz do carrossel
     * @param {object} opcoes - Opções de configuração
     * @param {number}  [opcoes.intervalo=5000]       - Intervalo do autoplay em ms
     * @param {boolean} [opcoes.autoplay=true]         - Ativar autoplay automático
     * @param {boolean} [opcoes.pausarNoHover=true]    - Pausar ao passar o mouse
     * @param {boolean} [opcoes.loop=true]             - Voltar ao primeiro após o último
     * @param {string}  [opcoes.direcao='horizontal']  - 'horizontal' ou 'fade'
     * @param {Function} [opcoes.aoMudar]              - Callback(indiceAnterior, indiceAtual)
     */
    constructor(seletorContainer, opcoes = {}) {
        this._container = document.querySelector(seletorContainer);
        if (!this._container) return;

        // Opções com valores padrão
        this._opcoes = {
            intervalo: opcoes.intervalo ?? 5500,
            autoplay: opcoes.autoplay ?? true,
            pausarNoHover: opcoes.pausarNoHover ?? true,
            loop: opcoes.loop ?? true,
            direcao: opcoes.direcao ?? 'fade',
            aoMudar: opcoes.aoMudar ?? null,
        };

        // Estado interno
        this._indiceAtual = 0;
        this._totalSlides = 0;
        this._temporizador = null;
        this._emTransicao = false;
        this._pausado = false;
        this._pausadoPorVisibilidade = false;

        // Dados para swipe touch
        this._toqueInicioX = 0;
        this._toqueInicioY = 0;

        this._inicializar();
    }

    // ─── Inicialização ────────────────────────────────────────────────────────

    _inicializar() {
        this._slides = Array.from(
            this._container.querySelectorAll('[data-carrossel-slide]')
        );
        this._totalSlides = this._slides.length;

        if (this._totalSlides < 2) return; // Carrossel não necessário com 1 slide

        this._obterElementosNavegacao();
        this._configurarSlides();
        this._vincularEventos();
        this._irParaSlide(0, false);

        if (this._opcoes.autoplay) {
            this._iniciarAutoplay();
        }
    }

    _obterElementosNavegacao() {
        this._btnAnterior = this._container.querySelector('[data-carrossel-anterior]');
        this._btnProximo = this._container.querySelector('[data-carrossel-proximo]');
    }

    _configurarSlides() {
        this._slides.forEach((slide, indice) => {
            slide.setAttribute('aria-hidden', 'true');
            slide.setAttribute('role', 'tabpanel');
            slide.setAttribute('id', `hero-slide-${indice}`);
            slide.setAttribute('aria-label', `Slide ${indice + 1} de ${this._totalSlides}`);
            slide.classList.add('carrossel-hero__slide');
        });
    }

    // ─── Navegação ────────────────────────────────────────────────────────────

    _irParaSlide(novoIndice, animar = true) {
        if (this._emTransicao && animar) return;
        if (novoIndice === this._indiceAtual && animar) return;

        const indiceAnterior = this._indiceAtual;
        this._indiceAtual = novoIndice;

        this._emTransicao = animar;

        // Atualiza slides
        this._slides.forEach((slide, i) => {
            const ativo = i === this._indiceAtual;
            slide.classList.toggle('carrossel-hero__slide--ativo', ativo);
            slide.setAttribute('aria-hidden', ativo ? 'false' : 'true');
        });

        // Atualiza estado dos botões prev/next
        this._atualizarBotoes();

        // Dispara callback do usuário
        if (typeof this._opcoes.aoMudar === 'function') {
            this._opcoes.aoMudar(indiceAnterior, this._indiceAtual);
        }

        // Reseta flag de transição após a duração da animação CSS
        if (animar) {
            const duracao = obterDuracaoTransicaoSlide(this._slides[this._indiceAtual]);
            setTimeout(() => { this._emTransicao = false; }, duracao);
        } else {
            this._emTransicao = false;
        }
    }

    proximo() {
        const novoIndice = this._indiceAtual + 1;
        if (novoIndice >= this._totalSlides) {
            if (this._opcoes.loop) this._irParaSlide(0);
        } else {
            this._irParaSlide(novoIndice);
        }
    }

    anterior() {
        const novoIndice = this._indiceAtual - 1;
        if (novoIndice < 0) {
            if (this._opcoes.loop) this._irParaSlide(this._totalSlides - 1);
        } else {
            this._irParaSlide(novoIndice);
        }
    }

    _atualizarBotoes() {
        if (!this._btnAnterior || !this._btnProximo) return;
        if (this._opcoes.loop) return; // Com loop, botões sempre habilitados

        this._btnAnterior.disabled = this._indiceAtual === 0;
        this._btnProximo.disabled = this._indiceAtual === this._totalSlides - 1;
    }

    // ─── Autoplay ─────────────────────────────────────────────────────────────

    _iniciarAutoplay() {
        if (this._prefereReducaoMovimento()) return;
        this._pararAutoplay();
        this._temporizador = setInterval(() => {
            if (!this._pausado) this.proximo();
        }, this._opcoes.intervalo);
    }

    _pararAutoplay() {
        if (this._temporizador) {
            clearInterval(this._temporizador);
            this._temporizador = null;
        }
    }

    pausar() {
        this._pausado = true;
        this._container.setAttribute('data-carrossel-pausado', '');
    }

    retomar() {
        this._pausado = false;
        this._container.removeAttribute('data-carrossel-pausado');
    }

    destruir() {
        this._pararAutoplay();
        this._removerEventos();
    }

    // ─── Eventos ──────────────────────────────────────────────────────────────

    _vincularEventos() {
        // Botões de navegação
        if (this._btnAnterior) {
            this._btnAnterior.addEventListener('click', () => {
                this.anterior();
                this._reiniciarAutoplay();
            });
        }

        if (this._btnProximo) {
            this._btnProximo.addEventListener('click', () => {
                this.proximo();
                this._reiniciarAutoplay();
            });
        }

        // Pausar no hover
        if (this._opcoes.pausarNoHover) {
            this._container.addEventListener('mouseenter', () => this.pausar());
            this._container.addEventListener('mouseleave', () => this.retomar());
            this._container.addEventListener('focusin', () => this.pausar());
            this._container.addEventListener('focusout', () => this.retomar());
        }

        // Teclado
        this._container.addEventListener('keydown', this._aoApertarTecla.bind(this));

        // Touch / Swipe
        this._container.addEventListener('touchstart', this._aoTocarInicio.bind(this), { passive: true });
        this._container.addEventListener('touchend', this._aoTocarFim.bind(this), { passive: true });

        // Visibilidade da página (para pausar em aba oculta)
        this._aoMudarVisibilidade = () => {
            if (document.hidden) {
                if (!this._pausado) {
                    this._pausadoPorVisibilidade = true;
                    this.pausar();
                }
                return;
            }

            if (this._pausadoPorVisibilidade) {
                this._pausadoPorVisibilidade = false;
                this.retomar();
                this._reiniciarAutoplay();
            }
        };
        document.addEventListener('visibilitychange', this._aoMudarVisibilidade);
    }

    _removerEventos() {
        document.removeEventListener('visibilitychange', this._aoMudarVisibilidade);
    }

    _aoApertarTecla(evento) {
        switch (evento.key) {
            case 'ArrowLeft':
                evento.preventDefault();
                this.anterior();
                this._reiniciarAutoplay();
                break;
            case 'ArrowRight':
                evento.preventDefault();
                this.proximo();
                this._reiniciarAutoplay();
                break;
            case 'Home':
                evento.preventDefault();
                this._irParaSlide(0);
                this._reiniciarAutoplay();
                break;
            case 'End':
                evento.preventDefault();
                this._irParaSlide(this._totalSlides - 1);
                this._reiniciarAutoplay();
                break;
        }
    }

    _aoTocarInicio(evento) {
        const toque = evento.changedTouches[0];
        this._toqueInicioX = toque.clientX;
        this._toqueInicioY = toque.clientY;
    }

    _aoTocarFim(evento) {
        const toque = evento.changedTouches[0];
        const deltaX = toque.clientX - this._toqueInicioX;
        const deltaY = toque.clientY - this._toqueInicioY;
        const LIMIAR_SWIPE = 50;

        // Ignora se o movimento foi mais vertical que horizontal
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;

        if (Math.abs(deltaX) < LIMIAR_SWIPE) return;

        if (deltaX < 0) {
            this.proximo();
        } else {
            this.anterior();
        }
        this._reiniciarAutoplay();
    }

    _reiniciarAutoplay() {
        if (this._opcoes.autoplay) {
            this._pararAutoplay();
            this._iniciarAutoplay();
        }
    }

    // ─── Utilidades ───────────────────────────────────────────────────────────

    _prefereReducaoMovimento() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /** Retorna o índice do slide atualmente ativo */
    get indiceAtual() {
        return this._indiceAtual;
    }

    /** Retorna o total de slides */
    get total() {
        return this._totalSlides;
    }
}

// ─── Funções auxiliares ───────────────────────────────────────────────────────

/**
 * Obtém a duração da transição CSS de um elemento (em ms).
 * @param {HTMLElement} elemento
 * @returns {number}
 */
function obterDuracaoTransicaoSlide(elemento) {
    if (!elemento) return 600;
    const estilo = getComputedStyle(elemento);
    const duracao = parseFloat(estilo.transitionDuration) * 1000;
    return isNaN(duracao) ? 600 : duracao;
}

// ─── Inicialização na página ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Carrossel da Hero (instância global para acesso externo se necessário)
    window.carrosselHero = new CarrosselHero('#carrossel-hero', {
        intervalo: 5500,
        autoplay: true,
        pausarNoHover: true,
        loop: true,
        direcao: 'fade',
        aoMudar: (anterior, atual) => {
            // Exemplo de callback: pode ser usado para analytics ou outros hooks
            // console.log(`Hero: slide ${anterior} → ${atual}`);
        },
    });
});

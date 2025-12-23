document.addEventListener('DOMContentLoaded', () => {
    // === MENU MOBILE DRAWER CONTROL ===
    const menuToggle = document.querySelector('.menu-toggle');
    const navPrincipal = document.querySelector('.nav-principal');
    const fecharMenu = document.querySelector('.fechar-menu');
    const linksMobile = document.querySelectorAll('.nav-principal .link-nav'); // Seleciona links dentro do nav

    function abrirMenu() {
        navPrincipal.classList.add('ativo');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // Previne scroll no fundo
    }

    function fecharMenuFunc() {
        navPrincipal.classList.remove('ativo');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; // Libera scroll
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', abrirMenu);
    }

    if (fecharMenu) {
        fecharMenu.addEventListener('click', fecharMenuFunc);
    }

    // Fechar ao clicar em qualquer link do menu
    linksMobile.forEach(link => {
        link.addEventListener('click', fecharMenuFunc);
    });

    // Fechar ao clicar fora do menu (overlay click) - Opcional, mas boa UX
    document.addEventListener('click', (e) => {
        if (navPrincipal.classList.contains('ativo') &&
            !navPrincipal.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            fecharMenuFunc();
        }
    });

    // === RASTREIO MOCK ===
    const formsRastreio = document.querySelectorAll('form');
    formsRastreio.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            const codigo = input.value.trim();

            if (!codigo) {
                alert("Por favor, digite um código de rastreio.");
                return;
            }

            // Exemplo de feedback visual simples
            const btn = form.querySelector('button');
            const textoOriginal = btn.innerHTML;

            btn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Buscando...`;
            btn.disabled = true;

            setTimeout(() => {
                alert(`Rastreando objeto: ${codigo}\n(Funcionalidade de exemplo - Backend necessário)`);
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
                input.value = '';
            }, 1500);
        });
    });

    // === SMOOTH SCROLL (Polyfill simples para garantir) ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href.startsWith('#')) return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // === MAPA INTERATIVO REMOVIDO (Mavido para src/script/mapa.js) ===

});

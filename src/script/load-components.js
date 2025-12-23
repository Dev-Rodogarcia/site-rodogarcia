// Script para carregar componentes reutilizáveis (header e footer)
document.addEventListener('DOMContentLoaded', function() {
    // Carregar Header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        fetch('components/header.html')
            .then(response => response.text())
            .then(data => {
                headerContainer.innerHTML = data;
                // Reinicializar scripts do menu após carregar
                initMenuMobile();
            })
            .catch(error => console.error('Erro ao carregar header:', error));
    }

    // Carregar Footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('components/footer.html')
            .then(response => response.text())
            .then(data => {
                footerContainer.innerHTML = data;
            })
            .catch(error => console.error('Erro ao carregar footer:', error));
    }
});

// Função para inicializar menu mobile (movida do main.js)
function initMenuMobile() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navPrincipal = document.querySelector('.nav-principal');
    const fecharMenu = document.querySelector('.fechar-menu');
    const body = document.body;

    if (menuToggle && navPrincipal) {
        menuToggle.addEventListener('click', function() {
            navPrincipal.classList.add('ativo');
            body.classList.add('menu-aberto');
            menuToggle.setAttribute('aria-expanded', 'true');
        });

        if (fecharMenu) {
            fecharMenu.addEventListener('click', function() {
                navPrincipal.classList.remove('ativo');
                body.classList.remove('menu-aberto');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        }

        // Fechar ao clicar no overlay
        document.addEventListener('click', function(e) {
            if (body.classList.contains('menu-aberto') && 
                !navPrincipal.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                navPrincipal.classList.remove('ativo');
                body.classList.remove('menu-aberto');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}


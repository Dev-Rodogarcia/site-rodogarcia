document.addEventListener('DOMContentLoaded', () => {
    // === MENU MOBILE DRAWER CONTROL ===
    const menuToggle = document.querySelector('.menu-toggle');
    const navPrincipal = document.querySelector('.nav-principal');
    const fecharMenu = document.querySelector('.fechar-menu');
    const linksMobile = document.querySelectorAll('.nav-principal .link-nav'); // Seleciona links dentro do nav

    function abrirMenu() {
        navPrincipal.classList.add('ativo');
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-aberto');
        document.body.style.overflow = 'hidden'; // Previne scroll no fundo
    }

    function fecharMenuFunc() {
        navPrincipal.classList.remove('ativo');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-aberto');
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
        if (navPrincipal && navPrincipal.classList.contains('ativo') &&
            !navPrincipal.contains(e.target) &&
            menuToggle && !menuToggle.contains(e.target)) {
            fecharMenuFunc();
        }
    });

    // Fechar ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navPrincipal && navPrincipal.classList.contains('ativo')) {
            fecharMenuFunc();
        }
    });

    // === RASTREIO - Redireciona para site externo ===
    const formsRastreio = document.querySelectorAll('.form-rastreio-row');
    formsRastreio.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Redireciona para o site de rastreamento da Rodogarcia
            window.open('https://rodogarcia.eslcloud.com.br/recipient_tracking', '_blank');
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

    // === FORMULÁRIO DE COTAÇÃO ===
    const formCotacao = document.getElementById('formCotacao');
    
    if (formCotacao) {
        formCotacao.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validação básica
            const remetenteNome = document.getElementById('remetente-nome').value.trim();
            const remetenteEmail = document.getElementById('remetente-email').value.trim();
            const peso = document.getElementById('peso').value;
            const volume = document.getElementById('volume').value;
            
            if (!remetenteNome || !remetenteEmail || !peso || !volume) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Feedback visual
            const btnSubmit = formCotacao.querySelector('.botao-submit-cotacao');
            const textoOriginal = btnSubmit.innerHTML;
            
            btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Enviando...';
            btnSubmit.disabled = true;
            
            // Simulação de envio
            setTimeout(() => {
                alert('Cotação solicitada com sucesso! Entraremos em contato em até 24 horas.');
                formCotacao.reset();
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }, 1500);
        });
        
        // Máscaras de entrada
        const cpfCnpjInputs = document.querySelectorAll('input[id*="cpf-cnpj"]');
        cpfCnpjInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                } else {
                    value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                }
                e.target.value = value;
            });
        });
        
        // Máscara de CEP
        const cepInput = document.getElementById('destinatario-cep');
        if (cepInput) {
            cepInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 8) {
                    value = value.replace(/(\d{5})(\d{0,3})/, '$1-$2');
                }
                e.target.value = value;
            });
        }
        
        // Máscara de telefone
        const telefoneInputs = document.querySelectorAll('input[type="tel"]');
        telefoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    if (value.length <= 10) {
                        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                    } else {
                        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                    }
                    e.target.value = value;
                }
            });
        });
        
        // Máscara de valor monetário
        const valorInput = document.getElementById('valor-nota');
        if (valorInput) {
            valorInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = (parseInt(value) / 100).toFixed(2) + '';
                value = value.replace('.', ',');
                value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                e.target.value = value;
            });
        }
    }

    // === FORMULÁRIO DE CANDIDATURA - TRABALHE CONOSCO ===
    const formCandidatura = document.getElementById('formCandidatura');
    
    if (formCandidatura) {
        formCandidatura.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validação básica
            const nome = document.getElementById('nome').value.trim();
            const email = document.getElementById('email').value.trim();
            const telefone = document.getElementById('telefone').value.trim();
            const vaga = document.getElementById('vaga').value;
            const curriculo = document.getElementById('curriculo').files[0];
            const termos = formCandidatura.querySelector('input[name="termos"]').checked;
            
            if (!nome || !email || !telefone || !vaga || !curriculo || !termos) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Validação de tamanho do arquivo (5MB)
            if (curriculo.size > 5 * 1024 * 1024) {
                alert('O arquivo do currículo deve ter no máximo 5MB.');
                return;
            }
            
            // Feedback visual
            const btnSubmit = formCandidatura.querySelector('.botao-submit');
            const textoOriginal = btnSubmit.innerHTML;
            
            btnSubmit.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Enviando...';
            btnSubmit.disabled = true;
            
            // Simulação de envio (aqui você pode adicionar a lógica de envio real)
            setTimeout(() => {
                alert('Candidatura enviada com sucesso! Entraremos em contato em breve.');
                formCandidatura.reset();
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }, 1500);
        });
        
        // Máscara de telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    if (value.length <= 10) {
                        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                    } else {
                        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                    }
                    e.target.value = value;
                }
            });
        }
    }
    
    // Scroll suave para o formulário quando clicar em "Candidatar-se"
    document.querySelectorAll('a[href="#formulario"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const formulario = document.getElementById('formulario');
            if (formulario) {
                formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Preencher o campo de vaga automaticamente se houver data-vaga
                const vagaId = link.getAttribute('data-vaga');
                if (vagaId) {
                    const selectVaga = document.getElementById('vaga');
                    if (selectVaga) {
                        selectVaga.value = vagaId;
                    }
                }
            }
        });
    });

    // === FORMULÁRIO DE COTAÇÃO ===
    const formCotacao = document.getElementById('formCotacao');
    if (formCotacao) {
        formCotacao.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Coletar dados do formulário
            const formData = new FormData(formCotacao);
            const dados = {
                nome: formData.get('nome'),
                email: formData.get('email'),
                telefone: formData.get('telefone'),
                empresa: formData.get('empresa') || 'Não informado',
                origem: formData.get('origem'),
                destino: formData.get('destino'),
                tipoCarga: formData.get('tipo-carga'),
                peso: formData.get('peso'),
                comprimento: formData.get('comprimento') || 'Não informado',
                largura: formData.get('largura') || 'Não informado',
                altura: formData.get('altura') || 'Não informado',
                quantidade: formData.get('quantidade') || 'Não informado',
                observacoes: formData.get('observacoes') || 'Nenhuma observação'
            };

            // Determinar número do WhatsApp baseado no tipo de carga
            let numeroWhatsApp = '5514999999999'; // Número padrão
            if (dados.tipoCarga === 'fracionada') {
                numeroWhatsApp = '5514999999999'; // Número para fracionada
            } else if (dados.tipoCarga === 'fechada') {
                numeroWhatsApp = '5514999999999'; // Número para fechada
            }

            // Formatar mensagem para WhatsApp
            const mensagem = `*Nova Solicitação de Cotação*\n\n` +
                `*Dados Pessoais:*\n` +
                `Nome: ${dados.nome}\n` +
                `E-mail: ${dados.email}\n` +
                `Telefone: ${dados.telefone}\n` +
                `Empresa: ${dados.empresa}\n\n` +
                `*Origem e Destino:*\n` +
                `Origem: ${dados.origem}\n` +
                `Destino: ${dados.destino}\n` +
                `Tipo de Carga: ${dados.tipoCarga === 'fracionada' ? 'Carga Fracionada' : 'Carga Fechada'}\n\n` +
                `*Dimensões e Peso:*\n` +
                `Peso: ${dados.peso} kg\n` +
                `Comprimento: ${dados.comprimento} cm\n` +
                `Largura: ${dados.largura} cm\n` +
                `Altura: ${dados.altura} cm\n` +
                `Quantidade de Volumes: ${dados.quantidade}\n\n` +
                `*Observações:*\n${dados.observacoes}`;

            // Codificar mensagem para URL
            const mensagemEncoded = encodeURIComponent(mensagem);
            
            // Abrir WhatsApp
            const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemEncoded}`;
            window.open(urlWhatsApp, '_blank');
        });

        // Máscara de telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    if (value.length <= 10) {
                        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                    } else {
                        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                    }
                    e.target.value = value;
                }
            });
        }
    }

});

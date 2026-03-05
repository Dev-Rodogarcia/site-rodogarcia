/* ==[DOC-FILE]===============================================================
Arquivo : src/js/public-content.js
Modulo  : Frontend - scripts publicos
Papel   : Hidrata conteudo dinamico do site publico (Home, Servicos, Sobre e Contato) a partir da API.

Responsabilidades:
- Renderizar Hero, DNA e vagas da Home com dados do backend.
- Renderizar feedbacks da pagina Servicos sem alterar a estrutura visual fixa.
- Aplicar textos editaveis de Sobre e Contato em elementos mapeados por `data-*`.

Integracoes:
- Dependencias: /src/js/shared/utils/sanitize.js, /src/js/shared/utils/dom.js
- Endpoints/rotas: /api/public/content
- Classes/seletores/chaves: #carrossel-hero, #carrossel-dna, .grid-vagas, [data-feedback-track], [data-about-*], [data-contact-*]

Entradas e saidas:
- Entradas: payload JSON da API publica e DOM existente em cada pagina.
- Saidas  : mutacao de DOM para refletir o conteudo salvo no CMS.

Elementos tecnicos: montarSlideHero, montarSlideDna, renderizarFeedbacks, aplicarConteudoSobre, aplicarConteudoContato
[DOC-FILE-END]============================================================== */

import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { limparElemento, criarElemento } from '/src/js/shared/utils/dom.js';

function normalizarLayoutHero(valor) {
  return String(valor || '').trim().toLowerCase() === 'full-image'
    ? 'full-image'
    : 'text-image';
}

function normalizarLayoutDna(valor) {
  return String(valor || '').trim().toLowerCase() === 'full-image'
    ? 'full-image'
    : 'text-image';
}

function normalizarFundoHero(valor) {
  return String(valor || '').trim().toLowerCase() === 'straight'
    ? 'straight'
    : 'wavy';
}

function normalizarVarianteBotao(valor) {
  return String(valor || '').trim().toLowerCase() === 'outline'
    ? 'outline'
    : 'solid';
}

function sanitizarCorHex(valor) {
  const texto = String(valor || '').trim();
  const match = texto.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return '';

  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  return `#${hex}`.toUpperCase();
}

function corContraste(hexColor) {
  const cor = sanitizarCorHex(hexColor);
  if (!cor) return '#1E293B';
  const semHash = cor.slice(1);
  const r = Number.parseInt(semHash.slice(0, 2), 16);
  const g = Number.parseInt(semHash.slice(2, 4), 16);
  const b = Number.parseInt(semHash.slice(4, 6), 16);
  const brilho = (r * 299 + g * 587 + b * 114) / 1000;
  return brilho >= 148 ? '#0F172A' : '#FFFFFF';
}

function criarBotaoLink(rotulo, url, classeCss, opcoes = {}) {
  const link = criarElemento('a', classeCss, sanitizarTexto(rotulo, 40));
  const hrefSeguro = sanitizarUrl(url);
  link.href = hrefSeguro || '#';

  if (hrefSeguro.startsWith('http')) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  const variant = normalizarVarianteBotao(opcoes.variant || '');
  const color = sanitizarCorHex(opcoes.color || '');

  if (color) {
    if (variant === 'outline') {
      link.style.borderColor = color;
      link.style.color = color;
      link.style.backgroundColor = 'rgba(15, 23, 42, 0.12)';
    } else {
      link.style.backgroundColor = color;
      link.style.borderColor = color;
      link.style.color = corContraste(color);
    }
  }

  return link;
}

function montarSlideHero(slide, indice) {
  const layoutMode = normalizarLayoutHero(slide.layoutMode);
  if (layoutMode === 'full-image') {
    return montarSlideHeroImagemCompleta(slide, indice);
  }

  const wrapper = criarElemento('div', 'carrossel-hero__slide');
  wrapper.dataset.carrosselSlide = '';
  wrapper.setAttribute('aria-hidden', indice === 0 ? 'false' : 'true');
  wrapper.dataset.heroLayoutMode = 'text-image';
  wrapper.dataset.heroBackgroundType = 'wavy';

  const container = criarElemento('div', 'container hero__container');
  const areaTexto = criarElemento('div', 'hero__texto');
  const tagTitulo = indice === 0 ? 'h1' : 'h2';
  const titulo = criarElemento(tagTitulo, 'titulo-hero', sanitizarTexto(slide.title, 120));
  const descricao = criarElemento('p', 'subtitulo-hero', sanitizarTexto(slide.description, 420));
  areaTexto.append(titulo, descricao);

  const botoesAtivos = Array.isArray(slide.buttons) ? slide.buttons.filter((btn) => btn.enabled) : [];
  if (botoesAtivos.length > 0) {
    const cardAcao = criarElemento('div', 'card-acao-hero');
    const caixaBotoes = criarElemento('div', 'botoes-acao');

    botoesAtivos.slice(0, 2).forEach((botao, idx) => {
      const classe = idx === 0
        ? 'botao botao--zafir botao--largo'
        : 'botao botao--outline-zafir botao--largo';
      caixaBotoes.appendChild(criarBotaoLink(botao.label, botao.url, classe));
    });

    cardAcao.appendChild(caixaBotoes);
    areaTexto.appendChild(cardAcao);
  }

  const areaImagem = criarElemento('div', 'hero__imagem');
  const imagem = criarElemento('img', 'img-hero-destaque');
  imagem.src = sanitizarUrl(slide.image) || '/public/foto5.png';
  imagem.alt = sanitizarTexto(slide.title, 120) || 'Destaque Rodogarcia';
  imagem.loading = indice === 0 ? 'eager' : 'lazy';
  imagem.decoding = 'async';
  imagem.width = 2048;
  imagem.height = 882;

  if (indice === 0) {
    imagem.setAttribute('fetchpriority', 'high');
  }

  areaImagem.appendChild(imagem);
  container.append(areaTexto, areaImagem);
  wrapper.appendChild(container);
  return wrapper;
}

function montarSlideHeroImagemCompleta(slide, indice) {
  const wrapper = criarElemento('div', 'carrossel-hero__slide carrossel-hero__slide--full');
  wrapper.dataset.carrosselSlide = '';
  wrapper.setAttribute('aria-hidden', indice === 0 ? 'false' : 'true');
  wrapper.dataset.heroLayoutMode = 'full-image';

  const backgroundType = normalizarFundoHero(slide.fullImageBackgroundType);
  wrapper.dataset.heroBackgroundType = backgroundType;

  const fullHero = criarElemento('div', `hero-full-image hero-full-image--${backgroundType}`);
  const imagem = criarElemento('img', 'hero-full-image__media');
  imagem.src = sanitizarUrl(slide.image) || '/public/foto5.png';
  imagem.alt = sanitizarTexto(slide.title, 120) || 'Banner Rodogarcia';
  imagem.loading = indice === 0 ? 'eager' : 'lazy';
  imagem.decoding = 'async';
  imagem.width = 2048;
  imagem.height = 882;
  if (indice === 0) {
    imagem.setAttribute('fetchpriority', 'high');
  }
  fullHero.appendChild(imagem);

  const botoesAtivos = Array.isArray(slide.buttons) ? slide.buttons.filter((btn) => btn.enabled) : [];
  const exibirBotoes = Boolean(slide.fullImageButtonsEnabled) && botoesAtivos.length > 0;

  if (exibirBotoes) {
    const overlay = criarElemento('div', 'hero-full-image__overlay');
    const acoes = criarElemento('div', 'hero-full-image__actions');

    botoesAtivos.slice(0, 2).forEach((botao, idx) => {
      const variant = normalizarVarianteBotao(botao.variant || (idx === 1 ? 'outline' : 'solid'));
      const classeBase =
        variant === 'outline'
          ? 'botao botao--outline-zafir botao--largo hero-full-image__btn hero-full-image__btn--outline'
          : 'botao botao--zafir botao--largo hero-full-image__btn';

      const color = idx === 0 ? sanitizarCorHex(botao.color) : '';
      const btn = criarBotaoLink(botao.label, botao.url, classeBase, {
        color,
        variant
      });
      acoes.appendChild(btn);
    });

    overlay.appendChild(acoes);
    fullHero.appendChild(overlay);
  }

  wrapper.appendChild(fullHero);
  return wrapper;
}

function montarSlideDna(slide, indice) {
  const layoutMode = normalizarLayoutDna(slide.layoutMode);
  if (layoutMode === 'full-image') {
    return montarSlideDnaImagemCompleta(slide, indice);
  }

  const artigo = criarElemento('article', `carrossel-dna__slide${indice === 0 ? ' carrossel-dna__slide--ativo' : ''}`);
  artigo.dataset.dnaSlide = '';
  artigo.dataset.dnaLayoutMode = 'text-image';
  artigo.setAttribute('aria-hidden', indice === 0 ? 'false' : 'true');

  const grid = criarElemento('div', 'grid-dna');
  const info = criarElemento('div', 'dna-info');
  const tag = criarElemento('span', 'tag-dna', 'DNA Tecnologico');
  const titulo = criarElemento('h2', 'titulo-branco', sanitizarTexto(slide.title, 120));
  const texto = criarElemento('p', 'subtitulo-secao', sanitizarTexto(slide.text, 420));
  texto.style.color = '#e2e8f0';
  info.append(tag, titulo, texto);

  const boxImagem = criarElemento('div', 'dna-img');
  const innerImagem = criarElemento('div');
  const imagem = criarElemento('img', 'img-dna');
  imagem.src = sanitizarUrl(slide.image) || '/public/foto4.png';
  imagem.alt = sanitizarTexto(slide.title, 120) || 'Destaque DNA Rodogarcia';
  imagem.loading = 'lazy';
  imagem.decoding = 'async';
  imagem.width = 2048;
  imagem.height = 882;
  innerImagem.appendChild(imagem);
  boxImagem.appendChild(innerImagem);

  grid.append(info, boxImagem);
  artigo.appendChild(grid);
  return artigo;
}

function montarSlideDnaImagemCompleta(slide, indice) {
  const artigo = criarElemento(
    'article',
    `carrossel-dna__slide carrossel-dna__slide--full${indice === 0 ? ' carrossel-dna__slide--ativo' : ''}`
  );
  artigo.dataset.dnaSlide = '';
  artigo.dataset.dnaLayoutMode = 'full-image';
  artigo.setAttribute('aria-hidden', indice === 0 ? 'false' : 'true');

  const wrapper = criarElemento('div', 'dna-full-image');
  const imagem = criarElemento('img', 'dna-full-image__media');
  imagem.src = sanitizarUrl(slide.image) || '/public/foto4.png';
  imagem.alt = sanitizarTexto(slide.title, 120) || 'Destaque DNA Rodogarcia';
  imagem.loading = 'lazy';
  imagem.decoding = 'async';
  imagem.width = 2048;
  imagem.height = 882;

  wrapper.appendChild(imagem);
  artigo.appendChild(wrapper);
  return artigo;
}

function iniciarCarrosselBasico(opcoes) {
  const {
    raiz,
    seletorSlide,
    classeAtiva,
    seletorAnterior,
    seletorProximo,
    intervaloMs = 5500,
    onChange = null
  } = opcoes;

  if (!raiz) return;

  const slides = Array.from(raiz.querySelectorAll(seletorSlide));
  if (slides.length <= 1) return;

  const botaoAnterior = raiz.querySelector(seletorAnterior);
  const botaoProximo = raiz.querySelector(seletorProximo);
  let indiceAtual = 0;
  let timer = null;

  const atualizar = (novoIndice) => {
    indiceAtual = (novoIndice + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      const ativo = idx === indiceAtual;
      slide.classList.toggle(classeAtiva, ativo);
      slide.setAttribute('aria-hidden', ativo ? 'false' : 'true');
    });
    if (typeof onChange === 'function') {
      onChange({
        index: indiceAtual,
        slide: slides[indiceAtual],
        slides
      });
    }
  };

  const pausar = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const retomar = () => {
    pausar();
    timer = window.setInterval(() => {
      atualizar(indiceAtual + 1);
    }, intervaloMs);
  };

  if (botaoAnterior) {
    botaoAnterior.addEventListener('click', () => {
      atualizar(indiceAtual - 1);
      retomar();
    });
  }

  if (botaoProximo) {
    botaoProximo.addEventListener('click', () => {
      atualizar(indiceAtual + 1);
      retomar();
    });
  }

  raiz.addEventListener('mouseenter', pausar);
  raiz.addEventListener('mouseleave', retomar);
  raiz.addEventListener('focusin', pausar);
  raiz.addEventListener('focusout', retomar);

  atualizar(0);
  retomar();
}

function sincronizarModoVisualHero(slideAtivo) {
  const secaoHero = document.getElementById('inicio');
  if (!secaoHero || !slideAtivo) return;

  const layout = normalizarLayoutHero(slideAtivo.dataset.heroLayoutMode);
  const background = normalizarFundoHero(slideAtivo.dataset.heroBackgroundType);
  const fullMode = layout === 'full-image';
  const straightMode = fullMode && background === 'straight';

  secaoHero.classList.toggle('hero--full-image-active', fullMode);
  secaoHero.classList.toggle('hero--straight-active', straightMode);
}

function renderizarSlidesHero(slidesHero) {
  const container = document.getElementById('carrossel-hero');
  if (!container || !Array.isArray(slidesHero) || slidesHero.length === 0) return;

  limparElemento(container);
  slidesHero.forEach((slide, idx) => {
    container.appendChild(montarSlideHero(slide, idx));
  });

  const controles = criarElemento('div', 'carrossel-hero__controles');
  controles.setAttribute('aria-label', 'Controles do carrossel');

  const anterior = criarElemento('button', 'carrossel-hero__btn');
  anterior.type = 'button';
  anterior.dataset.carrosselAnterior = '';
  anterior.setAttribute('aria-label', 'Slide anterior');
  anterior.textContent = '<';

  const proximo = criarElemento('button', 'carrossel-hero__btn');
  proximo.type = 'button';
  proximo.dataset.carrosselProximo = '';
  proximo.setAttribute('aria-label', 'Proximo slide');
  proximo.textContent = '>';

  controles.append(anterior, proximo);
  container.appendChild(controles);

  const primeiroSlide = container.querySelector('[data-carrossel-slide]');
  if (primeiroSlide) {
    sincronizarModoVisualHero(primeiroSlide);
  }

  iniciarCarrosselBasico({
    raiz: container,
    seletorSlide: '[data-carrossel-slide]',
    classeAtiva: 'carrossel-hero__slide--ativo',
    seletorAnterior: '[data-carrossel-anterior]',
    seletorProximo: '[data-carrossel-proximo]',
    intervaloMs: 5500,
    onChange: ({ slide }) => {
      sincronizarModoVisualHero(slide);
    }
  });
}

function renderizarSlidesDna(slidesDna) {
  const container = document.getElementById('carrossel-dna');
  if (!container || !Array.isArray(slidesDna) || slidesDna.length === 0) {
    if (container) {
      container.classList.remove('is-hydrating');
      container.classList.add('is-hydrated');
    }
    return;
  }

  limparElemento(container);

  const wrapperSlides = criarElemento('div', 'carrossel-dna__slides');
  slidesDna.forEach((slide, idx) => {
    wrapperSlides.appendChild(montarSlideDna(slide, idx));
  });

  const controles = criarElemento('div', 'carrossel-dna__controles');
  controles.setAttribute('aria-label', 'Controles do carrossel de destaques');

  const anterior = criarElemento('button', 'carrossel-dna__btn');
  anterior.type = 'button';
  anterior.dataset.dnaAnterior = '';
  anterior.setAttribute('aria-label', 'Destaque anterior');
  anterior.textContent = '<';

  const proximo = criarElemento('button', 'carrossel-dna__btn');
  proximo.type = 'button';
  proximo.dataset.dnaProximo = '';
  proximo.setAttribute('aria-label', 'Proximo destaque');
  proximo.textContent = '>';

  controles.append(anterior, proximo);
  container.append(wrapperSlides, controles);

  iniciarCarrosselBasico({
    raiz: container,
    seletorSlide: '[data-dna-slide]',
    classeAtiva: 'carrossel-dna__slide--ativo',
    seletorAnterior: '[data-dna-anterior]',
    seletorProximo: '[data-dna-proximo]',
    intervaloMs: 5000
  });

  container.classList.remove('is-hydrating');
  container.classList.add('is-hydrated');
}

function classeBadgeVaga(status) {
  const valor = sanitizarTexto(status, 20).toLowerCase();
  if (valor === 'novo') return 'badge-vaga badge-nova';
  if (valor === 'encerrado') return 'badge-vaga';
  return 'badge-vaga';
}

function montarCardVaga(vaga) {
  const card = criarElemento('div', 'card-vaga');
  const cabecalho = criarElemento('div', 'vaga-header');
  const titulo = criarElemento('h4', '', sanitizarTexto(vaga.title, 120));
  const badge = criarElemento('span', classeBadgeVaga(vaga.status), sanitizarTexto(vaga.status, 20));
  cabecalho.append(titulo, badge);

  const info = criarElemento('div', 'vaga-info');
  info.append(
    criarElemento('span', '', `Local: ${sanitizarTexto(vaga.location, 120)}`),
    criarElemento('span', '', `Trabalho: ${sanitizarTexto(vaga.workType, 30)}`),
    criarElemento('span', '', `Contrato: ${sanitizarTexto(vaga.contractType, 30)}`)
  );

  const descricao = criarElemento('p', 'vaga-descricao', sanitizarTexto(vaga.description, 600));
  const botao = criarBotaoLink('Candidatar-se', vaga.applyUrl, 'botao botao--secundario botao-vaga');
  card.append(cabecalho, info, descricao, botao);
  return card;
}

function renderizarVagasDestaque(vagas) {
  const grid = document.querySelector('.grid-vagas');
  if (!grid || !Array.isArray(vagas) || vagas.length === 0) return;

  limparElemento(grid);
  vagas.forEach((vaga) => {
    grid.appendChild(montarCardVaga(vaga));
  });
}

function extrairIniciais(nome) {
  const texto = sanitizarTexto(nome, 80);
  if (!texto) return 'CL';
  return texto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

function montarCardFeedback(feedback) {
  const card = criarElemento('div', 'card-depoimento');

  const avaliacao = criarElemento('div', 'depoimento-avaliacao');
  for (let i = 0; i < 5; i += 1) {
    const estrela = criarElemento('i', 'ph ph-star-fill');
    avaliacao.appendChild(estrela);
  }

  const header = criarElemento('div', 'depoimento-header');
  const avatar = criarElemento('div', 'depoimento-avatar');
  const foto = sanitizarUrl(feedback.photo);

  if (foto) {
    const img = criarElemento('img');
    img.src = foto;
    img.alt = sanitizarTexto(feedback.name, 80) || 'Cliente';
    img.loading = 'lazy';
    img.decoding = 'async';
    avatar.appendChild(img);
  } else {
    const iniciais = criarElemento('span', '', extrairIniciais(feedback.name));
    avatar.appendChild(iniciais);
  }

  const info = criarElemento('div', 'depoimento-info');
  const nome = criarElemento('h4', '', sanitizarTexto(feedback.name, 80));
  const cargoEmpresa = criarElemento(
    'p',
    '',
    `${sanitizarTexto(feedback.role, 80)} - ${sanitizarTexto(feedback.company, 120)}`
  );
  info.append(nome, cargoEmpresa);

  const texto = criarElemento('p', 'depoimento-texto', sanitizarTexto(feedback.comment, 800));

  header.append(avatar, info);
  card.append(avaliacao, header, texto);
  return card;
}

function renderizarFeedbacks(feedbacks) {
  const trilha = document.querySelector('[data-feedback-track]');
  if (!trilha || !Array.isArray(feedbacks) || feedbacks.length === 0) return;

  limparElemento(trilha);

  const base = [];
  const quantidadeBase = 6;
  for (let i = 0; i < quantidadeBase; i += 1) {
    base.push(feedbacks[i % feedbacks.length]);
  }

  [...base, ...base].forEach((feedback) => {
    trilha.appendChild(montarCardFeedback(feedback));
  });
}

function atualizarTextoSeletor(seletor, valor, tamanhoMaximo) {
  const elemento = document.querySelector(seletor);
  if (!elemento) return;

  const textoSeguro = sanitizarTexto(valor, tamanhoMaximo);
  if (!textoSeguro) return;
  elemento.textContent = textoSeguro;
}

function atualizarLinkSeletor(seletor, valorUrl) {
  const elemento = document.querySelector(seletor);
  if (!elemento) return;

  const urlSegura = sanitizarUrl(valorUrl);
  if (!urlSegura) return;

  elemento.href = urlSegura;
  if (urlSegura.startsWith('http')) {
    elemento.target = '_blank';
    elemento.rel = 'noopener noreferrer';
  }
}

function aplicarConteudoServicos(siteTexts) {
  if (!siteTexts || typeof siteTexts !== 'object') return;
  atualizarTextoSeletor('[data-services-feedback-title]', siteTexts.servicesFeedbackTitle, 140);
  atualizarTextoSeletor('[data-services-feedback-subtitle]', siteTexts.servicesFeedbackSubtitle, 220);
}

function aplicarConteudoSobre(siteTexts) {
  if (!siteTexts || typeof siteTexts !== 'object') return;

  atualizarTextoSeletor('[data-about-hero-tag]', siteTexts.aboutHeroTag, 60);
  atualizarTextoSeletor('[data-about-hero-title]', siteTexts.aboutHeroTitle, 140);
  atualizarTextoSeletor('[data-about-hero-subtitle]', siteTexts.aboutHeroSubtitle, 320);

  atualizarTextoSeletor('[data-about-stat1-number]', siteTexts.aboutStat1Number, 20);
  atualizarTextoSeletor('[data-about-stat1-description]', siteTexts.aboutStat1Description, 80);
  atualizarTextoSeletor('[data-about-stat2-number]', siteTexts.aboutStat2Number, 20);
  atualizarTextoSeletor('[data-about-stat2-description]', siteTexts.aboutStat2Description, 80);
  atualizarTextoSeletor('[data-about-stat3-number]', siteTexts.aboutStat3Number, 20);
  atualizarTextoSeletor('[data-about-stat3-description]', siteTexts.aboutStat3Description, 80);

  const imagem = document.querySelector('[data-about-hero-image]');
  if (imagem) {
    const urlImagem = sanitizarUrl(siteTexts.aboutHeroImage);
    if (urlImagem) {
      imagem.src = urlImagem;
    }
  }
}

function emailValido(email) {
  const texto = sanitizarTexto(email, 160).toLowerCase();
  if (!texto) return '';

  const regexBasico = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexBasico.test(texto) ? texto : '';
}

function aplicarConteudoContato(siteTexts) {
  if (!siteTexts || typeof siteTexts !== 'object') return;

  atualizarTextoSeletor('[data-contact-page-title]', siteTexts.contactPageTitle, 120);
  atualizarTextoSeletor('[data-contact-page-subtitle]', siteTexts.contactPageSubtitle, 280);
  atualizarTextoSeletor('[data-contact-phone-number]', siteTexts.contactPhoneNumber, 60);
  atualizarTextoSeletor('[data-contact-phone-hours]', siteTexts.contactPhoneHours, 120);
  atualizarTextoSeletor('[data-contact-email-address]', siteTexts.contactEmailAddress, 160);
  atualizarTextoSeletor('[data-contact-email-response]', siteTexts.contactEmailResponse, 120);
  atualizarTextoSeletor('[data-contact-whatsapp-label]', siteTexts.contactWhatsappLabel, 80);
  atualizarTextoSeletor('[data-contact-address-line]', siteTexts.contactAddressLine, 180);
  atualizarTextoSeletor('[data-contact-address-zip]', siteTexts.contactAddressZip, 20);
  atualizarTextoSeletor('[data-contact-address-country]', siteTexts.contactAddressCountry, 60);

  atualizarLinkSeletor('[data-contact-whatsapp-url]', siteTexts.contactWhatsappUrl);
  atualizarLinkSeletor('[data-contact-cta]', siteTexts.contactCtaUrl);
  atualizarTextoSeletor('[data-contact-cta]', siteTexts.contactCtaLabel, 40);

  const email = emailValido(siteTexts.contactEmailAddress);
  const linkEmail = document.querySelector('[data-contact-email-link]');
  if (linkEmail && email) {
    linkEmail.href = `mailto:${email}`;
  }
}

async function carregarConteudoPublico() {
  const resposta = await fetch('/api/public/content', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' }
  });

  if (!resposta.ok) {
    throw new Error('Falha ao carregar conteudo publico.');
  }

  return resposta.json();
}

async function iniciarConteudoPublico() {
  const dnaContainer = document.getElementById('carrossel-dna');
  if (dnaContainer) {
    dnaContainer.classList.add('is-hydrating');
    dnaContainer.classList.remove('is-hydrated');
  }

  try {
    const conteudo = await carregarConteudoPublico();
    renderizarSlidesHero(conteudo.heroSlides || []);
    renderizarSlidesDna(conteudo.dnaSlides || []);
    renderizarVagasDestaque(conteudo.featuredJobs || []);
    renderizarFeedbacks(conteudo.feedbacks || []);

    const siteTexts = conteudo.siteTexts || {};
    aplicarConteudoServicos(siteTexts);
    aplicarConteudoSobre(siteTexts);
    aplicarConteudoContato(siteTexts);
  } catch {
    // Mantem o HTML estatico em caso de falha.
    if (dnaContainer) {
      dnaContainer.classList.remove('is-hydrating');
      dnaContainer.classList.add('is-hydrated');
    }
  }
}

document.addEventListener('DOMContentLoaded', iniciarConteudoPublico);

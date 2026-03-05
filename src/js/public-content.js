/* ==[DOC-FILE]===============================================================
Arquivo : src/js/public-content.js
Modulo  : Frontend - scripts publicos
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: /src/js/shared/utils/sanitize.js, /src/js/shared/utils/dom.js
- Endpoints/rotas: /api/public/content
- Classes/seletores/chaves: .grid-vagas, #carrossel-hero, #carrossel-dna

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: criarBotaoLink, montarSlideHero, montarSlideDna, iniciarCarrosselBasico, renderizarSlidesHero, renderizarSlidesDna, classeBadgeVaga, montarCardVaga, renderizarVagasDestaque, carregarConteudoPublico
[DOC-FILE-END]============================================================== */

import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';
import { limparElemento, criarElemento } from '/src/js/shared/utils/dom.js';

function criarBotaoLink(rotulo, url, classeCss) {
  const link = criarElemento('a', classeCss, sanitizarTexto(rotulo, 40));
  const hrefSeguro = sanitizarUrl(url);
  link.href = hrefSeguro || '#';

  if (hrefSeguro.startsWith('http')) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  return link;
}

function montarSlideHero(slide, indice) {
  const wrapper = criarElemento('div', 'carrossel-hero__slide');
  wrapper.dataset.carrosselSlide = '';
  wrapper.setAttribute('aria-hidden', indice === 0 ? 'false' : 'true');

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

function montarSlideDna(slide, indice) {
  const artigo = criarElemento('article', `carrossel-dna__slide${indice === 0 ? ' carrossel-dna__slide--ativo' : ''}`);
  artigo.dataset.dnaSlide = '';
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

function iniciarCarrosselBasico(opcoes) {
  const {
    raiz,
    seletorSlide,
    classeAtiva,
    seletorAnterior,
    seletorProximo,
    intervaloMs = 5500
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

  iniciarCarrosselBasico({
    raiz: container,
    seletorSlide: '[data-carrossel-slide]',
    classeAtiva: 'carrossel-hero__slide--ativo',
    seletorAnterior: '[data-carrossel-anterior]',
    seletorProximo: '[data-carrossel-proximo]',
    intervaloMs: 5500
  });
}

function renderizarSlidesDna(slidesDna) {
  const container = document.getElementById('carrossel-dna');
  if (!container || !Array.isArray(slidesDna) || slidesDna.length === 0) return;

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
  try {
    const conteudo = await carregarConteudoPublico();
    renderizarSlidesHero(conteudo.heroSlides || []);
    renderizarSlidesDna(conteudo.dnaSlides || []);
    renderizarVagasDestaque(conteudo.featuredJobs || []);
  } catch {
    // Mantem o HTML estatico em caso de falha.
  }
}

document.addEventListener('DOMContentLoaded', iniciarConteudoPublico);



import { sanitizeText, sanitizeUrl } from '/assets/js/utils/sanitize.js';
import { clearElement, createElement } from '/assets/js/utils/dom.js';

function makeLinkButton(label, url, className) {
  const anchor = createElement('a', className, sanitizeText(label, 40));
  const safeHref = sanitizeUrl(url);
  anchor.href = safeHref || '#';

  if (safeHref.startsWith('http')) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }

  return anchor;
}

function buildHeroSlide(slide, index) {
  const wrapper = createElement('div', 'carrossel-hero__slide');
  wrapper.dataset.carrosselSlide = '';
  wrapper.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

  const container = createElement('div', 'container hero__container');

  const textArea = createElement('div', 'hero__texto');
  const titleTag = index === 0 ? 'h1' : 'h2';
  const title = createElement(titleTag, 'titulo-hero', sanitizeText(slide.title, 120));
  const description = createElement('p', 'subtitulo-hero', sanitizeText(slide.description, 420));

  textArea.append(title, description);

  const activeButtons = Array.isArray(slide.buttons) ? slide.buttons.filter((btn) => btn.enabled) : [];
  if (activeButtons.length > 0) {
    const cardAction = createElement('div', 'card-acao-hero');
    const buttonBox = createElement('div', 'botoes-acao');

    activeButtons.slice(0, 2).forEach((button, idx) => {
      const className = idx === 0
        ? 'botao botao--zafir botao--largo'
        : 'botao botao--outline-zafir botao--largo';
      buttonBox.appendChild(makeLinkButton(button.label, button.url, className));
    });

    cardAction.appendChild(buttonBox);
    textArea.appendChild(cardAction);
  }

  const imageArea = createElement('div', 'hero__imagem');
  const image = createElement('img', 'img-hero-destaque');
  image.src = sanitizeUrl(slide.image) || '/public/foto5.png';
  image.alt = sanitizeText(slide.title, 120) || 'Destaque Rodogarcia';
  image.loading = index === 0 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.width = 2048;
  image.height = 882;

  if (index === 0) {
    image.setAttribute('fetchpriority', 'high');
  }

  imageArea.appendChild(image);
  container.append(textArea, imageArea);
  wrapper.appendChild(container);

  return wrapper;
}

function buildDnaSlide(slide, index) {
  const article = createElement('article', `carrossel-dna__slide${index === 0 ? ' carrossel-dna__slide--ativo' : ''}`);
  article.dataset.dnaSlide = '';
  article.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

  const grid = createElement('div', 'grid-dna');
  const info = createElement('div', 'dna-info');
  const tag = createElement('span', 'tag-dna', 'DNA Tecnologico');
  const title = createElement('h2', 'titulo-branco', sanitizeText(slide.title, 120));
  const text = createElement('p', 'subtitulo-secao', sanitizeText(slide.text, 420));
  text.style.color = '#e2e8f0';

  info.append(tag, title, text);

  const imageWrapper = createElement('div', 'dna-img');
  const imageInner = createElement('div', '');
  const image = createElement('img', 'img-dna');
  image.src = sanitizeUrl(slide.image) || '/public/foto4.png';
  image.alt = sanitizeText(slide.title, 120) || 'Destaque DNA Rodogarcia';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.width = 2048;
  image.height = 882;

  imageInner.appendChild(image);
  imageWrapper.appendChild(imageInner);

  grid.append(info, imageWrapper);
  article.appendChild(grid);

  return article;
}

function setupBasicCarousel(options) {
  const {
    root,
    slideSelector,
    activeClass,
    prevSelector,
    nextSelector,
    intervalMs = 5500
  } = options;

  if (!root) return;

  const slides = Array.from(root.querySelectorAll(slideSelector));
  if (slides.length <= 1) return;

  const prevButton = root.querySelector(prevSelector);
  const nextButton = root.querySelector(nextSelector);

  let index = 0;
  let timer = null;

  const update = (newIndex) => {
    index = (newIndex + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
      const active = idx === index;
      slide.classList.toggle(activeClass, active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => {
      update(index + 1);
    }, intervalMs);
  };

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      update(index - 1);
      start();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      update(index + 1);
      start();
    });
  }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  update(0);
  start();
}

function renderHeroSlides(heroSlides) {
  const container = document.getElementById('carrossel-hero');
  if (!container || !Array.isArray(heroSlides) || heroSlides.length === 0) return;

  clearElement(container);

  heroSlides.forEach((slide, index) => {
    container.appendChild(buildHeroSlide(slide, index));
  });

  const controls = createElement('div', 'carrossel-hero__controles');
  controls.setAttribute('aria-label', 'Controles do carrossel');

  const prev = createElement('button', 'carrossel-hero__btn');
  prev.type = 'button';
  prev.dataset.carrosselAnterior = '';
  prev.setAttribute('aria-label', 'Slide anterior');
  prev.textContent = '<';

  const next = createElement('button', 'carrossel-hero__btn');
  next.type = 'button';
  next.dataset.carrosselProximo = '';
  next.setAttribute('aria-label', 'Proximo slide');
  next.textContent = '>';

  controls.append(prev, next);
  container.appendChild(controls);

  setupBasicCarousel({
    root: container,
    slideSelector: '[data-carrossel-slide]',
    activeClass: 'carrossel-hero__slide--ativo',
    prevSelector: '[data-carrossel-anterior]',
    nextSelector: '[data-carrossel-proximo]',
    intervalMs: 5500
  });
}

function renderDnaSlides(dnaSlides) {
  const container = document.getElementById('carrossel-dna');
  if (!container || !Array.isArray(dnaSlides) || dnaSlides.length === 0) return;

  clearElement(container);

  const slidesWrapper = createElement('div', 'carrossel-dna__slides');
  dnaSlides.forEach((slide, index) => {
    slidesWrapper.appendChild(buildDnaSlide(slide, index));
  });

  const controls = createElement('div', 'carrossel-dna__controles');
  controls.setAttribute('aria-label', 'Controles do carrossel de destaques');

  const prev = createElement('button', 'carrossel-dna__btn');
  prev.type = 'button';
  prev.dataset.dnaAnterior = '';
  prev.setAttribute('aria-label', 'Destaque anterior');
  prev.textContent = '<';

  const next = createElement('button', 'carrossel-dna__btn');
  next.type = 'button';
  next.dataset.dnaProximo = '';
  next.setAttribute('aria-label', 'Proximo destaque');
  next.textContent = '>';

  controls.append(prev, next);
  container.append(slidesWrapper, controls);

  setupBasicCarousel({
    root: container,
    slideSelector: '[data-dna-slide]',
    activeClass: 'carrossel-dna__slide--ativo',
    prevSelector: '[data-dna-anterior]',
    nextSelector: '[data-dna-proximo]',
    intervalMs: 5000
  });
}

function badgeClass(status) {
  const normalized = sanitizeText(status, 20).toLowerCase();
  if (normalized === 'novo') return 'badge-vaga badge-nova';
  if (normalized === 'encerrado') return 'badge-vaga';
  return 'badge-vaga';
}

function createVagaCard(vaga) {
  const card = createElement('div', 'card-vaga');

  const header = createElement('div', 'vaga-header');
  const title = createElement('h4', '', sanitizeText(vaga.title, 120));
  const badge = createElement('span', badgeClass(vaga.status), sanitizeText(vaga.status, 20));
  header.append(title, badge);

  const info = createElement('div', 'vaga-info');
  info.append(
    createElement('span', '', `Local: ${sanitizeText(vaga.location, 120)}`),
    createElement('span', '', `Trabalho: ${sanitizeText(vaga.workType, 30)}`),
    createElement('span', '', `Contrato: ${sanitizeText(vaga.contractType, 30)}`)
  );

  const description = createElement('p', 'vaga-descricao', sanitizeText(vaga.description, 600));
  const button = makeLinkButton('Candidatar-se', vaga.applyUrl, 'botao botao--secundario botao-vaga');

  card.append(header, info, description, button);
  return card;
}

function renderFeaturedJobs(jobs) {
  const grid = document.querySelector('.grid-vagas');
  if (!grid || !Array.isArray(jobs) || jobs.length === 0) return;

  clearElement(grid);
  jobs.forEach((job) => {
    grid.appendChild(createVagaCard(job));
  });
}

async function loadPublicContent() {
  const response = await fetch('/api/public/content', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar conteudo publico.');
  }

  return response.json();
}

async function initPublicContent() {
  try {
    const content = await loadPublicContent();
    renderHeroSlides(content.heroSlides || []);
    renderDnaSlides(content.dnaSlides || []);
    renderFeaturedJobs(content.featuredJobs || []);
  } catch {
    // Em caso de falha, mantem o HTML estatico atual.
  }
}

document.addEventListener('DOMContentLoaded', initPublicContent);

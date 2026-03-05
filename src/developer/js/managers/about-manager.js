/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/about-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Atualiza conteudos editaveis da pagina Sobre Nos (hero institucional e numeros em destaque).

Responsabilidades:
- Carregar textos atuais da API e preencher o formulario de edicao.
- Sanitizar os campos antes de persistir para evitar lixo de entrada.
- Salvar somente os campos da pagina Sobre sem impactar outras secoes.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js
- Endpoints/rotas: /api/developer/textos
- Classes/seletores/chaves: #sobre-hero-form, #aboutHeroTag, #aboutHeroTitle, #aboutHeroSubtitle, #aboutHeroImage

Entradas e saidas:
- Entradas: submit do formulario e payload existente da store de textos.
- Saidas  : PUT autenticado para persistencia e feedback visual no painel.

Elementos tecnicos: preencherFormularioSobre, lerFormularioSobre, iniciarGerenciadorSobre
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';

function preencherFormularioSobre(form, textos) {
  form.aboutHeroTag.value = textos.aboutHeroTag || '';
  form.aboutHeroTitle.value = textos.aboutHeroTitle || '';
  form.aboutHeroSubtitle.value = textos.aboutHeroSubtitle || '';
  form.aboutHeroImage.value = textos.aboutHeroImage || '';

  form.aboutStat1Number.value = textos.aboutStat1Number || '';
  form.aboutStat1Description.value = textos.aboutStat1Description || '';
  form.aboutStat2Number.value = textos.aboutStat2Number || '';
  form.aboutStat2Description.value = textos.aboutStat2Description || '';
  form.aboutStat3Number.value = textos.aboutStat3Number || '';
  form.aboutStat3Description.value = textos.aboutStat3Description || '';
}

function lerFormularioSobre(form) {
  return {
    aboutHeroTag: sanitizarTexto(form.aboutHeroTag.value, 60),
    aboutHeroTitle: sanitizarTexto(form.aboutHeroTitle.value, 140),
    aboutHeroSubtitle: sanitizarTexto(form.aboutHeroSubtitle.value, 320),
    aboutHeroImage: sanitizarUrl(form.aboutHeroImage.value),
    aboutStat1Number: sanitizarTexto(form.aboutStat1Number.value, 20),
    aboutStat1Description: sanitizarTexto(form.aboutStat1Description.value, 80),
    aboutStat2Number: sanitizarTexto(form.aboutStat2Number.value, 20),
    aboutStat2Description: sanitizarTexto(form.aboutStat2Description.value, 80),
    aboutStat3Number: sanitizarTexto(form.aboutStat3Number.value, 20),
    aboutStat3Description: sanitizarTexto(form.aboutStat3Description.value, 80)
  };
}

function vincularFormularioSobre(form, contexto) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botaoSubmit = form.querySelector('button[type="submit"]');
    if (botaoSubmit) botaoSubmit.disabled = true;

    try {
      await requisicaoApi('/api/developer/textos', {
        method: 'PUT',
        body: lerFormularioSobre(form)
      });
      contexto.flash('Conteudo de Sobre Nos atualizado.', 'success');
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha ao salvar Sobre Nos.', 'error');
    } finally {
      if (botaoSubmit) botaoSubmit.disabled = false;
    }
  });
}

export async function iniciarGerenciadorSobre(contexto) {
  const form = document.getElementById('sobre-hero-form');
  if (!form) return;

  try {
    const payload = await requisicaoApi('/api/developer/textos');
    preencherFormularioSobre(form, payload.texts || {});
    vincularFormularioSobre(form, contexto);
  } catch (erro) {
    if (erro && erro.status === 401) {
      contexto.onUnauthorized();
      return;
    }
    contexto.flash(erro.message || 'Falha ao carregar dados de Sobre Nos.', 'error');
  }
}

export const initAboutManager = iniciarGerenciadorSobre;

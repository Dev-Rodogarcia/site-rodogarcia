/* ==[DOC-FILE]===============================================================
Arquivo : src/developer/js/managers/contact-manager.js
Modulo  : Frontend - managers do painel developer
Papel   : Atualiza informacoes editaveis da pagina Contato (titulos, canais, endereco e CTA).

Responsabilidades:
- Carregar dados persistidos de contato e refletir no formulario.
- Sanitizar os campos de texto/URL antes de enviar para a API.
- Persistir atualizacoes da pagina Contato sem permitir alteracao de layout.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js
- Endpoints/rotas: /api/developer/textos
- Classes/seletores/chaves: #contato-info-form, #contactPageTitle, #contactPhoneNumber, #contactEmailAddress, #contactWhatsappUrl

Entradas e saidas:
- Entradas: valores do formulario e resposta JSON da API de textos.
- Saidas  : PUT autenticado + feedback de sucesso/erro no dashboard.

Elementos tecnicos: preencherFormularioContato, lerFormularioContato, iniciarGerenciadorContato
[DOC-FILE-END]============================================================== */

import { requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto, sanitizarUrl } from '/src/js/shared/utils/sanitize.js';

function preencherFormularioContato(form, textos) {
  form.contactPageTitle.value = textos.contactPageTitle || '';
  form.contactPageSubtitle.value = textos.contactPageSubtitle || '';
  form.contactPhoneNumber.value = textos.contactPhoneNumber || '';
  form.contactPhoneHours.value = textos.contactPhoneHours || '';
  form.contactEmailAddress.value = textos.contactEmailAddress || '';
  form.contactEmailResponse.value = textos.contactEmailResponse || '';
  form.contactWhatsappUrl.value = textos.contactWhatsappUrl || '';
  form.contactWhatsappLabel.value = textos.contactWhatsappLabel || '';
  form.contactAddressLine.value = textos.contactAddressLine || '';
  form.contactAddressZip.value = textos.contactAddressZip || '';
  form.contactAddressCountry.value = textos.contactAddressCountry || '';
  form.contactCtaLabel.value = textos.contactCtaLabel || '';
  form.contactCtaUrl.value = textos.contactCtaUrl || '';
}

function lerFormularioContato(form) {
  return {
    contactPageTitle: sanitizarTexto(form.contactPageTitle.value, 120),
    contactPageSubtitle: sanitizarTexto(form.contactPageSubtitle.value, 280),
    contactPhoneNumber: sanitizarTexto(form.contactPhoneNumber.value, 60),
    contactPhoneHours: sanitizarTexto(form.contactPhoneHours.value, 120),
    contactEmailAddress: sanitizarTexto(form.contactEmailAddress.value, 160).toLowerCase(),
    contactEmailResponse: sanitizarTexto(form.contactEmailResponse.value, 120),
    contactWhatsappUrl: sanitizarUrl(form.contactWhatsappUrl.value),
    contactWhatsappLabel: sanitizarTexto(form.contactWhatsappLabel.value, 80),
    contactAddressLine: sanitizarTexto(form.contactAddressLine.value, 180),
    contactAddressZip: sanitizarTexto(form.contactAddressZip.value, 20),
    contactAddressCountry: sanitizarTexto(form.contactAddressCountry.value, 60),
    contactCtaLabel: sanitizarTexto(form.contactCtaLabel.value, 40),
    contactCtaUrl: sanitizarUrl(form.contactCtaUrl.value)
  };
}

function vincularFormularioContato(form, contexto) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botaoSubmit = form.querySelector('button[type="submit"]');
    if (botaoSubmit) botaoSubmit.disabled = true;

    try {
      await requisicaoApi('/api/developer/textos', {
        method: 'PUT',
        body: lerFormularioContato(form)
      });
      contexto.flash('Informacoes de contato atualizadas.', 'success');
    } catch (erro) {
      if (erro && erro.status === 401) {
        contexto.onUnauthorized();
        return;
      }
      contexto.flash(erro.message || 'Falha ao salvar contato.', 'error');
    } finally {
      if (botaoSubmit) botaoSubmit.disabled = false;
    }
  });
}

export async function iniciarGerenciadorContato(contexto) {
  const form = document.getElementById('contato-info-form');
  if (!form) return;

  try {
    const payload = await requisicaoApi('/api/developer/textos');
    preencherFormularioContato(form, payload.texts || {});
    vincularFormularioContato(form, contexto);
  } catch (erro) {
    if (erro && erro.status === 401) {
      contexto.onUnauthorized();
      return;
    }
    contexto.flash(erro.message || 'Falha ao carregar dados de contato.', 'error');
  }
}

export const initContactManager = iniciarGerenciadorContato;

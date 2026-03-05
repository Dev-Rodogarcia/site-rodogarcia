/* ==[DOC-FILE]===============================================================
Arquivo : src/auth/js/auth.js
Modulo  : Frontend - autenticacao
Papel   : Implementa logica de interface, integracao com APIs e manipulacao de estado/DOM.

Responsabilidades:
- Controla o comportamento principal do modulo na interface.
- Integra dados vindos de API e valida entradas antes de uso.
- Atualiza estado/DOM preservando previsibilidade de execucao.

Integracoes:
- Dependencias: /src/js/shared/api.js, /src/js/shared/utils/sanitize.js
- Endpoints/rotas: /api/auth/login, /api/auth/register
- Classes/seletores/chaves: [data-access-link], button[type=, input, button, select, textarea, #staff-login-block, #client-coming-soon, #login-form, #auth-message, #setup-code-wrapper

Entradas e saidas:
- Entradas: Eventos de usuario, estado da pagina e dados retornados por API.
- Saidas  : Mutacao de DOM, feedback visual e chamadas de rede subsequentes.

Elementos tecnicos: obterQueryParams, obterAreaAcesso, obterProximoDestino, exibirMensagem, redirecionarSeAutenticado, atualizarAlternanciaAcesso, vincularLogin, atualizarCampoSetup, definirFormularioCadastroDesabilitado, atualizarDisponibilidadeCadastro
[DOC-FILE-END]============================================================== */

import { carregarSessao, requisicaoApi } from '/src/js/shared/api.js';
import { sanitizarTexto } from '/src/js/shared/utils/sanitize.js';

const estadoAuth = {
  exigeSetup: false,
  autenticado: false,
  proximoDestino: '/developer/index.html',
  areaAcesso: 'staff'
};

const REGEX_NEXT_SEGURO = /^\/[a-zA-Z0-9/_?.=&-]*$/;

function obterQueryParams() {
  return new URLSearchParams(window.location.search);
}

function obterAreaAcesso() {
  const params = obterQueryParams();
  const area = params.get('area');
  return area === 'client' ? 'client' : 'staff';
}

function obterProximoDestino() {
  const params = obterQueryParams();
  const next = String(params.get('next') || '').trim();

  if (!next || next.startsWith('//')) {
    return '/developer/index.html';
  }

  if (!REGEX_NEXT_SEGURO.test(next)) {
    return '/developer/index.html';
  }

  return next;
}

function exibirMensagem(alvo, mensagem, tipo = 'info') {
  if (!alvo) return;
  alvo.textContent = mensagem;
  alvo.dataset.state = tipo;
}

function redirecionarSeAutenticado() {
  if (estadoAuth.autenticado && estadoAuth.areaAcesso === 'staff') {
    window.location.href = estadoAuth.proximoDestino;
  }
}

function atualizarAlternanciaAcesso() {
  const links = document.querySelectorAll('[data-access-link]');
  links.forEach((link) => {
    const ativo = link.dataset.accessLink === estadoAuth.areaAcesso;
    link.classList.toggle('active', ativo);
    link.setAttribute('aria-current', ativo ? 'page' : 'false');
  });

  const blocoStaff = document.getElementById('staff-login-block');
  const blocoCliente = document.getElementById('client-coming-soon');

  if (blocoStaff && blocoCliente) {
    const ehCliente = estadoAuth.areaAcesso === 'client';
    blocoStaff.hidden = ehCliente;
    blocoCliente.hidden = !ehCliente;
  }
}

function vincularLogin() {
  const formulario = document.getElementById('login-form');
  if (!formulario) return;

  const aviso = document.getElementById('auth-message');

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const email = sanitizarTexto(formulario.email.value, 160).toLowerCase();
    const senha = typeof formulario.password.value === 'string' ? formulario.password.value : '';

    if (!email || !senha) {
      exibirMensagem(aviso, 'Informe e-mail e senha.', 'error');
      return;
    }

    const botaoSubmit = formulario.querySelector('button[type="submit"]');
    botaoSubmit.disabled = true;

    try {
      await requisicaoApi('/api/auth/login', {
        method: 'POST',
        body: { email, password: senha }
      });

      exibirMensagem(aviso, 'Login realizado. Redirecionando...', 'success');
      window.location.href = estadoAuth.proximoDestino;
    } catch (erro) {
      exibirMensagem(aviso, erro.message, 'error');
    } finally {
      botaoSubmit.disabled = false;
    }
  });
}

function atualizarCampoSetup() {
  const wrapper = document.getElementById('setup-code-wrapper');
  const input = document.getElementById('setupCode');
  if (!wrapper || !input) return;

  if (estadoAuth.exigeSetup) {
    wrapper.hidden = false;
    input.required = true;
    return;
  }

  wrapper.hidden = true;
  input.required = false;
}

function definirFormularioCadastroDesabilitado(desabilitado) {
  const formulario = document.getElementById('register-form');
  if (!formulario) return;

  formulario.classList.toggle('is-disabled', desabilitado);
  formulario.setAttribute('aria-disabled', desabilitado ? 'true' : 'false');

  const campos = formulario.querySelectorAll('input, button, select, textarea');
  campos.forEach((campo) => {
    if (desabilitado) {
      campo.setAttribute('disabled', 'disabled');
      return;
    }

    campo.removeAttribute('disabled');
  });
}

function atualizarDisponibilidadeCadastro() {
  const aviso = document.getElementById('auth-notice');
  const mensagemBloqueio = document.getElementById('register-locked-message');
  const cadastroBloqueado = !estadoAuth.exigeSetup && !estadoAuth.autenticado;

  if (aviso) {
    aviso.textContent = cadastroBloqueado
      ? 'Cadastro desabilitado. Entre como administrador.'
      : 'Cadastro permitido apenas com controle administrativo.';
  }

  if (mensagemBloqueio) {
    mensagemBloqueio.hidden = !cadastroBloqueado;
  }

  definirFormularioCadastroDesabilitado(cadastroBloqueado);
}

function vincularCadastro() {
  const formulario = document.getElementById('register-form');
  if (!formulario) return;

  const aviso = document.getElementById('auth-message');
  atualizarCampoSetup();
  atualizarDisponibilidadeCadastro();

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!estadoAuth.exigeSetup && !estadoAuth.autenticado) {
      exibirMensagem(aviso, 'Cadastro desabilitado. Entre como administrador.', 'error');
      return;
    }

    const nome = sanitizarTexto(formulario.name.value, 80);
    const email = sanitizarTexto(formulario.email.value, 160).toLowerCase();
    const senha = typeof formulario.password.value === 'string' ? formulario.password.value : '';
    const confirmarSenha = typeof formulario.confirmPassword.value === 'string' ? formulario.confirmPassword.value : '';
    const codigoSetup = formulario.setupCode ? sanitizarTexto(formulario.setupCode.value, 80) : '';

    if (!nome || !email || !senha || !confirmarSenha) {
      exibirMensagem(aviso, 'Preencha todos os campos obrigatorios.', 'error');
      return;
    }

    if (senha !== confirmarSenha) {
      exibirMensagem(aviso, 'As senhas nao conferem.', 'error');
      return;
    }

    const botaoSubmit = formulario.querySelector('button[type="submit"]');
    botaoSubmit.disabled = true;

    try {
      const payload = { name: nome, email, password: senha, confirmPassword: confirmarSenha };
      if (estadoAuth.exigeSetup) {
        payload.setupCode = codigoSetup;
      }

      await requisicaoApi('/api/auth/register', {
        method: 'POST',
        body: payload
      });

      exibirMensagem(aviso, 'Conta criada com sucesso.', 'success');
      window.location.href = '/developer/index.html';
    } catch (erro) {
      if (erro && (erro.status === 401 || erro.status === 403)) {
        exibirMensagem(aviso, 'Cadastro desabilitado. Entre como administrador.', 'error');
      } else {
        exibirMensagem(aviso, erro.message || 'Falha ao criar conta.', 'error');
      }
    } finally {
      botaoSubmit.disabled = false;
    }
  });
}

async function iniciarPaginaAuth() {
  estadoAuth.proximoDestino = obterProximoDestino();
  estadoAuth.areaAcesso = obterAreaAcesso();

  try {
    const sessao = await carregarSessao();
    estadoAuth.autenticado = Boolean(sessao.authenticated);
    estadoAuth.exigeSetup = Boolean(sessao.setupRequired);
  } catch {
    estadoAuth.autenticado = false;
    estadoAuth.exigeSetup = false;
  }

  const tipoPagina = document.body.dataset.page;

  if (tipoPagina === 'login') {
    atualizarAlternanciaAcesso();

    if (estadoAuth.areaAcesso === 'client') {
      exibirMensagem(
        document.getElementById('auth-message'),
        'Area de clientes ainda nao esta habilitada. Use o acesso de Funcionarios/Dev.',
        'info'
      );
      return;
    }

    redirecionarSeAutenticado();
    vincularLogin();
    return;
  }

  if (tipoPagina === 'register') {
    if (estadoAuth.areaAcesso === 'client') {
      window.location.href = '/auth/entrar.html?area=client';
      return;
    }

    vincularCadastro();
  }
}

document.addEventListener('DOMContentLoaded', iniciarPaginaAuth);



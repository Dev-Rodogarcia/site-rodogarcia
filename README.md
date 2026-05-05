# Site Rodogarcia Transportes

Monorepo separado em dois projetos independentes:

- `frontend/`: Next.js, React, TypeScript, UI publica e painel CMS.
- `backend/`: Node.js, Express, TypeScript, APIs, autenticacao, regras de negocio, storage JSON e seguranca.

## Raiz do repositorio

A raiz fica reservada para arquivos globais:

- `.env` e `.env.example`: configuracao local do monorepo.
- `docs/`: documentacao tecnica curta.
- `scripts/`: testes e automacoes globais.
- `frontend/` e `backend/`: projetos isolados.

Nao mantenha codigo de app, `node_modules`, builds, backups, guias de agente ou arquivos temporarios na raiz.

## Desenvolvimento Local

Instale as dependencias separadamente:

```powershell
cd backend
cmd /c npm install

cd ..\frontend
cmd /c npm install
```

Configure o ambiente:

```powershell
Copy-Item .env.example .env
```

Suba os dois servidores:

```powershell
cd backend
cmd /c npm run dev

cd ..\frontend
cmd /c npm run dev
```

Tambem e possivel usar `iniciar.bat` a partir da raiz. Ele encerra processos antigos nas portas padrao e abre backend e frontend em janelas separadas.

URLs padrao:

- Frontend: `http://127.0.0.1:5010`
- Backend: `http://127.0.0.1:4010`
- CMS: `http://127.0.0.1:5010/auth/entrar`

## Estrutura

- `backend/src/controllers`: entrada HTTP.
- `backend/src/services`: regras de negocio.
- `backend/src/repositories`: persistencia JSON.
- `backend/src/security`: sessao, CSRF, CORS, rate limit e auth.
- `frontend/src/app/developer`: painel visual do CMS.
- `frontend/src/app`: rotas publicas e auth.

## Persistencia

O storage inicial continua em JSON, agora dentro de `backend/storage`.
Arquivos privados ficam em `backend/storage/private`.
O backend carrega `.env` da raiz como fonte local padrao.

## Verificacao

```powershell
cd backend
cmd /c npm run typecheck
cmd /c npm run build

cd ..\frontend
cmd /c npm run typecheck
cmd /c npm run build
```

O teste de seguranca global fica em `scripts/tests/test-security-hardening.js`.



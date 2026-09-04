# Separação física do CMS

O corte físico foi concluído: `cms/frontend` é o painel Next e `cms/backend` é a API Spring MVC definitiva. O código Node/Express usado como baseline histórica da migração foi removido junto dos diretórios de fallback; ele não deve ser restaurado ou duplicado.

## Ownership consolidado

- `cms/frontend/src/app/auth/**` e `cms/frontend/src/app/developer/**` são as rotas lógicas do painel sob `/admin`.
- `cms/frontend/src/components/developer/**`, hooks administrativos, sessão, ACL e ajuda contextual pertencem exclusivamente ao CMS.
- `cms/backend/src/main/java/**` concentra autenticação, administração, conteúdo/SEO, mídia/uploads, formulários/leads, consentimento, analytics, popup, tracking, melhorias, auditoria, scheduler e a integração administrativa com o Landing Builder.
- `site/backend/src/main/java/**` concentra ESL e consultas públicas de CEP/CNPJ, com limites operacionais próprios.
- `shared/` contém somente contratos e helpers agnósticos; não recebe UI, runtime Next ou regras exclusivas de uma aplicação.

## Limites de integração

- Não há import direto entre `cms/frontend/**` e `site/frontend/src/**` em nenhuma direção.
- Não há import de runtime entre `cms/backend/src/**` e `site/backend/src/**`.
- Pelo gateway, o navegador chama `/api` e `/uploads` no hostname do site; `CMS_BACKEND_PROXY_URL` serve somente ao CMS aberto diretamente em DEV.
- `NEXT_PUBLIC_SITE_URL` é pública e serve apenas para links, logo, prévias e assets; uploads continuam same-origin em `/uploads/*`.
- O volume canônico continua em `site/backend/storage`. `cms/backend` é o único escritor das coleções administrativas e usa `private/cms-rate-limits.json`; o backend público conserva apenas seus limites de ESL/CEP/CNPJ.
- O Landing Builder continua isolado e é o único escritor de `landing-builder/backend/storage`; o CMS o consome pela API interna autenticada.

## Validação da fronteira

```bat
cd cms\backend && mvnw.cmd -B clean verify
cd ..\frontend && npm ci && npm run typecheck && npm run build
cd ..\..\site\backend && mvnw.cmd -B clean verify
cd ..\frontend && npm run typecheck && npm run build
cd ..\..\landing-builder\backend && mvnw.cmd -B clean verify
git diff --check
```

O modo DEV e a publicação em produção continuam operações manuais; a remoção do fallback não autoriza iniciar, reiniciar ou promover processos automaticamente.

# Separação física do CMS

O CMS é composto por `cms/frontend` (Next) e `cms/backend` (Express). A separação é física: código migrado não deve ser restaurado nem duplicado em `site/frontend/` ou `site/backend/`.

## Ownership consolidado

- `cms/frontend/src/app/auth/**` e `cms/frontend/src/app/developer/**` são as rotas internas lógicas do painel.
- `cms/frontend/src/components/developer/**`, hooks administrativos, sessão, ACL e ajuda contextual pertencem exclusivamente ao CMS.
- `cms/backend/src/routes/**`, `controllers/**`, `services/**`, `repositories/**` e `security/**` são a origem definitiva de autenticação, administração, conteúdo/SEO, mídia/uploads, formulários/leads, consentimentos, analytics, popup, tracking, melhorias e integração administrativa com o Landing Builder.
- `site/backend/src/**` ficou restrito ao transporte ESL e às consultas públicas de CEP/CNPJ, com seus próprios limites operacionais.
- O CMS usa `basePath: "/admin"`; portanto, a URL visível é `/admin/auth/entrar` ou `/admin/developer/...`, apesar de o App Router trabalhar com `/auth/...` e `/developer/...`.
- `shared/` é a origem única de `types/content.ts`, `useApiRequest.ts`, `utils.ts` e defaults de navegação/rodapé. Os wrappers nos aplicativos existem apenas para compatibilidade de imports.
- `site/frontend/src/lib/cmsPublic.ts` pertence ao site público, que o usa para conteúdo, SEO e mídia. Ele não é um módulo do CMS.
- O formulário administrativo de melhorias está em `cms/frontend/src/components/forms/InternalImprovementForm.tsx`; o formulário público continua em `site/frontend/src/components/forms/ImprovementForm.tsx` sem acesso administrativo.

## Limites de integração

- Não pode haver import direto entre `cms/frontend/**` e `site/frontend/src/**` em nenhuma direção.
- Não há import de runtime entre `cms/backend/src/**` e `site/backend/src/**`; utilitários necessários foram extraídos ou copiados como módulos locais sem compartilhar estado de processo.
- O CMS usa `CMS_BACKEND_PROXY_URL` somente quando aberto diretamente no desenvolvimento. Pelo gateway, o navegador continua chamando `/api` e `/uploads` no hostname do site; o Next decide internamente o backend dono de cada rota.
- `NEXT_PUBLIC_SITE_URL` é público e serve somente para links, logo, prévias e assets versionados do site. Uploads continuam em `/uploads/*`.
- O volume canônico continua em `site/backend/storage`, sem cópia de JSON, uploads ou sessões. `cms/backend` é o escritor único das coleções administrativas e usa `private/cms-rate-limits.json`; o backend público conserva apenas seus limites de ESL/CEP/CNPJ. Assim, não há dois writers para a mesma coleção.
- O gateway envia ao backend do CMS `/api/auth/*`, `/api/admin/*`, conteúdo/SEO/mídia, consentimento, tracking, analytics, popup, formulários, leads, melhorias e `/uploads/*`. ESL, CEP e CNPJ permanecem no backend público.

## Validação da fronteira

```bat
cd cms\backend && npm ci && npm run typecheck && npm test && npm run build
cd ..\frontend && npm ci && npm run typecheck && npm run build
cd ..\..\site\frontend && npm run typecheck && npm run build
cd ..\backend && npm run typecheck && npm test && npm run build
git diff --check
```

O corte de código e ownership está concluído. A operação DEV com contas reais e a publicação em produção continuam gates manuais separados; nenhum deles é inferido por esta documentação.

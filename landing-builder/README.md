# Landing Builder

Aplicação independente de campanhas. Ela não é iniciada, parada nem publicada pelos scripts `iniciar-dev.bat` e `iniciar-prod.bat` do site/CMS.

## Processos e fronteiras

- `backend/`: API privada em `127.0.0.1:6110` por padrão. O CMS é o único consumidor dos endpoints internos e se autentica com `LANDING_BUILDER_SERVICE_TOKEN`.
- `frontend/`: renderizador público em `127.0.0.1:5112` por padrão. O gateway do site só o usa como fallback para slugs que não pertencem ao institucional.
- Campanhas publicadas usam os assets Next sob `/landing-assets/_next/*`; esse prefixo impede colisão com os assets do Next institucional. `LANDING_BUILDER_ASSET_PREFIX` deve ter o mesmo valor no frontend do Builder e no processo do site.
- Mídias das campanhas são próprias do Builder: ficam em `media.json` e `media/` no volume dele e são expostas somente em `/landing-media/:id`. O upload interno aceita assinatura real de PNG, JPG/JPEG, WebP, AVIF, MP4, WebM e Ogg; imagens são otimizadas para WebP. Uma mídia ainda referenciada por uma landing não pode ser excluída.
- `backend/storage/landings.json`, `media.json` e `media/` são o conteúdo canônico local de desenvolvimento e ficam ignorados pelo Git. Quando ainda não existem, o Builder começa vazio e os cria no primeiro salvamento. Em produção, `LANDING_BUILDER_STORAGE_ROOT` é obrigatório e deve apontar para um volume absoluto fora do repositório.
- Rascunhos só abrem por uma URL de prévia opaca gerada pelo CMS em `/preview/<token>`; ela não é indexável, não entra no sitemap e não carrega analytics.
- Campanhas publicadas e indexáveis entram nos sitemaps do Builder e do site. A campanha usa o mesmo consentimento de analytics do site (`rg_analytics_consent`) quando estiver no gateway público.

## Uso manual em desenvolvimento

Em terminais separados, depois de configurar os respectivos `.env` locais:

```bat
cd landing-builder\backend
npm ci
npm run dev
```

```bat
cd landing-builder\frontend
npm ci
npm run dev
```

Para integrar ao CMS/site, configure no ambiente deles `LANDING_BUILDER_API_URL`, `LANDING_BUILDER_SERVICE_TOKEN`, `LANDING_BUILDER_PUBLIC_URL` e `LANDING_BUILDER_ASSET_PREFIX`. O token nunca é público. O gateway também deve encaminhar `/landing-media/*` ao frontend do Builder, além de `/landing-assets/_next/*`.

O Builder reserva as rotas institucionais, administrativas, de API e aliases atuais do site; uma campanha não pode publicar sobre elas.

# Estado Atual do Sistema — Site Rodogarcia

## Estado confirmado em 2026-09-03

- O monorepo possui três backends canônicos em Java 21/Spring Boot 4.1.1 MVC: `site/backend`, `cms/backend` e `landing-builder/backend`.
- Os fontes, lockfiles, caches e artefatos dos backends Node/Express de site, CMS e Landing Builder foram removidos. Não há fallback Node nem seleção de runtime restante.
- O corte físico do CMS foi concluído: `cms/backend` é a origem definitiva da API administrativa. `cms/backend-spring` e `cms/backend-node` não existem mais.
- O volume canônico do site continua em `site/backend/storage`; ele não foi movido, apagado ou copiado. O volume próprio do Builder continua em `landing-builder/backend/storage` no desenvolvimento e em `LANDING_BUILDER_STORAGE_ROOT` fora do repositório na produção.

## Arquitetura e Padrões

| Área | Origem definitiva | Responsabilidade |
| --- | --- | --- |
| Site público | `site/frontend` | Next.js, gateway same-origin e páginas institucionais. |
| API pública | `site/backend` | Spring MVC para ESL, CEP e CNPJ; escritora exclusiva do rate limit operacional. |
| CMS | `cms/frontend` | Next.js com `basePath: /admin`. |
| API CMS | `cms/backend` | Spring MVC para sessão, ACL, conteúdo, SEO, mídia, uploads, formulários, analytics, consentimento e integração privada do Builder. |
| Landing Builder | `landing-builder/backend` | Spring MVC, campanhas, prévias e mídia no volume próprio. |
| Renderizador de campanhas | `landing-builder/frontend` | Next.js para campanhas publicadas e prévias opacas. |

- Não há import de runtime entre `site/backend`, `cms/backend` e `landing-builder/backend`. Código realmente agnóstico pertence a `shared/`.
- Controllers traduzem HTTP, services concentram regra de negócio e repositories são os únicos responsáveis por leitura/escrita JSON atômica.
- Não há banco de dados, JPA, Hibernate, Flyway ou outra persistência além de JSON local.
- O site encaminha `/admin/*` ao CMS, rotas administrativas e `/uploads/*` à API CMS, CEP/CNPJ/ESL à API pública e assets, mídia e fallback de slug ao Builder. O navegador não recebe URLs internas ou tokens de serviço.
- No formulário público de cotação, os blocos de dados acompanham visualmente o tipo de carga selecionado: carga fracionada usa tom e ícone verdes e carga fechada tom e ícone azuis. As camadas de cor fazem crossfade suave e escalonado, respeitam redução de movimento e não alteram campos, cálculo ou envio.

## Portas e artefatos

| Ambiente | API pública | API CMS | Site | CMS | API Builder | Builder |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| DEV | `31012` | `31013` | `35180` | `35013` | `36110` | `35112` |
| Produção | `6050` | `6051` | `6060` | `6061` | `41110` | `41112` |

- Os três processos de API em produção usam `java -jar dist/server.jar`; os três frontends usam seus artefatos Next `dist-prod/server.js`.
- `ecosystem.config.js`, `iniciar-dev.bat`, `iniciar-prod.bat`, CI e promoção usam essa topologia fixa. Os inicializadores nunca são executados automaticamente pela IA. O orquestrador de produção usa helpers externos para validação, instalação, Maven, typecheck, staging e espera de release, sem subrotinas internas `call :rótulo`.
- Antes de encerrar processos DEV, `iniciar-dev.bat` chama um preflight Maven externo para os três backends; uma falha preserva os processos que já estavam em execução. O inicializador não depende de subrotinas por rótulo. A identificação de processos usa exclusivamente as seis portas DEV canônicas e percorre a ancestralidade para reconhecer as JVMs filhas do Maven sem atingir outro projeto.
- Cada processo Spring iniciado pelo fluxo DEV recebe explicitamente sua porta canônica por launcher isolado: site `31012`, CMS `31013` e Builder `36110`. O launcher usa atribuições `set "chave=valor"`, sem aspas/whitespace propagados para `HOST`, `PORT` ou as variáveis do Builder.
- A promoção preserva rollback completo quando existe conjunto ativo; `RODOGARCIA_INITIAL_PROD_ROLLOUT=1` continua restrito ao caso excepcional em que esse conjunto esteja ausente.
- O preflight de produção recusa os seis listeners DEV antes de executar `npm ci`, pois as instalações compartilham os `node_modules` do checkout e poderiam corromper o runtime DEV em uso. O encerramento/início do DEV permanece manual.
- Os helpers batch de instalação, Maven, typecheck e staging normalizam qualquer retorno diferente de `0` (inclusive o `EPERM -4048` negativo do npm no Windows) para falha explícita; o orquestrador compara o status literal e não pode avançar ao Maven/typecheck após uma instalação incompleta.
- O hardening isolado cobre site e CMS com `site/backend/dist.test/server.jar`, `cms/backend/dist.test/server.jar`, `site/frontend/dist-prod.test` e `cms/frontend/dist-prod.test`. O Builder tem Maven Wrapper e suíte de contrato próprios.

## Contratos, Segurança e Persistência

- A API pública preserva seus contratos de ESL, CEP, CNPJ, `/health` e `/ready`, documentados em `site/backend/contracts/` e cobertos por testes HTTP/socket.
- A API CMS preserva os 95 endpoints explícitos, `/uploads`, cookies, sessão, ACL, CSRF, CORS, limites, DTOs e efeitos descritos em `cms/backend/contracts/`.
- O Builder preserva `/health`, mídia pública em `/landing-media/:id`, campanhas públicas, prévias opacas e operações internas autenticadas por `LANDING_BUILDER_SERVICE_TOKEN`. JSON, multipart, assinatura de mídia, limites, headers de segurança e DTO público mínimo são cobertos por testes de contrato.
- A prévia de uma campanha é entregue exclusivamente pelo renderizador público do Builder, após salvamento explícito no CMS. O token opaco expira em sete dias e é renovado somente em operação interna autenticada; prévia não carrega analytics e não é indexável.
- A mídia da campanha guarda `alt` e, para vídeo, `poster` apontando para imagem da própria biblioteca. Imagens são otimizadas para WebP; vídeo só é aceito na seção Story, com controles acessíveis. Nem a mídia usada pela campanha, por uma revisão ou como poster de vídeo pode ser excluída.
- Campanhas têm histórico limitado a 20 revisões, rollback, cópia, arquivamento e exclusão somente após arquivar. Publicação exige SEO mínimo, CTA completo, seção de conversão preenchida e ausência de textos de orientação; o layout público usa medidas responsivas e a própria landing respeita o consentimento antes de carregar analytics.
- Programações de publicação/despublicação são armazenadas pelo writer único do Builder e aplicadas no processamento seguro seguinte. As operações administrativas de ciclo de vida são auditadas pelo CMS.
- O único analytics de campanha é `ga4MeasurementId`. GTM, Meta Pixel e Google Ads não pertencem ao DTO, ao formulário ou ao renderizador enquanto não houver contrato de consentimento específico para eles.
- No uso isolado, o Builder lê `landing-builder/backend/.env` com a mesma precedência do dotenv histórico: as variáveis do processo prevalecem sobre o arquivo.
- Em produção, CMS e Builder exigem `FFMPEG_PATH` absoluto, existente e fora do repositório/`node_modules`. O Builder também exige token de serviço forte e storage externo absoluto.
- Arquivos privados, uploads, backups, logs e builds permanecem ignorados pelo Git. A raiz também ignora explicitamente os `target/` dos três backends Spring, relatórios Maven, dumps de JVM e credenciais/certificados locais, preservando wrappers e fontes versionáveis. Apenas o processo responsável por cada coleção pode escrevê-la.

## Migração Spring concluída

- [x] Backend público promovido fisicamente para `site/backend`, com Maven Wrapper, contratos e suíte Spring verificados.
- [x] Backend CMS promovido fisicamente para `cms/backend`, com manifesto de 95 endpoints, persistência JSON e suíte Spring verificados.
- [x] Landing Builder migrado para `landing-builder/backend`, com Maven Wrapper, rotas públicas/internas, prévia, mídia com assinatura real e armazenamento JSON próprios.
- [x] Configuração de ambiente, CI, scripts de promoção, PM2, documentação e runbooks padronizados para os três JARs Spring.
- [x] Fontes e dependências Node dos três backends removidos sem tocar os volumes de storage.

## Validações registradas

- `site/backend`: `mvnw.cmd -B -ntp clean verify` passou com 154 testes.
- `cms/backend`: `mvnw.cmd -B -q verify` passou após a suíte de proxy das operações de ciclo de vida e metadados de mídia do Builder.
- `landing-builder/backend`: `mvnw.cmd -B -q verify` passou com contratos de campanhas, prévias, mídia, assinatura real, limites, revisões, rollback, programação, arquivamento, exclusão protegida e retenção de poster.
- `site/frontend`, `cms/frontend` e `landing-builder/frontend`: typecheck e build isolado em `.next.test` passaram.
- Após a sinalização visual do tipo de carga na cotação, `site/frontend` passou novamente em typecheck e build isolado em `.next.test`.
- `node scripts/tests/test-production-operations.js` passou, inclusive a guarda contra retorno de `call :rótulo`, a recusa do DEV ativo e a propagação correta do `EPERM -4048` do npm no `iniciar-prod.bat`; os helpers PowerShell e a promoção de artefatos também foram validados estaticamente.
- O hardening isolado de site/CMS passou integralmente com JARs e storage temporários. Ele não usou portas ou artefatos de produção.

## Tarefas Pendentes

Nenhuma pendência técnica acionável identificada no código atual.

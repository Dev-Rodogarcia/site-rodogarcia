# Relatório de auditoria e correções da integração CMS

Data: 14/07/2026

## Resultado executivo

Foram rastreados 387 contratos entre CMS, backend, storage JSON, APIs e frontend:

| Indicador | Resultado |
| --- | ---: |
| Contratos de páginas analisados | 181 |
| Contratos globais analisados | 206 |
| Contratos ativos | 357 |
| Contratos ativos funcionais | 357 |
| Contratos ativos parcialmente funcionais | 0 |
| Controles sem consumidor aposentados da UI | 30 |
| Contratos de páginas funcionando | 181/181 |
| Testes backend | 9 arquivos / 25 testes aprovados |

Os 30 controles aposentados continuam preservados em storages legados, mas não são mais apresentados como editáveis quando não possuem consumidor efetivo.

## O que foi corrigido

### Conteúdo e páginas

- Home: ações rápidas passaram a respeitar o JSON, aceitar fragmentos seguros e ocultar ações sem destino; a ação “Taxas” deixou de ser forçada.
- Sobre, Empresas, Contato, Carreiras e Cotação: validação de payloads, botões, mídias, vagas, canais, FAQs, estados ativos e arrays vazios.
- Termos e Privacidade: remoção de blocos legais hardcoded e consumo de conteúdo editável do CMS.
- Links internos, externos, `mailto`, `tel` e âncoras passaram a usar semântica coerente.
- Serviços: posição de imagem limitada a valores válidos.
- Unidades: UF brasileira, tipos permitidos, contatos validados, booleans estritos e unidade padrão única.

### Mídia

- Biblioteca passou a localizar referências em conteúdo, textos, slots, SEO e popup.
- Substituição impede trocar imagem por vídeo e grava os cinco stores por transação com journal, rollback e recuperação no boot.
- Slots editáveis foram limitados às sete certificações usadas pela Home e aceitam somente imagens.
- Chaves desconhecidas retornam `422`; limpeza de slot remove o valor persistido.
- Slots legados não são reenviados pelo editor.
- Variantes `medium`, `large` e `poster` não aparecem como duplicatas.
- Upload por data URL foi removido; uploads multipart continuam com validação de assinatura.
- Erros de upload e JSON inválido recebem status HTTP apropriado.
- Hero, operações, showcase e serviços respeitam fontes mobile, poster e texto alternativo.

### SEO, LGPD e popup

- SEO preserva metatags multilinha, deriva slug da rota e limita edição às 12 rotas públicas.
- Canonical rejeita `mailto`, `tel` e fragmentos inválidos; JSON SEO malformado é ignorado com segurança na leitura.
- LGPD usa allowlists, booleans estritos, categoria necessária obrigatória, campos obrigatórios e chaves únicas, além de DTO público mínimo.
- Popup preserva zeros, normaliza objetos aninhados, valida mídias, limites e campos de contato; configuração legada sem contato ganha e-mail seguro na leitura.

### Analytics, tracking, leads e usuários

- Controles de analytics sem consumidor foram removidos da UI.
- GA4 e Clarity exigem IDs válidos antes de habilitar o provedor; legado inválido permanece desabilitado na resposta administrativa e pública.
- Tracking exibe ação, alvo e ator mínimos.
- Conversões usam `form_success`.
- Leads de contato e cotação são deduplicados no painel unificado.
- Agregados respeitam filtros globais e iPad é classificado como tablet.
- CRUD de usuários valida role/ativo, preserva updates parciais, restringe gestão ao supremo e invalida sessões quando necessário.

### Footer e navegação

- Arrays vazios explícitos, inclusive links de coluna e canais de ajuda, passaram a ser preservados; campos obrigatórios inválidos retornam `422` em vez de voltar silenciosamente ao fallback.
- Ícones usam allowlists e `external` é derivado da URL.
- Limites frontend/backend foram alinhados.
- Navegação e aliases do CMS foram revisados.

## Arquivos e áreas alteradas

- `backend/src/controllers/`: consentimento e mídia.
- `backend/src/repositories/`: conteúdo e usuários.
- `backend/src/services/`: analytics, autenticação, CMS, consentimento, conteúdo, footer, formulários, leads, mídia, páginas, popup, SEO e tracking.
- `backend/src/config/contentDefaults.ts`.
- `backend/src/utils/http.ts` e `sanitize.ts`.
- `backend/src/tests/` e `backend/tests/`: regressões de contratos e isolamento de storage.
- `backend/storage/content.json`: defaults públicos versionados.
- `frontend/src/app/`: páginas públicas e telas do CMS.
- `frontend/src/components/`: Home, links semânticos, compliance, popup e conteúdo.
- `frontend/src/lib/`: API, conteúdo público e rotas.
- `docs/`: inventários e este relatório consolidado.

Nenhum `.env`, credencial, storage privado ou upload foi alterado.

## Validações executadas

- Backend typecheck: aprovado.
- Frontend typecheck: aprovado.
- Backend build: aprovado.
- Frontend build: aprovado.
- Backend tests: 9 arquivos, 30 testes aprovados.
- `git diff --check`: aprovado.
- Hardening ponta a ponta em portas isoladas: aprovado.
- Chrome headless: Home em desktop/tablet/mobile, Contato em desktop e Privacidade em mobile renderizados sem erro de runtime.

## Pendências reais

Nenhuma pendência técnica aberta nesta rodada.

## Inventários de apoio

- [Auditoria backend](./auditoria-cms-backend.md)
- [Auditoria por páginas](./auditoria-cms-paginas.md)
- [Auditoria global](./auditoria-cms-globais.md)

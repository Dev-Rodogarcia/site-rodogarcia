# Aceite DEV — CMS em `/admin`

Este roteiro fecha os gates funcionais de CMS-03, CMS-04 e CMS-05 sem tocar em produção. Preencha os checkboxes somente durante um aceite DEV autorizado; `states.md` continua sendo a fonte de verdade para marcar os gates do bloco. A ativação operacional de produção é um item separado, exclusivamente humano.

Em 2026-08-25, o responsável aceitou o corte técnico de CMS-03, CMS-04 e CMS-05 com base nas validações automatizadas, no smoke DEV e na confirmação do login pelo gateway. Os itens manuais ainda desmarcados abaixo foram transferidos para uma validação posterior com a equipe administrativa; eles não foram executados nem devem ser interpretados como testados por este registro.

## Limites e pré-requisitos

- [ ] Há autorização explícita do responsável para iniciar manualmente o modo DEV. `iniciar-dev.bat` usa as portas de cinco dígitos `31012`, `31013`, `35180`, `35013`, `36110` e `35112` e encerra somente processos identificados como deste repositório. Se uma delas pertencer a outro projeto, o script aborta sem encerrar processos; depois de livre, ele limpa os caches Next e inicia backend público, API CMS, site, painel e os dois processos do Landing Builder.
- [ ] Há uma conta administrativa DEV autorizada e, para ACL, uma conta ou perfil com pelo menos uma permissão negada. Não registrar senha, cookie, token CSRF ou dados pessoais neste documento.
- [ ] O acesso normal é `http://127.0.0.1:35180/admin/auth/entrar`. A porta `35013` é apenas para o teste direto do CMS em DEV.
- [ ] Um Dev Tunnel pode encaminhar temporariamente a porta local `35180` para outra máquina. Essa URL externa não é gravada em `.env`; origens `https://<tunnel>-<porta>.<região>.devtunnels.ms` só são aceitas em desenvolvimento.
- [ ] A API CMS responde somente internamente em `http://127.0.0.1:31013/health`; o navegador continua no gateway `35180` para `/api/*` e `/uploads/*`.
- [ ] O Landing Builder responde internamente em `http://127.0.0.1:36110/health` e `http://127.0.0.1:35112/health`; a tela de campanhas não deve apresentar `503` quando os seis processos estiverem ativos.
- [ ] Cada alteração de conteúdo é reversível: anotar o valor original, testar e restaurá-lo antes de encerrar o aceite. Não usar conteúdo institucional como dado de teste.
- [ ] Este aceite não cria, publica, despublica nem testa mídia de landing. Esses cenários pertencem ao bloco funcional próprio do Landing Builder e não devem alterar seu storage.

## Gateway, autenticação e segurança

1. **Sem sessão**
   - [ ] Abrir `/admin`, `/admin/auth/entrar` e `/admin/developer` pelo host `35180`.
   - [ ] `/admin` redireciona para `/admin/auth/entrar`; `/admin/developer` faz redirecionamento client-side para login e preserva `next=/developer`.
   - [ ] Conferir no navegador que um asset do CMS é carregado em `/admin/_next/*`, sem URL interna `35013` exposta na barra de endereços.
   - [ ] Conferir aliases: `/auth/entrar`, `/developer`, `/developer/home` e `/admin/cadastrar-usuario` chegam sob `/admin/...`.

2. **Sessão e logout**
   - [ ] Fazer login pela URL do gateway; a barra continua em `/admin/...` e o Dashboard abre sem recarregar o site público.
   - [ ] Navegar por uma rota com permissão e atualizar a página: a sessão permanece válida.
   - [ ] Encerrar sessão, tentar voltar a uma URL administrativa e confirmar novo redirecionamento ao login.

3. **CSRF e ACL**
   - [ ] Em um campo reversível, salvar pelo fluxo normal e confirmar mensagem de sucesso.
   - [ ] Repetir somente em DEV a mesma mutação sem o header `X-CSRF-Token`; a API deve negar (`403`) sem persistir a alteração. Não copiar o token para logs, screenshots ou documentação.
   - [ ] Com o perfil restrito, conferir que o menu esconde a área negada, a URL direta mostra acesso negado e a API correspondente responde `403`.
   - [ ] No Dashboard, indicadores sem `analytics`, `popup`, `leads` ou `images` mostram indisponibilidade, não zero nem erro global. Na Home sem `units`, a referência global fica indisponível, mas os cards próprios da Home continuam editáveis.

4. **Upload pelo gateway**
   - [ ] Em `/admin/developer/imagens`, enviar uma imagem válida pequena (PNG, JPG/JPEG, WebP ou AVIF), conferir preview, sucesso, variante/URL interna e entrega em `/uploads/*` pelo host `35180`.
   - [ ] Enviar um vídeo válido pequeno (MP4, WebM ou Ogg), conferir preview e entrega pelo mesmo gateway. Não usar arquivos acima dos limites (imagem 8 MB; vídeo 64 MB).
   - [ ] Excluir somente os arquivos criados para o aceite, depois de remover qualquer referência de teste.

## Matriz das 30 rotas administrativas

Em todas as linhas, conferir carregamento, estado vazio ou erro quando a fonte não tiver dados, mensagem de sucesso após uma ação reversível e responsividade da própria tela. Onde houver **preview**, conferir Desktop, Tablet e Mobile no seletor do CMS; o iframe ou link deve abrir o host público `35180`, nunca `/admin`.

| # | URL visível | Permissão efetiva | Ação/estado funcional | Preview ou mídia |
| --- | --- | --- | --- | --- |
| 1 | `/admin/developer` | `dashboard` | Conteúdo-base carrega; cartões opcionais restritos exibem `—`; atalhos mostram só áreas permitidas. | Sem preview. |
| 2 | `/admin/developer/analytics` | `analytics` | Filtros, dados vazios e salvamento reversível da configuração. | Sem mídia; conferir gráficos. |
| 3 | `/admin/developer/coletas` | `collections` | Editor de botões e orientações; salvar/restaurar um bloco. | `/coletas` em Desktop/Tablet/Mobile. |
| 4 | `/admin/developer/contato-info` | `contact-page` | Alias redireciona para `fale-conosco` sob `/admin`. | Mesmo preview da rota 6. |
| 5 | `/admin/developer/cotacao` | `quote-page` | Canais, CTAs e orientações; salvar/restaurar um bloco. | `/cotacao` em Desktop/Tablet/Mobile. |
| 6 | `/admin/developer/fale-conosco` | `contact-page` | Canais, informações e CTA final; salvar/restaurar. | `/fale-conosco` em Desktop/Tablet/Mobile. |
| 7 | `/admin/developer/footer-links` | `footer-links` | Colunas, links e textos institucionais; ordem e estado vazio sem apagar conteúdo real. | Rodapé da Home em Desktop/Tablet/Mobile. |
| 8 | `/admin/developer/home` | `home` | Percorrer etapas e salvar/restaurar um bloco. Sem `units`, não listar vínculos globais nem bloquear a Home. | Home em Desktop/Tablet/Mobile; imagem e vídeo dos campos de mídia. |
| 9 | `/admin/developer/home-dna` | `home` | Alias redireciona para `/admin/developer/home#section-2`. | Conferir âncora na Home. |
| 10 | `/admin/developer/home-hero` | `home` | Alias redireciona para `/admin/developer/home#hero`. | Conferir âncora e mídia do hero. |
| 11 | `/admin/developer/imagens` | `images` | Biblioteca, slots, preview e upload image/vídeo da seção anterior. | Preview local e URL `/uploads/*`. |
| 12 | `/admin/developer/landing-pages` | `landing-pages` | Confirmar carregamento, ACL e navegação sob `/admin`; com os seis processos ativos, a lista vazia deve carregar sem `503`. Não criar, publicar ou despublicar campanha neste aceite. | Prévia e mídia são validadas no bloco Landing Builder. |
| 13 | `/admin/developer/leads` | `leads` | Filtros, paginação e estado sem resultados; não expor dados em captura. | Sem preview. |
| 14 | `/admin/developer/lgpd-cookies` | `cookies` | Texto, categorias e mensagem de sucesso após save reversível. | Banner de consentimento na Home em Desktop/Tablet/Mobile. |
| 15 | `/admin/developer/melhorias` | `improvements` | Alternar Pendentes/Concluídas/Arquivadas; conferir estado vazio e status. | `/melhoria-continua`; testar download de anexo de teste, se houver. |
| 16 | `/admin/developer/monitoramento-cookies` | `cookie-monitoring` | Filtros/paginação e estado sem consentimentos. | Sem preview. |
| 17 | `/admin/developer/navegacao` | `header-navigation` | Ordem, destino e destaque de um item reversível. | Abrir menu público e conferir o destino. |
| 18 | `/admin/developer/para-empresas` | `business-page` | CTA e FAQ; salvar/restaurar um bloco. | `/para-empresas` em Desktop/Tablet/Mobile. |
| 19 | `/admin/developer/popup-exit` | `popup` | Configuração e eventos carregam; sem `leads`, restringir somente contatos, não a configuração. | Popup em `/?preview=cms&popup-preview=1` e imagens desktop/mobile. |
| 20 | `/admin/developer/rastreamento` | `tracking` | Filtros de eventos e auditoria; conferir estado vazio. | Sem preview. |
| 21 | `/admin/developer/seo` | `seo` | Metadados e save reversível de uma rota. | Preview social e imagem OG interna. |
| 22 | `/admin/developer/servicos` | `services` | Módulos, CTA e FAQ; salvar/restaurar bloco. | `/servicos` em Desktop/Tablet/Mobile e imagem do módulo. |
| 23 | `/admin/developer/servicos-feedbacks` | `home` no destino | Alias termina em `/admin/developer/home#social-proof`; confirmar âncora e ACL da Home. | Conferir prova social no preview da Home. |
| 24 | `/admin/developer/setores` | administrador autenticado | Listar perfis e validar estado vazio/erro; criar/editar só setor descartável e autorizado. | Sem preview. |
| 25 | `/admin/developer/sobre` | `about-page` | Hero, governança e CTA; salvar/restaurar bloco. | `/sobre` em Desktop/Tablet/Mobile; mídia e certificados. |
| 26 | `/admin/developer/sobre-hero` | `about-page` | Alias redireciona para `/admin/developer/sobre`. | Conferir Hero no preview de Sobre. |
| 27 | `/admin/developer/trabalhe-conosco` | `careers-page` | Cultura, vagas e CTAs; salvar/restaurar bloco. | `/trabalhe-conosco` em Desktop/Tablet/Mobile; imagem de cultura. |
| 28 | `/admin/developer/unidades` | `units` | Listagem, ordem e formulário; alterar apenas unidade de teste ou restaurar dados originais. | Conferir reflexo público aplicável, sem assumir sincronização automática com cards da Home. |
| 29 | `/admin/developer/usuarios` | `users` | Listagem e estados de permissão. Criar/redefinir/excluir somente conta descartável autorizada; ações protegidas exigem owner/supremo ou permissão individual. | Sem preview. |
| 30 | `/admin/developer/vagas` | `careers-page` | Alias redireciona para `/admin/developer/trabalhe-conosco#jobs`. | Conferir âncora e vagas no preview de Carreiras. |

## Fechamento do gate

- [ ] Registrar no `states.md` os itens efetivamente validados e manter pendente apenas o que não foi executado.
- [ ] Não promover para produção nesta etapa. O rollout continua exigindo backup manual, janela autorizada, pré-flight dos quatro artefatos centrais, candidatos do Landing Builder e health de `6050`/`6051`/`41110`/`41112` e de `/admin/auth/entrar` pelo gateway.
- [ ] Registrar os cenários de criação, publicação, fallback por slug, mídia e prévias de campanhas somente no aceite próprio do Landing Builder.

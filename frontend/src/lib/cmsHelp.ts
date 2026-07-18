/**
 * Fonte única das ajudas exibidas no CMS.
 *
 * Ao criar ou alterar um controle do CMS, revise a entrada correspondente em
 * `CMS_HELP_TEMPLATES`. Cada ajuda importante explica função, origem, destino,
 * efeito do salvamento e, quando houver, o contrato técnico que a protege.
 * Campos e seções sem entrada recebem uma ficha padrão para que nenhum
 * controle fique sem contexto enquanto a tela evolui.
 */

export type CmsHelpKind = "page" | "section" | "field" | "metric" | "accordion";

export interface CmsHelpDetail {
  label: string;
  value: string;
  technical?: boolean;
}

export interface CmsHelpContent {
  title: string;
  summary: string;
  example: string;
  details: CmsHelpDetail[];
}

interface CmsHelpTemplate {
  title?: string;
  summary?: string;
  example?: string;
  details: CmsHelpDetail[];
}

const CMS_PAGE_NAMES: Record<string, string> = {
  "/developer": "Painel do CMS",
  "/developer/analytics": "Analytics",
  "/developer/cotacao": "Cotação",
  "/developer/coletas": "Coletas",
  "/developer/fale-conosco": "Fale Conosco",
  "/developer/footer-links": "Footer Links",
  "/developer/home": "Home",
  "/developer/home-dna": "Home — DNA",
  "/developer/home-hero": "Home — Hero",
  "/developer/imagens": "Imagens",
  "/developer/leads": "Leads",
  "/developer/lgpd-cookies": "LGPD e Cookies",
  "/developer/monitoramento-cookies": "Monitoramento de Cookies",
  "/developer/para-empresas": "Para Empresas",
  "/developer/popup-exit": "Popup de saída",
  "/developer/rastreamento": "Rastreamento",
  "/developer/seo": "SEO",
  "/developer/servicos": "Serviços",
  "/developer/servicos-feedbacks": "Serviços — Feedbacks",
  "/developer/sobre": "Sobre",
  "/developer/sobre-hero": "Sobre — Hero",
  "/developer/trabalhe-conosco": "Trabalhe Conosco",
  "/developer/unidades": "Unidades",
  "/developer/usuarios": "Usuários",
  "/developer/vagas": "Vagas",
};

const CMS_PUBLIC_DESTINATIONS: Record<string, string> = {
  "/developer/cotacao": "/cotacao",
  "/developer/coletas": "/coletas",
  "/developer/fale-conosco": "/fale-conosco",
  "/developer/footer-links": "o rodapé e as páginas institucionais",
  "/developer/home": "/",
  "/developer/home-dna": "/",
  "/developer/home-hero": "/",
  "/developer/lgpd-cookies": "o banner de cookies exibido no site",
  "/developer/para-empresas": "/para-empresas",
  "/developer/popup-exit": "o popup de saída do site",
  "/developer/servicos": "/servicos",
  "/developer/sobre": "/sobre",
  "/developer/trabalhe-conosco": "/trabalhe-conosco",
  "/developer/unidades": "as unidades exibidas no site",
  "/developer/vagas": "/trabalhe-conosco",
};

interface CmsHelpContext {
  destination: string;
  action: string;
  example: string;
}

const CMS_HELP_CONTEXTS: Record<string, CmsHelpContext> = {
  "/developer": { destination: "o painel inicial do CMS", action: "acompanha o conteúdo, acessos e indicadores do site", example: "Veja quantos itens são editáveis antes de entrar no módulo que deseja alterar." },
  "/developer/analytics": { destination: "os relatórios de Analytics, sem alterar a página pública", action: "consulta visualizações, eventos e integrações de medição", example: "Filtre por /servicos para saber quantas visitas essa página recebeu." },
  "/developer/cotacao": { destination: "/cotacao", action: "edita os textos, canais e chamadas da página de cotação", example: "Troque o texto “Solicitar cotação” pelo CTA que sua equipe utiliza." },
  "/developer/coletas": { destination: "/coletas", action: "edita os botões do hero da página de coleta", example: "Use “Solicitar coleta” com o link “#formulario-coleta” para levar o visitante ao formulário na própria página." },
  "/developer/fale-conosco": { destination: "/fale-conosco", action: "edita os canais e chamadas de contato", example: "Atualize o telefone ou o botão de WhatsApp que o visitante verá." },
  "/developer/footer-links": { destination: "o rodapé e as páginas institucionais", action: "edita links, textos institucionais e redes sociais", example: "Altere o link de Privacidade para levar o visitante à política correta." },
  "/developer/home": { destination: "a página inicial /", action: "edita os blocos principais da Home", example: "Troque uma imagem do hero para atualizar a primeira área vista pelo visitante." },
  "/developer/home-dna": { destination: "a seção de DNA da página inicial /", action: "edita o conteúdo institucional da Home", example: "Atualize um valor da empresa para ele aparecer na seção institucional da Home." },
  "/developer/home-hero": { destination: "o hero da página inicial /", action: "edita os slides e botões de abertura da Home", example: "Escolha uma nova imagem para o primeiro slide do site." },
  "/developer/imagens": { destination: "a Biblioteca de mídia e os slots de imagem do site", action: "faz upload, organiza mídia e vincula arquivos a áreas do site", example: "Troque a imagem do slot do popup sem mexer nas outras imagens da Biblioteca." },
  "/developer/leads": { destination: "a lista interna de contatos recebidos, sem alterar o site", action: "consulta e filtra leads enviados por formulários", example: "Pesquise um e-mail para localizar o contato enviado pelo formulário." },
  "/developer/lgpd-cookies": { destination: "o banner de cookies mostrado ao visitante", action: "edita os textos e as regras de consentimento", example: "Aumente a versão ao mudar a mensagem que o visitante precisa aceitar." },
  "/developer/monitoramento-cookies": { destination: "os registros internos de consentimento, sem alterar o site", action: "consulta as escolhas de cookies registradas", example: "Filtre por categoria Analytics para conferir os consentimentos relacionados." },
  "/developer/para-empresas": { destination: "/para-empresas", action: "edita a página voltada a clientes empresariais", example: "Atualize o CTA que leva empresas ao formulário de cotação." },
  "/developer/popup-exit": { destination: "o popup exibido quando o visitante tenta sair do site", action: "edita a mensagem, imagem e regras do popup", example: "Defina 24 horas de intervalo para não mostrar o popup repetidamente." },
  "/developer/rastreamento": { destination: "os registros internos de rastreamento, sem alterar o site", action: "consulta eventos e auditorias do CMS", example: "Filtre por /fale-conosco para ver eventos daquela página." },
  "/developer/seo": { destination: "os resultados de busca e compartilhamentos das páginas públicas", action: "edita títulos, descrições e metadados de busca", example: "Use “Serviços | Rodogarcia” como título da página /servicos no Google." },
  "/developer/servicos": { destination: "/servicos", action: "edita os cards e chamadas dos serviços", example: "Troque a foto do módulo de distribuição para atualizar somente esse card." },
  "/developer/servicos-feedbacks": { destination: "os feedbacks exibidos na seção de Serviços", action: "edita depoimentos e provas sociais", example: "Atualize o depoimento de um cliente sem alterar os cards de serviços." },
  "/developer/sobre": { destination: "/sobre", action: "edita a apresentação institucional da empresa", example: "Atualize a imagem de governança para ela aparecer na página Sobre." },
  "/developer/sobre-hero": { destination: "o hero da página /sobre", action: "edita a abertura da página Sobre", example: "Troque o título do hero para atualizar a primeira mensagem da página." },
  "/developer/trabalhe-conosco": { destination: "/trabalhe-conosco", action: "edita cultura, vagas e chamadas de carreira", example: "Atualize a foto de cultura para ela aparecer na página de carreiras." },
  "/developer/unidades": { destination: "as unidades exibidas no site", action: "edita endereço, contatos e dados de cada unidade", example: "Atualize o telefone de Campinas para o visitante ver o novo contato." },
  "/developer/usuarios": { destination: "as contas internas do CMS, sem alterar o site", action: "cria e administra acessos ao painel", example: "Crie uma conta para operacao@rodo... e escolha o perfil permitido." },
  "/developer/vagas": { destination: "as vagas de /trabalhe-conosco", action: "edita oportunidades de trabalho", example: "Crie a vaga “Motorista Carreteiro” para ela aparecer na página de carreiras." },
};

const CMS_HELP_TEMPLATES: Record<string, CmsHelpTemplate> = {
  "unidades.field.cnpj-para-cotacao": {
    title: "CNPJ para cotação",
    summary: "Aqui você informa o CNPJ que será enviado ao ESL quando o visitante escolher esta cidade na filial de /cotacao. O número não aparece para o visitante.",
    example: "Informe os 14 dígitos do CNPJ cadastrado para esta unidade no ESL.",
    details: [
      { label: "Onde é usado", value: "No seletor de filial do formulário público em /cotacao." },
      { label: "Proteção", value: "O backend resolve este CNPJ a partir da unidade escolhida; o navegador não recebe o número.", technical: true },
      { label: "Após salvar", value: "A cidade desta unidade passa a ficar disponível para cotação quando houver um CNPJ válido." },
    ],
  },
  "unidades.field.cep-generico-da-cidade": {
    title: "CEP genérico da cidade",
    summary: "Aqui você define o CEP de referência usado quando o visitante escolher apenas esta cidade em /cotacao. Ele ajuda a completar origem ou destino sem pedir um endereço completo.",
    example: "Use um CEP válido de referência da cidade, com 8 dígitos.",
    details: [
      { label: "Onde é usado", value: "No formulário público de /cotacao ao informar cidade e UF." },
      { label: "Importante", value: "Este CEP é uma referência municipal; não substitui o CEP exato de uma rua quando a operação precisar dele." },
      { label: "Após salvar", value: "A cidade configurada poderá preencher CEP e UF automaticamente para o visitante." },
    ],
  },
  "coletas.section.hero": {
    title: "Botões do hero de Coletas",
    summary: "Aqui você configura os dois botões no topo de /coletas. Um pode levar ao formulário desta página e o outro à cotação, para que o visitante escolha o próximo passo sem procurar no menu.",
    example: "Use “Solicitar coleta” com “#formulario-coleta” e “Solicitar cotação” com “/cotacao”.",
    details: [
      { label: "Onde aparece", value: "No hero, no topo da rota /coletas." },
      { label: "Primeiro botão", value: "Use a âncora #formulario-coleta para rolar até o formulário de coleta desta página." },
      { label: "Segundo botão", value: "Pode apontar para /cotacao ou outra rota interna, URL externa, telefone ou e-mail válido." },
      { label: "Validação", value: "Cada botão exige texto e link válido; o CMS sanitiza o endereço antes de publicar.", technical: true },
      { label: "Após salvar", value: "Os dois CTAs do hero de /coletas são atualizados sem alterar os campos do formulário." },
    ],
  },
  "cotacao.section.hero": {
    title: "Botões do hero de Cotação",
    summary: "Aqui você configura os dois botões no topo de /cotacao. Um pode levar ao formulário desta página e o outro à coleta, para orientar o visitante ao fluxo certo.",
    example: "Use “Solicitar cotação” com “#formulario-cotacao” e “Solicitar coleta” com “/coletas”.",
    details: [
      { label: "Onde aparece", value: "No hero, no topo da rota /cotacao." },
      { label: "Primeiro botão", value: "Use a âncora #formulario-cotacao para rolar até o formulário de cotação desta página." },
      { label: "Segundo botão", value: "Pode apontar para /coletas ou outro destino válido." },
      { label: "Após salvar", value: "Os CTAs exibidos no hero de /cotacao passam a usar os valores salvos aqui." },
    ],
  },
  "usuarios.section.criar-usuario": {
    title: "Criar usuário",
    summary: "Aqui você cria um acesso ao CMS e define uma senha temporária. A pessoa precisará criar a própria senha no primeiro login antes de acessar o painel.",
    details: [
      { label: "Quem pode criar", value: "O usuário supremo pode criar sempre. Um administrador comum só pode criar quando o supremo tiver marcado a permissão “Criar usuários” no menu de três pontos da conta." },
      { label: "Onde aparece", value: "O acesso é usado na tela /auth/entrar e, após a troca de senha, no painel /developer." },
      { label: "Senha temporária", value: "A senha definida aqui serve apenas para o primeiro login. O painel bloqueia o uso até que a pessoa informe uma nova senha forte.", technical: true },
      { label: "Após salvar", value: "A nova conta fica ativa e passa a exigir a troca da senha no próximo login." },
    ],
  },
  "usuarios.section.permissoes-de-usuarios": {
    title: "Permissões de usuários",
    summary: "Aqui o administrador supremo escolhe o que cada administrador comum pode fazer com outras contas. A alteração vale no painel assim que for salva.",
    details: [
      { label: "Onde ajustar", value: "Use os três pontos no card de cada administrador em /developer/usuarios." },
      { label: "Criar usuários", value: "Permite cadastrar novas contas com senha temporária; a pessoa criada ainda precisa trocar essa senha no primeiro acesso." },
      { label: "Excluir usuários", value: "Permite excluir contas que não sejam a conta suprema. A própria pessoa também não pode excluir a si mesma." },
      { label: "Proteção", value: "Somente o usuário supremo pode conceder, remover ou editar essas permissões; administradores com uma permissão não conseguem distribuir permissões para outras pessoas.", technical: true },
    ],
  },
  "dashboard.metric.itens-editaveis": {
    title: "Itens editáveis",
    details: [
      { label: "O que mostra", value: "A quantidade de blocos públicos que podem ser alterados pelo CMS." },
      { label: "Origem", value: "O painel soma os blocos carregados de conteúdo, páginas institucionais, footer e unidades." },
      { label: "Uso", value: "Serve para acompanhar a cobertura do CMS e identificar rapidamente as áreas administráveis." },
      { label: "Impacto", value: "É somente um indicador. Consultá-lo não grava nem altera nenhum conteúdo do site." },
    ],
  },
  "global.field.titulo": {
    details: [
      { label: "O que controla", value: "O título principal deste bloco." },
      { label: "De onde vem", value: "Do texto que você escreve neste campo." },
      { label: "Onde aparece", value: "No bloco que está sendo editado em {publicDestination}." },
      { label: "Após salvar", value: "O título visível nesse bloco de {publicDestination} é substituído." },
    ],
  },
  "global.field.descricao": {
    details: [
      { label: "O que controla", value: "O texto de apoio deste bloco." },
      { label: "De onde vem", value: "Do texto que você escreve neste campo." },
      { label: "Onde aparece", value: "Abaixo ou ao lado do conteúdo principal do bloco em {publicDestination}." },
      { label: "Após salvar", value: "A descrição visível nesse bloco de {publicDestination} é substituída." },
    ],
  },
  "global.field.texto": {
    details: [
      { label: "O que controla", value: "O texto visível desta ação ou bloco." },
      { label: "De onde vem", value: "Do texto que você escreve neste campo." },
      { label: "Onde aparece", value: "No rótulo ou conteúdo do bloco que está aberto em {publicDestination}." },
      { label: "Após salvar", value: "Muda somente esse texto em {publicDestination}; os demais campos do bloco permanecem iguais." },
    ],
  },
  "global.field.link": {
    details: [
      { label: "O que controla", value: "O destino acionado por este botão ou link." },
      { label: "De onde vem", value: "Do endereço que você informa neste campo." },
      { label: "Onde aparece", value: "No botão ou link do bloco aberto em {publicDestination}." },
      { label: "Após salvar", value: "O clique desse botão em {publicDestination} passa a abrir a rota, URL, telefone ou e-mail informado." },
      { label: "Formato aceito", value: "Rota interna, URL externa, mailto: ou tel:.", technical: true },
    ],
  },
  "global.field.url": {
    details: [
      { label: "O que é", value: "O endereço que o navegador deve abrir ou consultar para este item." },
      { label: "Onde é usado", value: "No botão, link, imagem, arquivo ou integração deste bloco em {publicDestination}." },
      { label: "O que o visitante vê", value: "A URL não aparece sozinha na página; ela define para onde o clique vai ou de onde o navegador carrega o recurso." },
      { label: "Após salvar", value: "Somente este item de {publicDestination} passa a usar o novo endereço." },
    ],
  },
  "global.field.imagem": {
    details: [
      { label: "O que controla", value: "A imagem exibida neste bloco." },
      { label: "Origem", value: "O arquivo é escolhido na Biblioteca de mídia interna." },
      { label: "Onde aparece", value: "No bloco visual que está sendo editado em {publicDestination}." },
      { label: "Após salvar", value: "A mídia selecionada substitui a imagem anterior somente nesse bloco." },
      { label: "Proteção", value: "Somente referências internas de mídia validadas podem ser salvas.", technical: true },
    ],
  },
  "global.field.arquivo": {
    details: [
      { label: "O que controla", value: "O arquivo de imagem ou vídeo usado por este bloco." },
      { label: "De onde vem", value: "Da Biblioteca de mídia do CMS ou de um upload validado. Imagens enviadas em PNG, JPG, AVIF ou WebP são gravadas como WebP otimizado; vídeos permanecem no formato de vídeo." },
      { label: "Onde aparece", value: "Na área visual do bloco que está aberto em {publicDestination}." },
      { label: "Após salvar", value: "A mídia anterior é substituída somente nessa área de {publicDestination}." },
    ],
  },
  "global.field.arquivo-selecionado": {
    details: [
      { label: "O que controla", value: "O arquivo de imagem ou vídeo já escolhido para este bloco." },
      { label: "De onde vem", value: "Da Biblioteca de mídia interna ou de um upload feito pelo CMS. Imagens novas são convertidas para WebP otimizado antes de entrarem na Biblioteca." },
      { label: "Onde aparece", value: "No espaço visual ligado a este formulário em {publicDestination}." },
      { label: "Após salvar", value: "Troca somente a mídia deste bloco de {publicDestination}; os demais blocos continuam iguais." },
      { label: "Proteção", value: "O CMS aceita apenas referências internas de mídia que passaram pela validação.", technical: true },
    ],
  },
  "global.field.texto-alternativo": {
    summary: "Aqui você explica, em poucas palavras, o que há na imagem. Essa descrição ajuda pessoas que usam leitor de tela e pode aparecer se a imagem não carregar.",
    example: "Em uma foto de caminhão: “Caminhão Rodogarcia carregando mercadorias no pátio”.",
    details: [
      { label: "O que é", value: "Uma descrição curta e objetiva da imagem." },
      { label: "Para quem serve", value: "Leitores de tela leem esse texto para pessoas que não conseguem enxergar a imagem." },
      { label: "Se a imagem falhar", value: "O navegador pode mostrar este texto no lugar da imagem enquanto o arquivo não é carregado." },
      { label: "Como preencher", value: "Descreva o que é importante na imagem; não repita palavras decorativas nem use o nome do arquivo." },
      { label: "Após salvar", value: "A descrição passa a acompanhar a imagem deste bloco na página pública." },
    ],
  },
  "global.field.texto-alternativo-da-imagem": {
    title: "Texto alternativo",
    summary: "Aqui você descreve a imagem para quem não consegue vê-la. O texto acompanha a foto e pode aparecer se o arquivo não carregar.",
    example: "Para uma foto institucional: “Motorista Rodogarcia ao lado do caminhão de transporte”.",
    details: [
      { label: "O que é", value: "Uma descrição curta e objetiva da imagem selecionada neste bloco." },
      { label: "Para quem serve", value: "Leitores de tela usam esse texto para explicar a imagem a pessoas com deficiência visual." },
      { label: "Se a imagem falhar", value: "O navegador pode usar esta descrição no lugar da imagem enquanto o arquivo não é carregado." },
      { label: "Como preencher", value: "Explique o conteúdo importante da imagem, como “Caminhão Rodogarcia em operação”, sem citar o nome do arquivo." },
      { label: "Após salvar", value: "Atualiza a descrição acessível da imagem; não troca o arquivo nem muda o layout." },
    ],
  },
  "global.field.enquadramento-da-imagem": {
    details: [
      { label: "O que controla", value: "A parte da imagem que permanece visível quando o card precisa recortar o arquivo." },
      { label: "Onde aparece", value: "No card ou bloco visual que usa esta imagem em {publicDestination}." },
      { label: "Como escolher", value: "Escolha Topo, Base, Esquerda ou Direita quando o assunto principal estiver fora do centro." },
      { label: "Após salvar", value: "Muda apenas o corte visual; o arquivo original não é alterado." },
    ],
  },
  "global.field.ativo": {
    details: [
      { label: "O que controla", value: "A disponibilidade deste item no site." },
      { label: "Origem", value: "O estado é definido por esta chave no CMS." },
      { label: "Destino", value: "A listagem ou bloco público que usa este item." },
      { label: "Após salvar", value: "O item aparece quando está ativo e fica oculto quando desativado." },
    ],
  },
  "global.section.configuracoes": {
    details: [
      { label: "O que reúne", value: "Os campos que editam uma mesma parte da tela atual." },
      { label: "De onde vêm", value: "Dos valores preenchidos ou selecionados dentro desta seção." },
      { label: "Onde aparecem", value: "Na parte do site ou do painel explicada pelo título desta seção." },
      { label: "Após salvar", value: "As mudanças afetam somente essa parte; elas não alteram as demais seções." },
    ],
  },
  "analytics.field.eventos-internos-ativos": {
    title: "Eventos internos ativos",
    summary: "Liga ou desliga a coleta de eventos feita pelo próprio site. Quando desligado, o site para de registrar as ações de navegação nesta área.",
    details: [
      { label: "O que registra", value: "Interações como páginas visitadas, cliques, tempo de navegação e marcos de rolagem." },
      { label: "Quando desligar", value: "Use somente se quiser pausar a coleta interna de métricas. Os registros já existentes não são apagados." },
      { label: "Após salvar", value: "A próxima navegação deixa de gerar eventos internos enquanto esta opção estiver desativada." },
    ],
  },
  "analytics.field.marcos-de-scroll": {
    title: "Marcos de scroll (%)",
    summary: "Define em quais pontos da rolagem da página o site registra que o visitante chegou.",
    details: [
      { label: "Como preencher", value: "Informe porcentagens separadas por vírgula, como 25,50,75,100." },
      { label: "O que significa", value: "Com 25,50,75,100, o site registra quando a pessoa alcança 25%, 50%, 75% e 100% da página." },
      { label: "Limite", value: "São aceitos somente números maiores que 0 e até 100; valores repetidos são mantidos uma única vez.", technical: true },
      { label: "Após salvar", value: "Os próximos eventos de rolagem usam os novos pontos definidos." },
    ],
  },
  "analytics.field.ga4": {
    title: "GA4",
    summary: "Ativa o envio das métricas do site para o Google Analytics 4.",
    details: [
      { label: "O que faz", value: "Compartilha os eventos e métricas coletados com a propriedade configurada no Google Analytics." },
      { label: "Para funcionar", value: "Informe um Measurement ID válido antes de ativar esta opção." },
      { label: "Após salvar", value: "O provedor passa a carregar somente quando houver o consentimento de Analytics permitido pelo visitante." },
    ],
  },
  "analytics.field.measurement-id": {
    title: "Measurement ID",
    summary: "É o código da sua propriedade do Google Analytics 4; ele diz para qual conta as métricas devem ser enviadas.",
    details: [
      { label: "Formato", value: "Use o identificador exibido no Google Analytics, por exemplo G-ABC123XYZ.", technical: true },
      { label: "Onde encontrar", value: "No fluxo de dados da propriedade GA4 que receberá as métricas do site." },
      { label: "Validação", value: "O CMS só permite ativar o GA4 com um identificador no formato aceito pelo Google.", technical: true },
    ],
  },
  "analytics.field.clarity": {
    title: "Clarity",
    summary: "Ativa o envio de dados para o Microsoft Clarity, usado para entender como os visitantes navegam pelo site.",
    details: [
      { label: "O que permite analisar", value: "Mapas de calor, cliques e gravações de sessões disponibilizados pelo Microsoft Clarity." },
      { label: "Para funcionar", value: "Informe o Project ID do projeto criado no Microsoft Clarity antes de ativar esta opção." },
      { label: "Após salvar", value: "O Clarity passa a carregar somente quando houver o consentimento de Analytics permitido pelo visitante." },
    ],
  },
  "analytics.field.project-id": {
    title: "Project ID",
    summary: "É o código que identifica o seu projeto no Microsoft Clarity e recebe os dados de navegação do site.",
    details: [
      { label: "Onde encontrar", value: "Nas configurações do projeto criado no painel do Microsoft Clarity." },
      { label: "Formato", value: "Use somente letras e números, com 6 a 80 caracteres.", technical: true },
      { label: "Validação", value: "O CMS não permite ativar o Clarity com um código fora desse formato.", technical: true },
    ],
  },
  "analytics.field.salvar-configuracao": {
    title: "Salvar configuração",
    summary: "Grava as alterações feitas nos eventos internos, GA4 e Clarity.",
    details: [
      { label: "O que salva", value: "Os estados de ativação, os marcos de scroll e os códigos dos provedores externos." },
      { label: "Antes de salvar", value: "Se GA4 ou Clarity estiverem ativos, informe os respectivos identificadores em um formato válido." },
      { label: "Resultado", value: "As novas configurações passam a valer para as próximas visitas e eventos do site." },
    ],
  },
  "analytics.field.atualizar-metricas": {
    title: "Atualizar métricas",
    summary: "Busca novamente os dados de Analytics para atualizar os números exibidos nesta tela.",
    details: [
      { label: "O que atualiza", value: "Estatísticas, eventos, páginas mais acessadas, conversões e dados de heatmap do período selecionado." },
      { label: "O que não faz", value: "Não altera as configurações nem apaga registros; apenas recarrega os números mostrados." },
    ],
  },
  "analytics.section.top-paginas-do-periodo": {
    title: "Top páginas do período",
    summary: "Mostra quais páginas receberam mais visitas durante o período selecionado. Quanto maior o número, mais acessada foi a página.",
    details: [
      { label: "Como ler", value: "A rota / é a página inicial; /servicos é a página de serviços; /sobre é a página institucional." },
      { label: "Período", value: "Use o seletor de dias no topo da tela e Atualizar para consultar outro intervalo." },
    ],
  },
  "analytics.section.contagem-por-tipo": {
    title: "Contagem por tipo",
    summary: "Mostra quantas vezes cada tipo de ação aconteceu no site durante o período selecionado.",
    details: [
      { label: "page_view", value: "Uma página foi aberta." },
      { label: "time_on_page", value: "O tempo de permanência em uma página foi registrado." },
      { label: "session_end", value: "Uma visita terminou." },
      { label: "scroll", value: "A pessoa chegou a algum marco de rolagem configurado." },
      { label: "click", value: "Houve um clique monitorado." },
    ],
  },
  "analytics.section.eventos-recentes": {
    title: "Eventos recentes",
    summary: "Mostra os últimos eventos que o site recebeu dos visitantes.",
    details: [
      { label: "O que você vê", value: "O que aconteceu, em qual página, quando e a visita anônima associada ao evento." },
      { label: "Exemplos", value: "page_view abre uma página; click registra um clique; scroll registra rolagem; time_on_page registra tempo; session_end marca o fim da visita." },
    ],
  },
  "analytics.field.filtrar-tipo": {
    title: "Filtrar tipo",
    summary: "Mostra somente os eventos do tipo informado.",
    details: [
      { label: "Como usar", value: "Digite, por exemplo, page_view para ver páginas abertas ou click para ver cliques." },
      { label: "Resultado", value: "A tabela é filtrada na hora; apagar o texto volta a mostrar todos os tipos." },
    ],
  },
  "analytics.field.filtrar-pagina": {
    title: "Filtrar página",
    summary: "Mostra somente os eventos ocorridos na página informada.",
    details: [
      { label: "Como usar", value: "Digite uma rota como /servicos para consultar apenas os eventos dessa página." },
      { label: "Resultado", value: "A tabela é filtrada na hora; apagar o texto volta a mostrar todas as páginas." },
    ],
  },
  "analytics.field.evento": {
    title: "Evento",
    summary: "Mostra o que aconteceu durante a navegação do visitante.",
    details: [
      { label: "Tipos comuns", value: "page_view significa abertura de página; click, um clique; scroll, uma rolagem; time_on_page, tempo na página; session_end, fim da visita." },
    ],
  },
  "analytics.field.pagina": {
    title: "Página",
    summary: "Mostra em qual página do site o evento aconteceu.",
    details: [
      { label: "Formato", value: "É a rota do site, como /, /servicos ou /sobre." },
    ],
  },
  "analytics.field.data": {
    title: "Data",
    summary: "Mostra quando o evento foi registrado pelo site.",
    details: [
      { label: "Formato", value: "A tabela exibe dia, mês, ano, hora e minuto no horário local." },
    ],
  },
  "analytics.field.sessao": {
    title: "Sessão",
    summary: "Identifica uma visita anônima durante a navegação; não identifica a pessoa visitante.",
    details: [
      { label: "Para que serve", value: "Agrupa os eventos feitos na mesma visita para ajudar a entender a sequência de navegação." },
    ],
  },
  "analytics.section.resumo-de-resultados": {
    title: "Resumo de resultados",
    summary: "Mostra as ações importantes concluídas pelos visitantes no período selecionado.",
    details: [
      { label: "Formulários concluídos", value: "Quantidade de formulários enviados." },
      { label: "Downloads", value: "Quantidade de arquivos baixados." },
      { label: "Leads", value: "Quantidade de contatos que se tornaram possíveis clientes." },
      { label: "Envios do popup", value: "Quantidade de formulários enviados pelo popup." },
      { label: "Total", value: "Soma de todas as conversões mostradas nesta área." },
    ],
  },
  "fale-conosco.section.botao-whatsapp": {
    title: "Botão WhatsApp do hero",
    summary: "Aqui você configura o botão de WhatsApp que fica no topo da página Fale Conosco. Você escolhe o texto e o destino do clique; depois de salvar, esse botão é atualizado no site.",
    example: "Texto “Falar com a Rodogarcia no WhatsApp” e link “https://wa.me/5511999999999”.",
    details: [
      { label: "O que controla", value: "A chamada principal de WhatsApp exibida no hero da página Fale Conosco." },
      { label: "Origem", value: "O CMS salva estes dados no campo técnico contactPage.heroWhatsappButton.", technical: true },
      { label: "Onde aparece", value: "No topo de /fale-conosco, antes dos canais de atendimento." },
      { label: "Texto", value: "É o rótulo visível do botão. Mantenha uma ação clara e curta para caber no hero." },
      { label: "Link", value: "É o destino aberto quando o visitante seleciona o botão; pode apontar para uma rota, telefone, e-mail ou URL do WhatsApp." },
      { label: "Validação", value: "O salvamento exige texto e endereço válidos; o serviço sanitiza a URL antes de publicar.", technical: true },
      { label: "Após salvar", value: "Substitui somente este CTA do hero, sem alterar os demais canais ou o CTA final." },
    ],
  },
  "fale-conosco.field.hero-whatsapp-texto": {
    title: "Texto do botão WhatsApp",
    summary: "Aqui você escreve o texto que o visitante verá no botão de WhatsApp no topo da página Fale Conosco. Isso muda somente o nome do botão, não o destino do clique.",
    example: "Use “Falar com a Rodogarcia no WhatsApp” para deixar clara a ação do botão.",
    details: [
      { label: "O que controla", value: "O rótulo mostrado no botão do hero de Fale Conosco." },
      { label: "Onde aparece", value: "No CTA principal acima dos canais de atendimento da rota /fale-conosco." },
      { label: "Limite", value: "Até 40 caracteres para preservar a leitura em telas menores.", technical: true },
      { label: "Após salvar", value: "Altera apenas o texto do botão; o destino do clique é configurado separadamente no Link." },
    ],
  },
  "fale-conosco.field.hero-whatsapp-link": {
    title: "Link do botão WhatsApp",
    summary: "Aqui você informa para onde o botão de WhatsApp deve levar o visitante. Depois de salvar, somente o clique desse botão passa a abrir o novo endereço.",
    example: "Para abrir uma conversa, use “https://wa.me/5511999999999”.",
    details: [
      { label: "O que controla", value: "O destino do clique no botão WhatsApp do hero." },
      { label: "Onde aparece", value: "No CTA principal da rota /fale-conosco." },
      { label: "Formato aceito", value: "Rota interna, URL externa, mailto: ou tel:. Para WhatsApp, use uma URL válida do serviço.", technical: true },
      { label: "Validação", value: "O CMS rejeita valores sem endereço válido antes de gravar o conteúdo.", technical: true },
      { label: "Após salvar", value: "Altera apenas o destino deste CTA; não muda texto, canais ou botões do CTA final." },
    ],
  },
  "servicos.field.arquivo-selecionado": {
    title: "Imagem do módulo de Serviços",
    summary: "Aqui você escolhe a foto que será mostrada no card do serviço aberto. Depois de salvar, só esse card em /servicos recebe a nova imagem.",
    example: "No serviço de distribuição, escolha uma foto de caminhão em operação na Biblioteca de mídia.",
    details: [
      { label: "O que controla", value: "A imagem principal do módulo de serviço que está aberto neste editor." },
      { label: "De onde vem", value: "Da Biblioteca de mídia interna ou de um upload validado pelo CMS." },
      { label: "Onde aparece", value: "No card visual do módulo correspondente na página pública /servicos." },
      { label: "Após salvar", value: "Troca a imagem apenas desse módulo; os outros cards de serviços não são alterados." },
      { label: "Proteção", value: "Links externos e arquivos inexistentes não podem ser gravados nesse campo.", technical: true },
    ],
  },
  "servicos.field.texto-alternativo-da-imagem": {
    title: "Texto alternativo da imagem do serviço",
    summary: "Aqui você conta o que aparece na foto do serviço. Essa frase ajuda leitores de tela e pode ser exibida se a imagem não carregar; ela não troca a foto nem muda o card.",
    example: "Para a foto de entrega, escreva “Caminhão Rodogarcia saindo para distribuição”.",
    details: [
      { label: "O que é", value: "A descrição acessível da imagem principal do módulo de serviço aberto." },
      { label: "Para quem serve", value: "Leitores de tela informam essa descrição a visitantes que não conseguem ver a imagem." },
      { label: "Se a imagem falhar", value: "O navegador pode apresentar esse texto no lugar da imagem enquanto ela não carregar." },
      { label: "Onde aparece", value: "Associado à imagem do card correspondente na página pública /servicos." },
      { label: "Como escrever", value: "Descreva a cena ou informação relevante da imagem. Exemplo: “Caminhão em rota de distribuição”." },
      { label: "Após salvar", value: "Atualiza somente a descrição acessível da imagem; não altera a foto, o recorte ou o texto do serviço." },
    ],
  },
  "servicos.field.enquadramento-da-imagem": {
    title: "Enquadramento da imagem do serviço",
    summary: "Aqui você escolhe qual parte da foto deve continuar aparecendo quando o card recorta a imagem. Isso muda o corte mostrado no site, sem alterar o arquivo original.",
    example: "Se o caminhão estiver no alto da foto, escolha “Topo” para ele não ser cortado.",
    details: [
      { label: "O que controla", value: "O ponto da foto que o card de serviço prioriza quando precisa fazer um recorte." },
      { label: "Onde aparece", value: "Na imagem do módulo aberto da página pública /servicos." },
      { label: "Como escolher", value: "Use Topo, Base, Esquerda ou Direita quando o caminhão, pessoa ou objeto principal não estiver no centro." },
      { label: "Após salvar", value: "Muda o recorte mostrado no card, mas não edita nem substitui o arquivo original." },
    ],
  },
};

function normalizeHelpSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPageName(pathname: string) {
  return CMS_PAGE_NAMES[pathname] ?? "esta área do CMS";
}

function getPublicDestination(pathname: string) {
  return CMS_PUBLIC_DESTINATIONS[pathname] ?? CMS_HELP_CONTEXTS[pathname]?.destination ?? "esta área do CMS";
}

function getHelpContext(pathname: string): CmsHelpContext {
  return CMS_HELP_CONTEXTS[pathname] ?? {
    destination: "esta área do CMS",
    action: "edita as informações disponíveis nesta tela",
    example: "Escolha um campo desta tela e confira o resultado indicado ao lado dele.",
  };
}

function resolveTemplateDetails(details: CmsHelpDetail[], publicDestination: string) {
  return details.map((detail) => ({
    ...detail,
    value: detail.value.replaceAll("{publicDestination}", publicDestination),
  }));
}

function resolveTemplateSummary(summary: string | undefined, label: string, publicDestination: string) {
  if (summary) return summary.replaceAll("{publicDestination}", publicDestination);
  return `Aqui você ajusta “${label}” do bloco que está editando. Depois de salvar, essa informação será usada nesse bloco de ${publicDestination}.`;
}

function getDefaultExample(label: string, publicDestination: string) {
  const normalizedLabel = normalizeHelpSegment(label);

  if (normalizedLabel.includes("titulo")) {
    return "Exemplo: use “Logística que acompanha o seu negócio” como título de uma seção.";
  }
  if (normalizedLabel.includes("descricao") || normalizedLabel.includes("texto")) {
    return "Exemplo: escreva “Fale com nosso time para encontrar a melhor solução para sua operação”.";
  }
  if (normalizedLabel.includes("link") || normalizedLabel.includes("url")) {
    return "Exemplo: para abrir a página de contato, use “/fale-conosco”; para WhatsApp, use uma URL no formato “https://wa.me/5511999999999”.";
  }
  if (normalizedLabel.includes("arquivo") || normalizedLabel.includes("imagem") || normalizedLabel.includes("midia")) {
    return "Exemplo: escolha na Biblioteca uma foto de caminhão ou operação que represente este bloco.";
  }
  if (normalizedLabel.includes("ativo") || normalizedLabel.includes("visibilidade")) {
    return "Exemplo: deixe ativo para mostrar o item no site; desative para ocultá-lo sem apagá-lo.";
  }

  return `Exemplo: preencha “${label}” com a informação real que sua equipe usa e confira o resultado em ${publicDestination}.`;
}

function resolveTemplateExample(example: string | undefined, label: string, publicDestination: string) {
  return example?.replaceAll("{publicDestination}", publicDestination) ?? getDefaultExample(label, publicDestination);
}

function getFieldFallback(label: string, context: CmsHelpContext): Omit<CmsHelpContent, "title"> {
  const normalizedLabel = normalizeHelpSegment(label);
  const baseDetails: CmsHelpDetail[] = [
    { label: "Tela", value: context.destination },
    { label: "De onde vem", value: "Do valor que você preenche ou escolhe neste campo." },
  ];

  if (normalizedLabel.includes("titulo") || normalizedLabel.includes("eyebrow") || normalizedLabel.includes("badge")) {
    return {
      summary: `Aqui você escreve o título ou pequeno destaque que o visitante lê em ${context.destination}. Depois de salvar, só esse texto é atualizado.`,
      example: "Exemplo: use “Logística que acompanha o seu negócio” como título de uma seção.",
      details: [...baseDetails, { label: "Onde aparece", value: `No cabeçalho ou destaque do bloco editado em ${context.destination}.` }, { label: "Após salvar", value: "O texto antigo desse cabeçalho é substituído." }],
    };
  }
  if (normalizedLabel.includes("descricao") || normalizedLabel.includes("texto") || normalizedLabel.includes("depoimento") || normalizedLabel.includes("resposta") || normalizedLabel.includes("pergunta")) {
    return {
      summary: `Aqui você escreve o texto que o visitante vai ler em ${context.destination}. Salvar troca somente essa frase, descrição ou resposta.`,
      example: "Exemplo: escreva “Fale com nosso time para encontrar a melhor solução para sua operação”.",
      details: [...baseDetails, { label: "Onde aparece", value: `No texto do bloco que está aberto em ${context.destination}.` }, { label: "Após salvar", value: "O texto anterior desse bloco é substituído." }],
    };
  }
  if (normalizedLabel.includes("link") || normalizedLabel.includes("url") || normalizedLabel.includes("canonical")) {
    return {
      summary: `Aqui você define para onde o visitante será levado ao clicar ou qual endereço o navegador deve usar em ${context.destination}.`,
      example: "Exemplo: use “/fale-conosco” para levar ao contato ou “https://wa.me/5511999999999” para abrir o WhatsApp.",
      details: [...baseDetails, { label: "Onde é usado", value: `No botão, link ou referência ligada a este campo em ${context.destination}.` }, { label: "Após salvar", value: "Somente esse destino passa a usar o novo endereço." }],
    };
  }
  if (normalizedLabel.includes("arquivo") || normalizedLabel.includes("imagem") || normalizedLabel.includes("midia") || normalizedLabel.includes("video") || normalizedLabel.includes("poster")) {
    return {
      summary: `Aqui você escolhe a mídia mostrada em ${context.destination}. Salvar troca a imagem ou vídeo apenas no bloco que está aberto.`,
      example: "Exemplo: escolha uma foto de caminhão em operação na Biblioteca de mídia para representar este bloco.",
      details: [...baseDetails, { label: "Onde aparece", value: `Na área visual ligada a este campo em ${context.destination}.` }, { label: "Após salvar", value: "A mídia anterior desse bloco é substituída; as demais não mudam." }],
    };
  }
  if (normalizedLabel.includes("cor")) {
    return {
      summary: `Aqui você escolhe a cor usada por este elemento em ${context.destination}. Isso muda só o visual, não o texto nem o destino do botão.`,
      example: "Exemplo: use “#1D4ED8” para aplicar o azul institucional da Rodogarcia.",
      details: [...baseDetails, { label: "Onde aparece", value: `No botão, selo ou elemento visual ligado a este campo em ${context.destination}.` }, { label: "Após salvar", value: "A cor desse elemento é atualizada." }],
    };
  }
  if (normalizedLabel.includes("ativo") || normalizedLabel.includes("status") || normalizedLabel.includes("visibilidade") || normalizedLabel.includes("banner")) {
    return {
      summary: `Aqui você decide se este item fica visível ou disponível em ${context.destination}. Desativar esconde o item, mas não apaga os dados preenchidos.`,
      example: "Exemplo: deixe ativo para mostrar o card no site; desative para ocultá-lo temporariamente.",
      details: [...baseDetails, { label: "Onde aparece", value: `Na lista ou bloco ligado a este item em ${context.destination}.` }, { label: "Após salvar", value: "O item aparece quando ativo e fica oculto quando desativado." }],
    };
  }
  if (normalizedLabel.includes("email") || normalizedLabel.includes("telefone") || normalizedLabel.includes("endereco") || normalizedLabel.includes("cidade") || normalizedLabel.includes("uf") || normalizedLabel.includes("contato")) {
    return {
      summary: `Aqui você informa o dado de contato ou localização que o visitante poderá usar em ${context.destination}.`,
      example: "Exemplo: telefone “(11) 99999-9999” ou e-mail “contato@rodo...”.",
      details: [...baseDetails, { label: "Onde aparece", value: `Na área de contato, unidade ou canal correspondente em ${context.destination}.` }, { label: "Após salvar", value: "O dado antigo desse contato é substituído." }],
    };
  }
  if (normalizedLabel.includes("delay") || normalizedLabel.includes("cooldown") || normalizedLabel.includes("exibicoes") || normalizedLabel.includes("marcos")) {
    return {
      summary: `Aqui você ajusta uma regra de tempo, frequência ou medição desta área. Ela controla quando ou quantas vezes o comportamento acontece.`,
      example: "Exemplo: defina 24 horas de intervalo para não mostrar o popup novamente ao mesmo visitante.",
      details: [...baseDetails, { label: "Onde é usado", value: `Na regra configurada nesta tela para ${context.destination}.` }, { label: "Após salvar", value: "A nova regra passa a valer nas próximas interações." }],
    };
  }

  return {
    summary: `Aqui você preenche “${label}”, uma informação usada nesta tela para ${context.action}.`,
    example: context.example,
    details: [...baseDetails, { label: "Onde é usado", value: `Na parte de ${context.destination} relacionada a “${label}”.` }, { label: "Após salvar", value: "A informação deste campo é atualizada sem alterar os demais campos." }],
  };
}

function getSectionFallback(label: string, context: CmsHelpContext): Omit<CmsHelpContent, "title"> {
  const normalizedLabel = normalizeHelpSegment(label);
  const isButton = normalizedLabel.includes("botao") || normalizedLabel.includes("cta");
  const isMedia = normalizedLabel.includes("imagem") || normalizedLabel.includes("midia") || normalizedLabel.includes("video");
  const isFaq = normalizedLabel.includes("faq") || normalizedLabel.includes("pergunta");
  const summary = isButton
    ? `Aqui você configura o texto e o destino de um botão usado em ${context.destination}.`
    : isMedia
      ? `Aqui você escolhe e ajusta a mídia que será mostrada em ${context.destination}.`
      : isFaq
        ? `Aqui você edita as perguntas e respostas que o visitante pode ler em ${context.destination}.`
        : `Aqui você edita “${label}”, uma parte de ${context.destination}.`;

  return {
    summary: `${summary} Depois de salvar, apenas esta seção é atualizada.`,
    example: isButton
      ? "Exemplo: escreva “Solicitar cotação” e use “/cotacao” como destino do botão."
      : isMedia
        ? "Exemplo: selecione uma foto de caminhão em operação na Biblioteca de mídia."
        : isFaq
          ? "Exemplo: pergunta “Como solicito uma cotação?” e resposta “Preencha o formulário e nosso time retorna”."
          : context.example,
    details: [
      { label: "Tela", value: context.destination },
      { label: "O que reúne", value: `Os campos necessários para editar “${label}”.` },
      { label: "Após salvar", value: `A mudança aparece apenas nessa parte de ${context.destination}.` },
    ],
  };
}

export function getCmsHelp(
  pathname: string,
  label: string,
  kind: CmsHelpKind = "field",
  templateKey?: string,
): CmsHelpContent {
  const normalizedLabel = normalizeHelpSegment(label);
  const routeKey = pathname.replace(/^\/developer\/?/, "").replace(/\//g, ".") || "dashboard";
  const template =
    (templateKey ? CMS_HELP_TEMPLATES[`${routeKey}.${kind}.${templateKey}`] : undefined) ??
    CMS_HELP_TEMPLATES[`${routeKey}.${kind}.${normalizedLabel}`] ??
    CMS_HELP_TEMPLATES[`global.${kind}.${normalizedLabel}`];
  const pageName = getPageName(pathname);
  const publicDestination = getPublicDestination(pathname);
  const context = getHelpContext(pathname);

  if (template) {
    return {
      title: template.title ?? label,
      summary: resolveTemplateSummary(template.summary, label, publicDestination),
      example: resolveTemplateExample(template.example, label, publicDestination),
      details: [
        { label: "Tela", value: `${pageName} (${pathname})`, technical: true },
        ...resolveTemplateDetails(template.details, publicDestination),
      ],
    };
  }

  if (kind === "page") {
    return {
      title: pageName,
      summary: `Nesta tela você ${context.action}. Depois de salvar, a mudança aparece em ${context.destination} quando esta tela controla conteúdo público.`,
      example: context.example,
      details: [
        { label: "O que reúne", value: `Os controles usados para ${context.action}.` },
        { label: "Onde aparece", value: context.destination },
        { label: "Após salvar", value: "A alteração fica disponível depois do salvamento." },
      ],
    };
  }

  if (kind === "section" || kind === "accordion") {
    const fallback = getSectionFallback(label, context);
    return {
      title: label,
      ...fallback,
    };
  }

  const fallback = getFieldFallback(label, context);
  return {
    title: label,
    ...fallback,
  };
}

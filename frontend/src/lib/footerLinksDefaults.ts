import type { FooterLinksContent, PageButton } from "@/types/content";
import { external, site } from "@/lib/routes";

const emailButton: PageButton = {
  label: "Enviar e-mail",
  url: external.commercialEmail,
  external: true,
};

const contactButton: PageButton = {
  label: "Abrir contato",
  url: site.contact,
};

export const DEFAULT_FOOTER_LINKS: FooterLinksContent = {
  footer: {
    description:
      "Estruturamos operações de transporte, distribuição e rastreabilidade com consistência e cobertura nacional.",
    proposalButton: { label: "Receber proposta", url: site.quote },
    supportButton: { label: "Falar com atendimento", url: site.contact },
    columns: [
      {
        id: "services",
        order: 1,
        title: "Serviços",
        links: [
          { id: "services-road", order: 1, label: "Transporte rodoviário", url: site.services },
          { id: "services-quote", order: 2, label: "Solicitar cotação", url: site.quote },
          { id: "services-collection", order: 3, label: "Solicitar coleta", url: site.collections },
          { id: "services-tracking", order: 4, label: "Rastrear encomenda", url: external.tracking, external: true },
          { id: "services-business", order: 5, label: "Para empresas", url: site.business },
        ],
      },
      {
        id: "company",
        order: 2,
        title: "Empresa",
        links: [
          { id: "company-home", order: 1, label: "Início", url: site.home },
          { id: "company-about", order: 2, label: "Sobre a Rodogarcia", url: site.about },
          { id: "company-careers", order: 3, label: "Carreiras", url: site.careers },
          { id: "company-press", order: 4, label: "Imprensa", url: site.press },
          { id: "company-voice", order: 5, label: "Sua Voz", url: site.voice },
          { id: "company-terms", order: 6, label: "Termos de uso", url: site.terms },
        ],
      },
      {
        id: "resources",
        order: 3,
        title: "Recursos",
        links: [
          { id: "resources-help", order: 1, label: "Central de ajuda", url: site.help },
          { id: "resources-privacy", order: 2, label: "Privacidade de dados", url: site.privacy },
          { id: "resources-contact", order: 3, label: "Atendimento comercial", url: site.contact },
          { id: "resources-email", order: 4, label: "E-mail comercial", url: external.commercialEmail, external: true },
          { id: "resources-phone", order: 5, label: external.phoneDisplay, url: external.phoneHref, external: true },
        ],
      },
    ],
    serviceHoursTitle: "Horário de atendimento",
    serviceHours: [
      "Segunda a sexta: 08:00 às 18:00",
      "Sábado: 08:00 às 12:00",
      "Domingo e feriados: fechado",
    ],
    socialTitle: "Redes sociais",
    socialLinks: [
      { id: "social-instagram", order: 1, icon: "InstagramLogo", label: "Instagram", url: "#" },
      { id: "social-linkedin", order: 2, icon: "LinkedinLogo", label: "LinkedIn", url: "#" },
      { id: "social-facebook", order: 3, icon: "FacebookLogo", label: "Facebook", url: "#" },
      { id: "social-whatsapp", order: 4, icon: "WhatsappLogo", label: "WhatsApp", url: "#" },
    ],
    bottomLinks: [
      { id: "bottom-terms", order: 1, label: "Termos de uso", url: site.terms },
      { id: "bottom-privacy", order: 2, label: "Privacidade", url: site.privacy },
      { id: "bottom-voice", order: 3, label: "Sua Voz", url: site.voice },
    ],
    copyrightText: "Rodogarcia Transportes. Todos os direitos reservados.",
    locationText: "Agudos, SP - Cobertura nacional",
    creditText: "Feito por Lucas Andrade @valentelucass",
    creditUrl: "https://www.linkedin.com/in/dev-lucasandrade/",
  },
  terms: {
    hero: {
      eyebrow: "Condições de uso",
      titleHighlight: "Transparência",
      titleRest: "e clareza.",
      description:
        "Termos claros para o uso do site, formulários e canais oficiais da Rodogarcia. Todas as informações em um só lugar.",
    },
    summary: {
      eyebrow: "Resumo rápido",
      title: "O site é um canal institucional e comercial.",
      description: "Informações, cotações e contatos publicados aqui fazem parte da jornada oficial da marca.",
      body:
        "Este documento cobre o uso do site institucional, o envio de dados por formulários oficiais e as responsabilidades sobre conteúdo e marcas.",
      button: { label: "Ler política", url: site.privacy },
    },
    reading: {
      eyebrow: "Leitura completa",
      title: "Termos detalhados",
      description: "Entenda os limites e as diretrizes para utilizar nosso portal e serviços associados.",
      blocks: [
        { id: "terms-use", order: 1, title: "1. Uso do site", description: "O site da Rodogarcia é destinado a fins informativos e comerciais relacionados aos serviços de transporte, distribuição, cotação e atendimento institucional." },
        { id: "terms-content", order: 2, title: "2. Conteúdo e propriedade intelectual", description: "Textos, imagens, marcas, elementos gráficos e demais materiais publicados pertencem à Rodogarcia ou são utilizados com autorização." },
        { id: "terms-forms", order: 3, title: "3. Formulários e canais digitais", description: "Os formulários de contato, cotação e carreiras servem para iniciar atendimento institucional sem representar contratação automática." },
        { id: "terms-responsibility", order: 4, title: "4. Limitação de responsabilidade", description: "A Rodogarcia busca manter o site atualizado e funcional, mas indisponibilidades temporárias podem ocorrer." },
        { id: "terms-updates", order: 5, title: "5. Atualizações", description: "Os termos podem ser revisados para refletir ajustes operacionais, legais ou de experiência digital." },
      ],
    },
    finalCta: {
      title: "Ficou alguma dúvida?",
      description:
        "Em caso de dúvida sobre este documento ou sobre o uso dos canais institucionais, fale com a equipe pelo canal oficial.",
      buttons: [emailButton, contactButton],
    },
  },
  help: {
    hero: {
      eyebrow: "Central de ajuda",
      titleHighlight: "Respostas diretas,",
      titleRest: "sem ruído.",
      description:
        "FAQ, canais de suporte e atalhos operacionais organizados em um só lugar para tornar o atendimento mais ágil.",
      buttons: [
        { label: "Rastrear carga", url: external.tracking, external: true },
        { label: "Falar com atendimento", url: site.contact },
      ],
    },
    quickAccess: {
      eyebrow: "Acesso rápido",
      title: "Os três caminhos mais usados pelo nosso time de atendimento.",
      description: "Rastreio, contato e privacidade concentrados para que você chegue ao canal certo sem esforço.",
      actions: [
        { id: "help-tracking", order: 1, icon: "Package", title: "Rastrear carga", description: "Acesso direto ao portal operacional para consulta do status da remessa em tempo real.", button: { label: "Abrir rastreio", url: external.tracking, external: true } },
        { id: "help-commercial", order: 2, icon: "ChatCircleDots", title: "Atendimento comercial", description: "Fale com o time para cotação, orientação inicial ou suporte institucional.", button: { label: "Abrir contato", url: site.contact } },
        { id: "help-privacy", order: 3, icon: "ShieldCheck", title: "Política de privacidade", description: "Entenda como tratamos dados e como os formulários entram no fluxo institucional.", button: { label: "Ler política", url: site.privacy } },
      ],
    },
    contactCard: {
      phone: external.phoneDisplay,
      hours: "Segunda a sexta, das 8h às 18h. Sábado das 8h às 12h.",
      channelDescriptions: [
        "Para cotação: WhatsApp ou página de cotação.",
        "Para rastreio: portal oficial com código da remessa.",
        "Para política de dados: rodapé e página de privacidade.",
      ],
    },
    faq: {
      eyebrow: "Perguntas frequentes",
      title: "As dúvidas mais comuns respondidas de forma objetiva.",
      description: "Se sua pergunta não está aqui, o canal de atendimento está disponível para orientação direta.",
      items: [
        { id: "help-faq-1", order: 1, question: "Como rastrear minha encomenda?", answer: "Use o portal oficial de rastreio com o código recebido no envio." },
        { id: "help-faq-2", order: 2, question: "Como solicitar uma cotação?", answer: "Acesse a página de cotação ou fale diretamente com a equipe comercial." },
        { id: "help-faq-3", order: 3, question: "Quais regiões a Rodogarcia atende?", answer: "A operação tem cobertura nacional para distribuição e projetos corporativos." },
        { id: "help-faq-4", order: 4, question: "Qual o prazo de entrega?", answer: "O prazo depende de origem, destino, janela e tipo de serviço contratado." },
        { id: "help-faq-5", order: 5, question: "A Rodogarcia atende cargas especiais?", answer: "Operações com maior exigência podem ser avaliadas pelo time especializado." },
        { id: "help-faq-6", order: 6, question: "Como falar com o suporte?", answer: "Use o telefone, o e-mail comercial ou a página de contato." },
      ],
    },
    finalSupport: {
      eyebrow: "Ainda precisa de apoio?",
      title: "Abra uma solicitação e fale com o canal certo.",
      description: "Envie sua demanda pelo contato oficial para que a equipe identifique o melhor fluxo.",
      button: { label: "Abrir suporte", url: site.contact },
    },
  },
  privacy: {
    hero: {
      eyebrow: "Política de privacidade",
      titleHighlight: "Dados tratados",
      titleRest: "com clareza.",
      description:
        "Entenda como os dados enviados pelos formulários e canais digitais são utilizados dentro dos fluxos institucionais da Rodogarcia.",
      button: { label: "Ver termos de uso", url: site.terms },
    },
    dataSection: {
      eyebrow: "Política de privacidade",
      title: "Leia os principais pontos sobre coleta, finalidade, segurança e direitos do titular.",
      description: "As informações abaixo explicam como os dados podem ser recebidos e tratados nos canais oficiais.",
      blocks: [
        { id: "privacy-data", order: 1, title: "Quais dados podem ser coletados?", description: "Formulários podem receber nome, e-mail, telefone, empresa, origem, destino e mensagens enviadas voluntariamente." },
        { id: "privacy-purpose", order: 2, title: "Para que os dados são usados?", description: "Os dados são usados para responder contatos, elaborar cotações e conduzir comunicações institucionais." },
        { id: "privacy-access", order: 3, title: "Quem pode acessar?", description: "Equipes responsáveis por atendimento, contato, recrutamento ou operação podem acessar conforme a demanda." },
        { id: "privacy-security", order: 4, title: "Como protegemos as informações?", description: "A Rodogarcia adota medidas técnicas e organizacionais para proteger as informações recebidas." },
        { id: "privacy-rights", order: 5, title: "Quais são os direitos do titular?", description: "O titular pode solicitar esclarecimentos, atualização ou revisão pelos canais institucionais da empresa." },
      ],
    },
    finalCta: {
      title: "Precisa falar sobre seus dados?",
      description:
        "Para dúvidas sobre privacidade, atualização de informações ou direitos do titular, use o canal institucional oficial.",
      buttons: [emailButton, contactButton],
    },
  },
};

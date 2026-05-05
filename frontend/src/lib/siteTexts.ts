import { external, site } from "@/lib/routes";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";

export interface AboutSiteTexts {
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  stats: Array<{
    number: string;
    description: string;
  }>;
}

export interface ContactSiteTexts {
  pageTitle: string;
  pageSubtitle: string;
  phoneNumber: string;
  phoneHours: string;
  emailAddress: string;
  emailResponse: string;
  whatsappUrl: string;
  whatsappLabel: string;
  addressLine: string;
  addressZip: string;
  addressCountry: string;
  ctaLabel: string;
  ctaUrl: string;
}

type SiteTextsRecord = Record<string, unknown> | null | undefined;

export const ABOUT_SITE_TEXT_DEFAULTS = {
  tag: "Nossa historia",
  title: "Mais de 35 anos conectando o Brasil",
  subtitle:
    "Desde 1989, transformando a logística com consistência, tecnologia e compromisso com cada entrega.",
  image: "/caminhoneiro1.png",
  stats: [
    { number: "35+", description: "anos de experiencia" },
    { number: "1.500+", description: "pontos de coleta" },
    { number: "1M+", description: "pacotes processados" },
  ],
} satisfies AboutSiteTexts;

export const CONTACT_SITE_TEXT_DEFAULTS = {
  pageTitle: "Fale com a Rodogarcia",
  pageSubtitle:
    "Estamos prontos para apoiar cotacoes, alinhamentos comerciais e orientacoes operacionais.",
  phoneNumber: external.phoneDisplay,
  phoneHours: "segunda a sexta, das 8h as 18h",
  emailAddress: external.commercialEmailAddress,
  emailResponse: "conforme ordem de atendimento",
  whatsappUrl: external.whatsappCommercial,
  whatsappLabel: "atendimento Rodogarcia",
  addressLine: "Rua Pedro Carmine Deo, 156, Agudos - SP",
  addressZip: "17123-210",
  addressCountry: "Brasil",
  ctaLabel: "Solicitar cotação",
  ctaUrl: site.quote,
} satisfies ContactSiteTexts;

function getText(
  input: SiteTextsRecord,
  key: string,
  fallback: string,
  maxLength: number
) {
  const value = sanitizeText(input?.[key], maxLength);
  return value || fallback;
}

function getUrl(input: SiteTextsRecord, key: string, fallback: string) {
  const value = sanitizeUrl(input?.[key]);
  return value || fallback;
}

export function getAboutSiteTexts(input?: SiteTextsRecord): AboutSiteTexts {
  return {
    tag: getText(input, "aboutHeroTag", ABOUT_SITE_TEXT_DEFAULTS.tag, 60),
    title: getText(input, "aboutHeroTitle", ABOUT_SITE_TEXT_DEFAULTS.title, 140),
    subtitle: getText(
      input,
      "aboutHeroSubtitle",
      ABOUT_SITE_TEXT_DEFAULTS.subtitle,
      320
    ),
    image: getUrl(input, "aboutHeroImage", ABOUT_SITE_TEXT_DEFAULTS.image),
    stats: [
      {
        number: getText(
          input,
          "aboutStat1Number",
          ABOUT_SITE_TEXT_DEFAULTS.stats[0].number,
          20
        ),
        description: getText(
          input,
          "aboutStat1Description",
          ABOUT_SITE_TEXT_DEFAULTS.stats[0].description,
          80
        ),
      },
      {
        number: getText(
          input,
          "aboutStat2Number",
          ABOUT_SITE_TEXT_DEFAULTS.stats[1].number,
          20
        ),
        description: getText(
          input,
          "aboutStat2Description",
          ABOUT_SITE_TEXT_DEFAULTS.stats[1].description,
          80
        ),
      },
      {
        number: getText(
          input,
          "aboutStat3Number",
          ABOUT_SITE_TEXT_DEFAULTS.stats[2].number,
          20
        ),
        description: getText(
          input,
          "aboutStat3Description",
          ABOUT_SITE_TEXT_DEFAULTS.stats[2].description,
          80
        ),
      },
    ],
  };
}

export function getContactSiteTexts(input?: SiteTextsRecord): ContactSiteTexts {
  return {
    pageTitle: getText(
      input,
      "contactPageTitle",
      CONTACT_SITE_TEXT_DEFAULTS.pageTitle,
      120
    ),
    pageSubtitle: getText(
      input,
      "contactPageSubtitle",
      CONTACT_SITE_TEXT_DEFAULTS.pageSubtitle,
      280
    ),
    phoneNumber: getText(
      input,
      "contactPhoneNumber",
      CONTACT_SITE_TEXT_DEFAULTS.phoneNumber,
      60
    ),
    phoneHours: getText(
      input,
      "contactPhoneHours",
      CONTACT_SITE_TEXT_DEFAULTS.phoneHours,
      120
    ),
    emailAddress: getText(
      input,
      "contactEmailAddress",
      CONTACT_SITE_TEXT_DEFAULTS.emailAddress,
      160
    ),
    emailResponse: getText(
      input,
      "contactEmailResponse",
      CONTACT_SITE_TEXT_DEFAULTS.emailResponse,
      120
    ),
    whatsappUrl: getUrl(
      input,
      "contactWhatsappUrl",
      CONTACT_SITE_TEXT_DEFAULTS.whatsappUrl
    ),
    whatsappLabel: getText(
      input,
      "contactWhatsappLabel",
      CONTACT_SITE_TEXT_DEFAULTS.whatsappLabel,
      80
    ),
    addressLine: getText(
      input,
      "contactAddressLine",
      CONTACT_SITE_TEXT_DEFAULTS.addressLine,
      180
    ),
    addressZip: getText(
      input,
      "contactAddressZip",
      CONTACT_SITE_TEXT_DEFAULTS.addressZip,
      20
    ),
    addressCountry: getText(
      input,
      "contactAddressCountry",
      CONTACT_SITE_TEXT_DEFAULTS.addressCountry,
      60
    ),
    ctaLabel: getText(
      input,
      "contactCtaLabel",
      CONTACT_SITE_TEXT_DEFAULTS.ctaLabel,
      40
    ),
    ctaUrl: getUrl(input, "contactCtaUrl", CONTACT_SITE_TEXT_DEFAULTS.ctaUrl),
  };
}

export function toPhoneHref(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D+/g, "");
  return digits ? `tel:${digits}` : external.phoneHref;
}

export function toEmailHref(emailAddress: string) {
  const sanitized = sanitizeText(emailAddress, 160).toLowerCase();
  return sanitized ? `mailto:${sanitized}` : external.commercialEmail;
}

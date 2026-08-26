"use client";

import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";

const SOCIAL_ICONS: Record<
  string,
  typeof InstagramLogo | typeof LinkedinLogo | typeof FacebookLogo | typeof WhatsappLogo
> = {
  InstagramLogo,
  LinkedinLogo,
  FacebookLogo,
  WhatsappLogo,
};

export function FooterSocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const Icon = SOCIAL_ICONS[icon] ?? InstagramLogo;

  return (
    <li>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        aria-label={`${label} da Rodogarcia`}
        className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm text-white/64 transition-colors hover:border-white/16 hover:bg-white/6 hover:text-white"
      >
        <Icon size={16} weight="fill" />
        {label}
      </a>
    </li>
  );
}

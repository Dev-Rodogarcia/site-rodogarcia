import Link from "next/link";

interface EditorialSplitSectionItem {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}

interface EditorialSplitSectionProps {
  eyebrow: string;
  title: string;
  description?: string;
  items: EditorialSplitSectionItem[];
  cta?: {
    label: string;
    href: string;
  };
  media: {
    src: string;
    alt: string;
    mode: "transparent" | "framed";
  };
  reverse?: boolean;
  surface?: "soft" | "default";
}

export default function EditorialSplitSection({
  eyebrow,
  title,
  description,
  items,
  cta,
  media,
  reverse = false,
  surface = "default",
}: EditorialSplitSectionProps) {
  const sectionClass =
    surface === "soft"
      ? "relative overflow-hidden bg-[var(--color-surface-2)] py-16"
      : "relative overflow-hidden py-20";

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="relative px-1 py-4 sm:px-2 lg:px-0 lg:py-8">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[120%] -translate-y-1/2 bg-[radial-gradient(circle_at_18%_28%,rgba(29,78,216,0.08),transparent_24%),radial-gradient(circle_at_80%_54%,rgba(6,182,212,0.08),transparent_22%)] blur-3xl" />

          <div
            className={[
              "relative z-10 flex flex-col gap-10 lg:items-center lg:gap-16",
              reverse ? "lg:flex-row-reverse" : "lg:flex-row",
            ].join(" ")}
          >
            <div className="lg:basis-[42%] lg:max-w-[460px]">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                {eyebrow}
              </span>

              <h2 className="mt-3 text-[clamp(2.2rem,4vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.05em] text-[var(--foreground)]">
                {title}
              </h2>

              {description && (
                <p className="mt-4 max-w-[56ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                  {description}
                </p>
              )}

              <div className="mt-8 lg:hidden">{renderMedia(media)}</div>

              <div className="mt-8 divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <div key={item.title} className="py-5 first:pt-0 last:pb-0">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                      {item.description}
                    </p>
                    {item.href && item.linkLabel && (
                      <SectionInlineLink href={item.href} label={item.linkLabel} />
                    )}
                  </div>
                ))}
              </div>

              {cta && (
                <div className="mt-8">
                  <SectionPrimaryLink href={cta.href} label={cta.label} />
                </div>
              )}
            </div>

            <div className="hidden lg:flex lg:basis-[58%] lg:items-center lg:justify-center">
              {renderMedia(media)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function renderMedia(media: EditorialSplitSectionProps["media"]) {
  if (media.mode === "transparent") {
    return (
      <div className="relative flex min-h-[280px] items-center justify-center rounded-[28px] px-4 py-4 sm:min-h-[340px] lg:min-h-[420px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(29,78,216,0.12),transparent_48%),radial-gradient(circle_at_50%_80%,rgba(6,182,212,0.08),transparent_32%)]" />
        <img
          src={media.src}
          alt={media.alt}
          className="relative z-10 max-h-[280px] w-auto object-contain sm:max-h-[340px] lg:max-h-[420px]"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/6 bg-[#dce7f7] shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
      <img
        src={media.src}
        alt={media.alt}
        className="aspect-[16/10] h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function SectionPrimaryLink({ href, label }: { href: string; label: string }) {
  const isExternal =
    href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");

  const className =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)]";
  const content = (
    <>
      <span>{label}</span>
      <ArrowUpRightIcon />
    </>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function SectionInlineLink({ href, label }: { href: string; label: string }) {
  const isExternal =
    href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");

  const className =
    "mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--color-primary-strong)]";
  const content = (
    <>
      <span>{label}</span>
      <ArrowUpRightIcon />
    </>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.667 11.333 11.333 4.667M6 4.667h5.333V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

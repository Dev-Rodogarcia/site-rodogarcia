"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type OperationGuidanceItem = {
  title: string;
  content: string;
};

export function OperationGuidanceAccordion({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: OperationGuidanceItem[];
}) {
  return (
    <section className="mx-auto max-w-[980px]" aria-labelledby="operation-guidance-title">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">{eyebrow}</p>
        <h2 id="operation-guidance-title" className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[var(--foreground)] sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-[62ch] text-sm leading-7 text-[var(--color-muted-raw)]">{description}</p>
      </div>
      <Accordion className="mt-8 flex w-full flex-col" multiple>
        {items.map((item) => (
          <AccordionItem key={item.title} value={item.title} className="border-b border-[var(--border)] last:border-b-0">
            <AccordionTrigger className="py-6 text-left text-base font-semibold tracking-[-0.02em] text-[var(--foreground)] hover:text-[var(--primary)] hover:no-underline">
              {item.title}
            </AccordionTrigger>
            <AccordionContent className="max-w-[62ch] pb-6 pr-8 text-sm leading-7 text-[var(--color-muted-raw)]">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

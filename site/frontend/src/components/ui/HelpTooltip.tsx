export function HelpTooltip({ content }: { content: string }) {
  return (
    <span
      className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-500"
      title={content}
      aria-label={`Ajuda: ${content}`}
    >
      ?
    </span>
  );
}

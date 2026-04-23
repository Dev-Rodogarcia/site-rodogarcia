# Home Language

Ler este arquivo antes de desenhar uma nova secao publica para este repositorio.

## Core Signals

- `src/app/globals.css`
  - Tipografia base: `Space Grotesk` para heading e `Plus Jakarta Sans` para corpo.
  - Fundo global claro com radiais frios e gradientes leves.
  - Superficies com `--color-surface` e `--color-surface-2`.
  - Sombras suaves, bordas discretas e acento principal em azul/cyan.

## Useful Home References

- `src/components/home/PostHeroInteractiveShowcase.tsx`
  - Bom exemplo de secao separada por background e espacamento, sem depender de um card gigante.
  - Estrutura forte de split layout: midia em destaque de um lado, lista interativa do outro.
  - A caixa existe na midia, nao na secao inteira.

- `src/components/home/ServiceLinesRebrand.tsx`
  - Bom exemplo de faixa editorial com coluna de texto fixa e cards apenas para itens repetidos.
  - A identidade da secao vem do wrapper, nao dos cards.

- `src/components/home/FinalQuoteCtaSection.tsx`
  - Bom exemplo de CTA curto, direto e com motion leve.
  - Usar como referencia para secoes de fechamento, nao como molde universal.

- `src/components/home/TrackingLookupSection.tsx`
  - Usar como referencia de atmosfera: glow, grid, blur e layering.
  - Nao usar como justificativa para colocar todas as novas secoes dentro de uma grande moldura arredondada.

## Tone To Preserve

- parecer premium sem parecer luxo generico
- parecer operacional e confiavel, nao futurista gratuito
- usar contraste de superficie antes de recorrer a borda
- criar ritmo entre secoes; cada bloco precisa mudar a leitura da pagina

## Quick Review Questions

- O wrapper da nova secao tem identidade propria?
- A composicao muda o ritmo em relacao a secao anterior?
- A secao depende demais de caixas ou a superficie ja resolve a separacao?
- Os itens repetidos tem variacao suficiente em hover, imagem, alinhamento ou destaque?

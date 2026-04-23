---
name: rodogarcia-ui-sections
description: Projetar e refatorar secoes publicas do site Rodogarcia com composicao premium, variedade estrutural e coerencia com a Home atual. Use quando Codex criar ou revisar landing sections, blocos institucionais, showcases, CTAs, galerias, faixas de metricas, layouts editoriais ou qualquer interface publica que precise evitar cardception, fugir de templates genericos e manter a linguagem visual refinada do projeto.
---

# Rodogarcia UI Sections

## Overview

Construir cada secao como um bloco visual completo, nao como um card gigante. Separar secoes por superficie, background, espacamento, hierarquia tipografica e detalhes sutis; usar cards apenas quando eles representarem itens repetidos.

## Start Here

- Ler `src/app/globals.css` para alinhar tipografia, tokens, superficies e intensidade de sombra.
- Ler `references/home-language.md` para calibrar a composicao com a Home atual antes de desenhar uma nova secao.
- Inspecionar a pagina-alvo e as secoes adjacentes antes de compor o novo bloco.
- Definir o papel da secao antes de desenhar: editorial, prova social, galeria, metricas, CTA, midia, comparativo, processo ou destaque institucional.

## Build The Section

1. Definir o wrapper da secao.
   - Separar a secao por background, gradiente, textura sutil, divisor, glow ou ritmo de espacamento.
   - Evitar usar um container arredondado com borda como estrutura principal da secao.
2. Definir o container central.
   - Seguir a largura e o ritmo da Home atual, normalmente com `max-w-[1440px]` e `px-6`.
3. Definir o header.
   - Dar prioridade a um titulo forte, com kicker e subtitulo curto quando fizer sentido.
4. Definir o padrao do conteudo.
   - Escolher uma composicao que nao repita a secao anterior: split editorial, galeria horizontal, metricas tipograficas, lista interativa, bloco de prova, CTA enxuto, faixa de processo ou combinacao equivalente.
5. Adicionar um detalhe de superficie.
   - Usar glow, blur, grid discreto, overlay, faixa de luz, divisor suave ou shape abstrato.
6. Adicionar interacao.
   - Incluir hover states, transicoes suaves, variacao visual entre itens e estados ativos coerentes.

## Non-Negotiable Rules

- Nao representar uma secao inteira como card gigante.
- Nao empilhar card dentro de card como solucao padrao.
- Usar cards apenas para elementos repetidos como servicos, features, depoimentos, planos ou metricas.
- Separar secoes por background e espacamento, nao por caixas.
- Fazer cada secao parecer planejada de forma unica; evitar repetir o mesmo modulo de titulo mais grid mais cards.
- Usar referencias como inspiracao de linguagem, nao como molde estrutural ou copia literal.
- Priorizar contraste de superficie, gradiente controlado, textura discreta e hierarquia visual; reduzir bordas, outlines e sombras pesadas.

## Reference Handling

- Extrair da referencia a atmosfera, a hierarquia, o ritmo e o tratamento de superficie.
- Nao copiar DOM, sequencia de blocos, texto, numero de colunas ou ordem de elementos.
- Recriar a ideia com outra composicao, mantendo a mesma pegada de refinamento.
- Se uma secao existente da Home usar um grande bloco enquadrado, aproveitar apenas luz, textura e motion; nao tratar isso como permissao para repetir o mesmo frame em secoes novas.

## Surface Language

- Manter a base clara e arejada da Rodogarcia.
- Usar `Space Grotesk` como voz de destaque e `Plus Jakarta Sans` no corpo, seguindo `src/app/globals.css`.
- Trabalhar principalmente com azuis, cyan e neutros frios ja existentes no projeto.
- Preferir sombras suaves e poucas bordas visiveis.
- Usar grandes raios apenas em elementos locais, como midia, botoes, badges e itens repetidos; nao transformar a secao inteira em uma caixa padrao.
- Preservar leitura clara no mobile, com pilha vertical limpa e respiracao consistente.

## Variation Guide

Alternar a estrutura entre secoes. Exemplos validos:

- editorial split com texto forte de um lado e midia do outro
- galeria horizontal ou lista interativa com destaque ativo
- metricas com tipografia dominante e apoio minimo
- faixa de contraste alto com CTA enxuto
- secao minimalista com titulo forte e poucos elementos
- bloco visual com overlay, textura ou gradiente radial

Evitar:

- grid generico de 3 colunas sem personalidade
- blocos quadrados repetidos com o mesmo tratamento
- tudo centralizado sem contraste de ritmo
- outlines por toda parte
- cards aninhados dentro de um container-card principal

## Mobile And Interaction Check

- Garantir leitura linear quando a secao empilhar.
- Evitar textos muito largos ou cabecalhos sem respiro.
- Manter alvos de toque confortaveis.
- Fazer a midia degradar bem para telas menores.
- Usar transicoes curtas e intencionais; evitar motion gratuito.

## Final Checklist

- Existe card dentro de card? Se sim, refazer.
- A secao esta separada por background e espacamento, e nao por uma caixa? Se nao, refazer.
- A secao parece diferente da anterior? Se nao, variar a composicao.
- A secao parece um template generico? Se sim, elevar a identidade visual.
- A referencia foi copiada? Se sim, reconstruir.
- A hierarquia esta clara, premium e consistente no mobile? Se nao, ajustar antes de entregar.

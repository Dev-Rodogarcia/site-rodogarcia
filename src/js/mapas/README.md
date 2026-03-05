# Mapa do Brasil - Estrutura Modular

Esta pasta contÃ©m todos os arquivos relacionados ao mapa interativo do Brasil.

## Estrutura de Arquivos

### `config.js`
ConfiguraÃ§Ãµes gerais do mapa:
- Estados com filiais
- Cores (base, destaque, hover)
- Caminho do SVG

### `filiais.js`
Dados de todas as filiais:
- InformaÃ§Ãµes completas de cada filial
- FunÃ§Ãµes para buscar filiais por ID ou estado

### `mapeamento.js`
Mapeamento de Ã­ndices para estados:
- Como os IDs no SVG estÃ£o errados, este arquivo mapeia qual Ã­ndice corresponde a qual estado real
- FunÃ§Ãµes auxiliares para buscar Ã­ndices/estados

### `destaques.js`
FunÃ§Ãµes de destaque visual:
- Resetar estados para cor base
- Aplicar destaques aos estados com filiais
- Destacar/remover destaque de estados individuais (para interaÃ§Ãµes)

### `interacoes.js`
InteraÃ§Ãµes do mapa:
- Cliques nos estados
- Hover nos estados
- IntegraÃ§Ã£o com select de filiais
- AtualizaÃ§Ã£o do card de detalhes

### `carregamento.js`
Carregamento do SVG:
- FunÃ§Ã£o para carregar o SVG do servidor
- InserÃ§Ã£o no DOM
- Tratamento de erros

### `mapa.js`
Arquivo principal:
- Inicializa todas as funcionalidades
- Coordena o carregamento e configuraÃ§Ã£o

## Como Adicionar Novas Funcionalidades

### Adicionar animaÃ§Ãµes:
1. Adicione as animaÃ§Ãµes CSS em `src/css/mapa.css`
2. Use as animaÃ§Ãµes em `interacoes.js` ou `destaques.js`

### Adicionar novos estados com filiais:
1. Edite `config.js` e adicione o estado em `ESTADOS_COM_FILIAIS`
2. Adicione o mapeamento em `mapeamento.js` se necessÃ¡rio

### Adicionar novas interaÃ§Ãµes:
1. Crie funÃ§Ãµes em `interacoes.js`
2. Chame-as em `configurarInteracoes()`

## Caminho do SVG

O SVG estÃ¡ configurado para ser carregado de:
```
./src/js/mapas/map.svg
```

**Importante:** O arquivo `map.svg` deve permanecer em `src/js/mapas/` ou o caminho precisa ser ajustado em `config.js`.



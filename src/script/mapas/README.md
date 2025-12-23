# Mapa do Brasil - Estrutura Modular

Esta pasta contém todos os arquivos relacionados ao mapa interativo do Brasil.

## Estrutura de Arquivos

### `config.js`
Configurações gerais do mapa:
- Estados com filiais
- Cores (base, destaque, hover)
- Caminho do SVG

### `filiais.js`
Dados de todas as filiais:
- Informações completas de cada filial
- Funções para buscar filiais por ID ou estado

### `mapeamento.js`
Mapeamento de índices para estados:
- Como os IDs no SVG estão errados, este arquivo mapeia qual índice corresponde a qual estado real
- Funções auxiliares para buscar índices/estados

### `destaques.js`
Funções de destaque visual:
- Resetar estados para cor base
- Aplicar destaques aos estados com filiais
- Destacar/remover destaque de estados individuais (para interações)

### `interacoes.js`
Interações do mapa:
- Cliques nos estados
- Hover nos estados
- Integração com select de filiais
- Atualização do card de detalhes

### `carregamento.js`
Carregamento do SVG:
- Função para carregar o SVG do servidor
- Inserção no DOM
- Tratamento de erros

### `mapa.js`
Arquivo principal:
- Inicializa todas as funcionalidades
- Coordena o carregamento e configuração

## Como Adicionar Novas Funcionalidades

### Adicionar animações:
1. Adicione as animações CSS em `src/css/mapa.css`
2. Use as animações em `interacoes.js` ou `destaques.js`

### Adicionar novos estados com filiais:
1. Edite `config.js` e adicione o estado em `ESTADOS_COM_FILIAIS`
2. Adicione o mapeamento em `mapeamento.js` se necessário

### Adicionar novas interações:
1. Crie funções em `interacoes.js`
2. Chame-as em `configurarInteracoes()`

## Caminho do SVG

O SVG está configurado para ser carregado de:
```
./src/script/mapas/map.svg
```

**Importante:** Você precisa mover o arquivo `map.svg` de `src/mapa/assets/` para `src/script/mapas/` ou atualizar o caminho em `config.js`.


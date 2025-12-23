# Site Rodogarcia Transportes 🚚

Site institucional moderno da Rodogarcia Transportes, com design inspirado em empresas de logística como Loggi.

## 🚀 Como Rodar Localmente

### Opção 1: Servidor Node.js (Recomendado)

```bash
# Inicie o servidor
node server.js

# Ou use o npm
npm start
```

Depois abra no navegador: `http://localhost:3000`

### Opção 2: Live Server (VS Code)

1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito no `index.html`
3. Selecione "Open with Live Server"

### ⚠️ Importante: Não abra o HTML diretamente

Não abra o arquivo `index.html` diretamente no navegador (file://), pois isso causa erro de CORS ao carregar o mapa SVG.

## 📁 Estrutura do Projeto

```
site-rodogarcia/
├── index.html              # Página principal
├── server.js               # Servidor HTTP simples
├── package.json            # Configurações do projeto
├── public/                 # Imagens e assets públicos
│   ├── certificados/       # Certificações e licenças
│   └── *.png              # Logos e fotos
└── src/
    ├── css/               # Estilos CSS
    │   ├── main.css       # CSS principal (importa todos)
    │   ├── base.css       # Reset e estilos base
    │   ├── variables.css  # Variáveis CSS
    │   ├── mapa.css       # Estilos do mapa interativo
    │   ├── components/    # Componentes reutilizáveis
    │   ├── layout/        # Header e Footer
    │   └── sections/      # Seções da página
    ├── script/            # JavaScript
    │   ├── main.js        # Script principal
    │   └── mapa.js        # Mapa interativo do Brasil
    └── mapa/
        └── assets/
            └── map.svg    # Mapa do Brasil (SVG)
```

## 🗺️ Mapa Interativo

O mapa do Brasil destaca os estados onde a Rodogarcia tem presença:
- **SP** - São Paulo
- **PE** - Pernambuco
- **PR** - Paraná
- **RJ** - Rio de Janeiro
- **RS** - Rio Grande do Sul

### Como alterar estados destacados

Edite o array em `src/script/mapa.js`:

```javascript
const estadosDestaque = ['sp', 'pe', 'pr', 'rj', 'rs'];
```

## 🎨 Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com variáveis CSS
- **JavaScript Vanilla** - Sem frameworks, puro e performático
- **SVG** - Mapa vetorial do Brasil
- **Phosphor Icons** - Ícones modernos

## 📦 Deploy

Para fazer deploy, você só precisa dos arquivos:
- `index.html`
- `public/` (pasta completa)
- `src/` (pasta completa)

**Não é necessário:**
- `server.js` (apenas para desenvolvimento local)
- `package.json` (apenas para desenvolvimento local)
- Arquivos Python em `src/mapa/` (já processados)

### Plataformas de Deploy Gratuitas

- **Vercel**: `vercel --prod`
- **Netlify**: Arraste a pasta no site
- **GitHub Pages**: Configure nas settings do repositório

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ por [Lucas Andrade](https://www.linkedin.com/in/dev-lucasandrade/)

## 📄 Licença

© 2025 Rodogarcia Transportes. Todos os direitos reservados.

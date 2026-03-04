// Servidor HTTP simples para desenvolvimento local.
// Execute com: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = __dirname;

const redirectMap = new Map([
    ['/index.html', { destination: '/', statusCode: 301 }],
    ['/inicio', { destination: '/', statusCode: 301 }],
    ['/institucional', { destination: '/sobre.html', statusCode: 301 }],
    ['/quem-somos', { destination: '/sobre.html', statusCode: 301 }],
    ['/trabalhe-conosco', { destination: '/trabalhe-conosco.html', statusCode: 301 }],
    ['/imprensa', { destination: '/imprensa.html', statusCode: 301 }],
    ['/servicos', { destination: '/servicos.html', statusCode: 301 }],
    ['/nossos-servicos', { destination: '/servicos.html', statusCode: 301 }],
    ['/solicitar-cotacao', { destination: '/cotacao.html', statusCode: 301 }],
    ['/rastrear-encomenda', { destination: 'https://rodogarcia.eslcloud.com.br/recipient_tracking', statusCode: 302 }],
    ['/para-empresas', { destination: '/para-empresas.html', statusCode: 301 }],
    ['/ajuda', { destination: '/central-ajuda.html', statusCode: 301 }],
    ['/central-ajuda', { destination: '/central-ajuda.html', statusCode: 301 }],
    ['/central-de-ajuda', { destination: '/central-ajuda.html', statusCode: 301 }],
    ['/fale-conosco', { destination: '/fale-conosco.html', statusCode: 301 }],
    ['/termos-de-uso', { destination: '/termos-de-uso.html', statusCode: 301 }]
]);

const routeMap = new Map([
    ['/', '/src/index.html'],
    ['/servicos.html', '/src/servicos.html'],
    ['/sobre.html', '/src/sobre.html'],
    ['/cotacao.html', '/src/cotacao.html'],
    ['/trabalhe-conosco.html', '/src/trabalhe-conosco.html'],
    ['/imprensa.html', '/src/imprensa.html'],
    ['/para-empresas.html', '/src/para-empresas.html'],
    ['/central-ajuda.html', '/src/central-ajuda.html'],
    ['/fale-conosco.html', '/src/fale-conosco.html'],
    ['/termos-de-uso.html', '/src/termos-de-uso.html']
]);

const mimeTypes = {
    '.avif': 'image/avif',
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml; charset=utf-8'
};

function resolveFilePath(pathname) {
    const mappedPath = routeMap.get(pathname) || pathname;

    const filePath = path.normalize(path.join(ROOT_DIR, mappedPath));

    // Bloqueia path traversal.
    if (!filePath.startsWith(ROOT_DIR)) {
        return null;
    }

    return filePath;
}

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);
    const redirect = redirectMap.get(pathname);

    if (redirect) {
        const destination = `${redirect.destination}${parsedUrl.search}`;
        res.writeHead(redirect.statusCode, { Location: destination });
        res.end();
        return;
    }

    const filePath = resolveFilePath(pathname);

    if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>403 - Acesso negado</h1>');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Arquivo nao encontrado</h1>');
                return;
            }

            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>500 - Erro no servidor (${error.code})</h1>`);
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Servindo arquivos de: ${ROOT_DIR}`);
});

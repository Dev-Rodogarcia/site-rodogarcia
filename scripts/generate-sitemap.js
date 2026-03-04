const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://rodogarcia.com.br';
const OUTPUT_PATH = path.join(__dirname, '..', 'sitemap.xml');
const LASTMOD = new Date().toISOString().slice(0, 10);

const routes = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/servicos.html', changefreq: 'weekly', priority: '0.9' },
    { path: '/sobre.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/cotacao.html', changefreq: 'weekly', priority: '0.9' },
    { path: '/trabalhe-conosco.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/imprensa.html', changefreq: 'monthly', priority: '0.6' },
    { path: '/para-empresas.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/central-ajuda.html', changefreq: 'monthly', priority: '0.6' },
    { path: '/fale-conosco.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/termos-de-uso.html', changefreq: 'yearly', priority: '0.4' }
];

const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

for (const route of routes) {
    const loc = route.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.path}`;
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${loc}</loc>`);
    xmlLines.push(`    <lastmod>${LASTMOD}</lastmod>`);
    xmlLines.push(`    <changefreq>${route.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${route.priority}</priority>`);
    xmlLines.push('  </url>');
}

xmlLines.push('</urlset>', '');

fs.writeFileSync(OUTPUT_PATH, xmlLines.join('\n'), 'utf8');
console.log(`sitemap.xml atualizado com ${routes.length} URL(s).`);

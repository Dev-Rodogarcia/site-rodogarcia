# Checklist de Seguranca da Area Restrita (Node.js)

## O que esta implementado

- Sessao em cookie `HttpOnly` (`SameSite=Strict`, `Secure` em producao).
- Bloqueio de acesso direto a `/admin/*` sem sessao valida.
- Validacao de origem para metodos mutaveis (`POST`, `PUT`, `DELETE`, `PATCH`).
- Protecao CSRF via token enviado no header `X-CSRF-Token`.
- Hash de senha com `PBKDF2` (`sha512`, 120k iteracoes, salt aleatorio).
- Sanitizacao de entrada e validacao no backend para Hero, DNA e Vagas.
- Rate limit basico para tentativas de login.
- Bloqueio de acesso HTTP a caminhos sensiveis (`/server/*`, `.git`, etc).

## Regras de servidor recomendadas

## Apache (`.htaccess`)

```apacheconf
# Bloquear arquivos e pastas sensiveis
RedirectMatch 403 ^/(server|backups|\.git|\.vscode)(/|$)

# Forcar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Evitar cache do admin/auth
<IfModule mod_headers.c>
  <FilesMatch "^(index\.html|carrosseis\.html|vagas\.html|entrar\.html|criar-conta\.html)$">
    Header set Cache-Control "no-store"
  </FilesMatch>
</IfModule>
```

## Nginx

```nginx
location ~ ^/(server|backups|\.git|\.vscode) {
  deny all;
}

location /admin/ {
  add_header Cache-Control "no-store";
}

location /auth/ {
  add_header Cache-Control "no-store";
}
```

## Hardening para producao

- Definir `ADMIN_SETUP_CODE` forte e rotacionar apos a primeira conta.
- Usar HTTPS com certificado valido.
- Mover usuarios/sessoes para banco + store dedicado (Redis, por exemplo).
- Implementar logs de auditoria para alteracoes de conteudo.
- Configurar backup criptografado e politica de restauracao.

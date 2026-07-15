# URLs do Cloudflare

Preencha este arquivo quando os hostnames forem definidos. Não registre tokens, certificados ou credenciais aqui.

| Item | Valor |
| --- | --- |
| URL pública do site | `https://` |
| URL pública da API (se houver hostname separado) | `https://` |
| Hostname do tunnel do site | |
| Hostname do tunnel da API (opcional) | |

Depois de preencher:

1. Copie a URL pública do site para `FRONTEND_ORIGIN` em `.env.production.local`.
2. Inclua eventuais origens extras em `CORS_ORIGINS`, sempre HTTPS e separadas por vírgula.
3. Se a API receber hostname próprio, use-o apenas em `NEXT_PUBLIC_BACKEND_URL`; essa variável é pública e nunca pode conter token ou credencial.
4. Configure o Cloudflare Tunnel para apontar site para `http://127.0.0.1:5010` e API opcional para `http://127.0.0.1:4010`.

O arquivo de configuração do `cloudflared` permanece na infraestrutura, fora deste repositório.

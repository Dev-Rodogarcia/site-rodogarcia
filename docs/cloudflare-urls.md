# URLs do Cloudflare

Os hostnames de produção estão definidos abaixo. Não registre tokens, certificados ou credenciais aqui.

| Item | Valor |
| --- | --- |
| URL pública do site | `https://site.rodogarcia.com.br` |
| URL pública do CMS | `https://site.rodogarcia.com.br/admin` |
| URL pública da API operacional | `https://sitebackend.rodogarcia.com.br` |
| Hostname do tunnel do site | `site.rodogarcia.com.br` -> `http://127.0.0.1:41060` |
| Hostname do tunnel da API | `sitebackend.rodogarcia.com.br` -> `http://127.0.0.1:41050` |

Depois de preencher:

1. Copie a URL pública do site para `FRONTEND_ORIGIN` em `.env.production.local`.
2. Inclua eventuais origens extras em `CORS_ORIGINS`, sempre HTTPS e separadas por vírgula.
3. Se a API operacional receber hostname próprio, use-o apenas em `NEXT_PUBLIC_BACKEND_URL`; essa variável é pública e nunca pode conter token ou credencial. Auth, conteúdo, mídia, uploads, formulários e demais rotas CMS continuam pelo gateway same-origin do site.
4. Configure o Cloudflare Tunnel com os dois encaminhamentos indicados na tabela. Não crie hostname ou ingresso para a API CMS (`41051`) nem para o painel CMS (`41061`): o site em `41060` encaminha internamente `/admin/*` e as rotas CMS correspondentes.

O arquivo de configuração do `cloudflared` permanece na infraestrutura, fora deste repositório.

# Backend CMS Spring MVC

`cms/backend` é a implementação definitiva em Java 21/Spring Boot MVC da API administrativa. Ela concentra autenticação, sessão, ACL, CSRF, conteúdo, SEO, mídia, uploads, formulários/leads, consentimentos, analytics, popup, melhorias, auditoria, scheduler e integração privada com o Landing Builder.

As URLs, portas, variáveis, JSON, cookies, headers e volume persistente preservam o contrato consumido pelos frontends. A referência Node/Express usada na migração foi retirada do workspace; menções a ela nos contratos são apenas proveniência histórica do comportamento compatível.

## Validação

```powershell
cmd /c mvnw.cmd -B clean verify
```

O Maven Wrapper exige Java 21. O build gera `target/server.jar`; hardening e produção copiam o JAR para `dist.test` e `dist.next`, sem usar artefatos ativos.

## Mídia e readiness

Em produção, `FFMPEG_PATH` aponta para um executável absoluto e existente, fora do repositório e de `node_modules`. O processamento de mídia limita imagens a 20 milhões de pixels e 16.383 pixels por dimensão; FFmpeg tem prazo total de dez minutos e encerramento forçado quando necessário.

`/health` informa que o processo responde. `/ready` valida storage, uploads, assets públicos e, em produção, o executável FFmpeg. A resposta não expõe paths, versões, segredos ou detalhes internos.

Os contratos de endpoints e storage ficam em [`contracts`](contracts/README.md). Topologia, writer único e rollout manual estão em [`docs/spring-mvc/runtime-topology.md`](../../docs/spring-mvc/runtime-topology.md).

# Backend público Spring MVC

Implementação Java 21/Spring Boot MVC definitiva da API pública da Rodogarcia. Ela atende transporte ESL e consultas públicas de CEP/CNPJ em `site/backend` e preserva URLs, métodos, status, envelopes JSON, headers, limites e portas já consumidos pelo frontend.

## Stack

- Java 21
- Spring Boot 4.1.1 e Spring MVC bloqueante
- Maven Wrapper
- Jackson 3 e decoder Brotli para o contrato de entrada
- JUnit 5 e MockMvc

Não há Lombok, JPA, Hibernate, Flyway, banco de dados, WebFlux, sessão HTTP, Actuator ou Spring Security exposto.

## Estrutura

O código é separado em `controller`, `dto`, `model`, `repository`, `service`, `security`, `validation`, `config`, `exception`, `integration` e `utils`. O único dado operacional escrito por esta API é seu rate limit; conteúdo, sessões, mídia e coleções administrativas pertencem ao CMS Spring.

Os endpoints e o contrato de transporte estão em [`contracts/http-v1.yaml`](contracts/http-v1.yaml) e [`contracts/wire-protocol-v1.md`](contracts/wire-protocol-v1.md).

## Validação e execução local

```powershell
cmd /c mvnw.cmd -B clean verify

# Exemplo estritamente isolado; nunca use um storage ativo.
$env:PORT = "31099"
$env:STORAGE_ROOT = "$env:TEMP\rodogarcia-public-api-storage"
$env:RATE_LIMITS_STORE_PATH = "$env:TEMP\rodogarcia-public-api-storage\private\rate-limits.json"
cmd /c mvnw.cmd spring-boot:run
```

No fluxo completo, o responsável inicia manualmente `iniciar-dev.bat`. A API usa `31012` no DEV e `6050` em produção; os mesmos rewrites do frontend permanecem válidos.

As variáveis privadas compatíveis incluem `HOST`, `PORT`, `NODE_ENV`, `STORAGE_ROOT`, `RATE_LIMITS_STORE_PATH`, `FRONTEND_ORIGIN`, `CORS_ORIGINS`, `TRUST_PROXY`, `GRAPHQL_API_KEY`, `ESL_TENANT`, `ESL_GRAPHQL_URL` e `ESL_OPERATION_SECRET`. Elas nunca podem aparecer no bundle público, em respostas ou logs.

## Operação

O JAR de produção é `dist/server.jar`; o artefato isolado do hardening é `dist.test/server.jar`. O processo produtivo usa loopback em `6050`, `GET /health` para liveness e `GET /ready` para verificar o storage operacional. Promoção, rollback e PM2 continuam operações manuais da equipe responsável.

Os nomes internos que contêm `Node` ou `Express` identificam compatibilidade de protocolo capturada antes do corte; não dependem de um runtime Node presente no repositório.

package br.com.rodogarcia.site.backend.integration.esl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.io.ByteArrayOutputStream;
import java.time.Clock;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.config.TrustProxySetting;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.utils.EcmaScriptJsonNumber;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

class EslGraphqlClientTest {

    @TempDir
    Path temporaryDirectory;

    private HttpServer server;
    private final AtomicInteger status = new AtomicInteger(200);
    private final AtomicReference<String> responseBody = new AtomicReference<>(
        "{\"data\":{\"ok\":true}}"
    );
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private final AtomicReference<String> authorization = new AtomicReference<>();

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        server.createContext("/graphql", this::handle);
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    @Test
    void sendsTheExactEnvelopeAndReturnsOnlyData() {
        EslGraphqlClient client = client();

        assertThat(client.execute("query Test { ok }", Map.of("id", "123")).path("ok").asBoolean())
            .isTrue();
        assertThat(authorization).hasValue("Bearer test-api-key");
        assertThat(requestBody.get())
            .isEqualTo("{\"query\":\"query Test { ok }\",\"variables\":{\"id\":\"123\"}}");
    }

    @Test
    void writesGraphqlNumbersWithTheSameLexemesAsJsonStringify() {
        EslGraphqlClient client = client();
        LinkedHashMap<String, Object> variables = new LinkedHashMap<>();
        variables.put("small", EcmaScriptJsonNumber.of(1e-7));
        variables.put("large", EcmaScriptJsonNumber.of(1e21));
        variables.put("fixed", EcmaScriptJsonNumber.of(1e20));

        client.execute("query Numbers { ok }", variables);

        assertThat(requestBody.get()).isEqualTo(
            "{\"query\":\"query Numbers { ok }\",\"variables\":{" +
                "\"small\":1e-7,\"large\":1e+21," +
                "\"fixed\":100000000000000000000}}"
        );
    }

    @Test
    void mapsRateLimitOtherHttpInvalidJsonAndGraphqlErrors() {
        EslGraphqlClient client = client();

        status.set(429);
        assertApiError(client, 503, "O ESL está temporariamente indisponível");

        status.set(500);
        assertApiError(client, 502, "Não foi possível comunicar com o ESL");

        status.set(200);
        responseBody.set("invalid");
        assertApiError(client, 502, "O ESL retornou uma resposta inválida.");

        responseBody.set("{\"errors\":[{\"message\":\"rejeitada\"}],\"data\":null}");
        assertThatThrownBy(() -> client.execute("query", Map.of()))
            .isInstanceOf(EslGraphqlResponseException.class)
            .satisfies(error -> assertThat(((EslGraphqlResponseException) error).errors())
                .containsExactly("rejeitada"));
    }

    @Test
    void acceptsExactlyOneUtf8BomInAProviderResponse() {
        responseBody.set("\uFEFF{\"data\":{\"ok\":true}}");

        assertThat(client().execute("query Test { ok }", Map.of()).path("ok").asBoolean())
            .isTrue();
    }

    @Test
    void mapsATruncatedSuccessfulBodyToInvalidProviderResponse() throws Exception {
        AtomicReference<Throwable> serverError = new AtomicReference<>();
        try (ServerSocket rawServer = new ServerSocket(
            0,
            1,
            InetAddress.getLoopbackAddress()
        )) {
            Thread serverThread = Thread.ofPlatform().start(() -> {
                try (Socket socket = rawServer.accept()) {
                    readRequestHeaders(socket);
                    byte[] response = (
                        "HTTP/1.1 200 OK\r\n"
                            + "Content-Type: application/json\r\n"
                            + "Content-Length: 40\r\n"
                            + "Connection: close\r\n\r\n"
                            + "{\"data\":"
                    ).getBytes(StandardCharsets.US_ASCII);
                    socket.getOutputStream().write(response);
                    socket.getOutputStream().flush();
                } catch (Throwable error) {
                    serverError.set(error);
                }
            });

            EslGraphqlClient truncatedClient = client(
                "http://127.0.0.1:" + rawServer.getLocalPort() + "/graphql"
            );
            assertApiError(truncatedClient, 502, "O ESL retornou uma resposta inválida.");
            serverThread.join(5_000);
            assertThat(serverThread.isAlive()).isFalse();
            assertThat(serverError.get()).isNull();
        }
    }

    private EslGraphqlClient client() {
        return client(
            "http://" + server.getAddress().getHostString() + ":" + server.getAddress().getPort()
                + "/graphql"
        );
    }

    private EslGraphqlClient client(String graphqlUrl) {
        return new EslGraphqlClient(
            properties(graphqlUrl),
            new EslRequestScheduler(0, Clock.systemUTC(), ignored -> { }),
            JsonMapper.builder().build(),
            RestClient.create()
        );
    }

    private ApplicationProperties properties(String graphqlUrl) {
        Path backendRoot = temporaryDirectory.resolve("backend");
        return new ApplicationProperties(
            "test",
            "127.0.0.1",
            0,
            backendRoot,
            backendRoot,
            temporaryDirectory,
            temporaryDirectory,
            temporaryDirectory.resolve("rate-limits.json"),
            "http://127.0.0.1",
            Set.of("http://127.0.0.1"),
            TrustProxySetting.parse("false"),
            "test",
            graphqlUrl,
            "test-api-key",
            "test-operation-secret",
            false
        );
    }

    private void handle(HttpExchange exchange) throws IOException {
        requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
        authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
        byte[] body = responseBody.get().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status.get(), body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    private static void assertApiError(EslGraphqlClient client, int expectedStatus, String message) {
        assertThatThrownBy(() -> client.execute("query", Map.of()))
            .isInstanceOf(ApiException.class)
            .satisfies(error -> {
                ApiException apiError = (ApiException) error;
                assertThat(apiError.status()).isEqualTo(expectedStatus);
                assertThat(apiError.getMessage()).contains(message);
            });
    }

    private static void readRequestHeaders(Socket socket) throws IOException {
        ByteArrayOutputStream received = new ByteArrayOutputStream();
        int matched = 0;
        byte[] terminator = "\r\n\r\n".getBytes(StandardCharsets.US_ASCII);
        while (matched < terminator.length) {
            int value = socket.getInputStream().read();
            if (value < 0) {
                throw new IOException("Request HTTP encerrado antes dos headers.");
            }
            received.write(value);
            matched = value == terminator[matched] ? matched + 1 : 0;
        }
    }
}

package br.com.rodogarcia.site.backend.integration.brasilapi;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;
import br.com.rodogarcia.site.backend.integration.RestClientFactory;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RestClientBrasilApiClientTest {

    private final AtomicReference<String> method = new AtomicReference<>();
    private final AtomicReference<String> path = new AtomicReference<>();
    private final AtomicInteger responseStatus = new AtomicInteger(200);
    private HttpServer server;

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        server.createContext("/", exchange -> {
            method.set(exchange.getRequestMethod());
            path.set(exchange.getRequestURI().getRawPath());
            byte[] body = "{\"municipio\":\"Osasco\",\"uf\":\"SP\"}"
                .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(responseStatus.get(), body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    @Test
    void callsTheExactBrasilApiUrlWithGet() {
        RestClientBrasilApiClient client = new RestClientBrasilApiClient(
            RestClientFactory.create(baseUrl())
        );

        ProviderHttpResponse response = client.lookupCompany("60960473000243");

        assertThat(method).hasValue("GET");
        assertThat(path).hasValue("/api/cnpj/v1/60960473000243");
        assertThat(response.status()).isEqualTo(200);
        assertThat(new String(response.body(), StandardCharsets.UTF_8))
            .isEqualTo("{\"municipio\":\"Osasco\",\"uf\":\"SP\"}");
    }

    @Test
    void returns404ToTheServiceWithoutApplyingRestClientDefaultStatusHandling() {
        responseStatus.set(404);
        RestClientBrasilApiClient client = new RestClientBrasilApiClient(
            RestClientFactory.create(baseUrl())
        );

        ProviderHttpResponse response = client.lookupCompany("60960473000243");

        assertThat(response.status()).isEqualTo(404);
        assertThat(response.body()).isEmpty();
    }

    private String baseUrl() {
        return "http://" + server.getAddress().getHostString() + ":" + server.getAddress().getPort();
    }
}

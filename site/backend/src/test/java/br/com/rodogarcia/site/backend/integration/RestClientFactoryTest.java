package br.com.rodogarcia.site.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import com.sun.net.httpserver.HttpServer;

import org.junit.jupiter.api.Test;

class RestClientFactoryTest {

    @Test
    void keepsTheNodeProviderTimeout() {
        assertThat(RestClientFactory.PROVIDER_TIMEOUT).isEqualTo(Duration.ofSeconds(5));
    }

    @Test
    void followsAChainLongerThanTheJdkDefaultLikeFetch() throws Exception {
        HttpServer server = HttpServer.create(
            new InetSocketAddress(InetAddress.getLoopbackAddress(), 0),
            0
        );
        for (int index = 0; index <= 10; index++) {
            int step = index;
            server.createContext("/" + step, exchange -> {
                if (step < 10) {
                    exchange.getResponseHeaders().set("Location", "/" + (step + 1));
                    exchange.sendResponseHeaders(302, -1);
                } else {
                    byte[] body = "ok".getBytes(StandardCharsets.US_ASCII);
                    exchange.sendResponseHeaders(200, body.length);
                    exchange.getResponseBody().write(body);
                }
                exchange.close();
            });
        }
        server.start();
        try {
            String baseUrl = "http://" + server.getAddress().getHostString()
                + ":" + server.getAddress().getPort();
            String result = RestClientFactory.create(baseUrl)
                .get()
                .uri("/0")
                .retrieve()
                .body(String.class);

            assertThat(result).isEqualTo("ok");
        } finally {
            server.stop(0);
        }
    }
}

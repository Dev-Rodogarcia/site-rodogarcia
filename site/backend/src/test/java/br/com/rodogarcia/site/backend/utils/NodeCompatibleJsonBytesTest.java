package br.com.rodogarcia.site.backend.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

class NodeCompatibleJsonBytesTest {

    @Test
    void lowercasesOnlyRealUnicodeEscapes() {
        String source = "{\"escaped\":\"\\uD8AF\",\"literal\":\"\\\\uD8AF\","
            + "\"control\":\"\\u001F\",\"invalid\":\"\\uZZAF\"}";

        String normalized = new String(
            NodeCompatibleJsonBytes.normalize(source.getBytes(StandardCharsets.UTF_8)),
            StandardCharsets.UTF_8
        );

        assertThat(normalized).isEqualTo(
            "{\"escaped\":\"\\ud8af\",\"literal\":\"\\\\uD8AF\","
                + "\"control\":\"\\u001f\",\"invalid\":\"\\uZZAF\"}"
        );
    }
}

package br.com.rodogarcia.site.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class WhatwgUrlCompatibilityTest {

    @ParameterizedTest
    @CsvSource({
        "https://2130706433, https://127.0.0.1/",
        "https://0x7f000001, https://127.0.0.1/",
        "https://0177.0.0.1, https://127.0.0.1/",
        "https://127.1, https://127.0.0.1/"
    })
    void normalizesIpv4AlternativeNotationsLikeNode(String input, String expected) {
        WhatwgUrlCompatibility.ParsedUrl parsed = WhatwgUrlCompatibility.parse(input);

        assertThat(parsed.hostname()).isEqualTo("127.0.0.1");
        assertThat(parsed.serialized()).isEqualTo(expected);
    }

    @Test
    void appliesIdnaPercentEncodingAndHttpsDefaultPortSerialization() {
        WhatwgUrlCompatibility.ParsedUrl parsed = WhatwgUrlCompatibility.parse(
            "HTTPS://BÜCHER.Example:0443/a b/ü?q=olá mundo#seção final"
        );

        assertThat(parsed.protocol()).isEqualTo("https:");
        assertThat(parsed.hostname()).isEqualTo("xn--bcher-kva.example");
        assertThat(parsed.serialized()).isEqualTo(
            "https://xn--bcher-kva.example/a%20b/%C3%BC?q=ol%C3%A1%20mundo#se%C3%A7%C3%A3o%20final"
        );
    }

    @Test
    void preservesNonDefaultPortAndAddsTheSpecialUrlRootPath() {
        WhatwgUrlCompatibility.ParsedUrl parsed = WhatwgUrlCompatibility.parse(
            "https://EXAMPLE.com:444?enabled=true"
        );

        assertThat(parsed.hostname()).isEqualTo("example.com");
        assertThat(parsed.serialized()).isEqualTo("https://example.com:444/?enabled=true");
    }

    @Test
    void rejectsMalformedAbsoluteUrls() {
        assertThatThrownBy(() -> WhatwgUrlCompatibility.parse("not-an-absolute-url"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> WhatwgUrlCompatibility.parse("https://"))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> WhatwgUrlCompatibility.parse("https://example.com:65536"))
            .isInstanceOf(IllegalArgumentException.class);
    }
}

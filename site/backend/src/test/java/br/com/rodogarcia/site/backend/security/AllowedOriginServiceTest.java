package br.com.rodogarcia.site.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.util.Map;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AllowedOriginServiceTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void preservesConfiguredOriginsAsRawExactMatches() {
        AllowedOriginService service = serviceFor(Map.of(
            "FRONTEND_ORIGIN", "HTTPS://EXAMPLE.COM:443"
        ));

        assertThat(service.isAllowed("HTTPS://EXAMPLE.COM:443")).isTrue();
        assertThat(service.isAllowed("https://example.com/")).isFalse();
    }

    @Test
    void interpretsDevelopmentTunnelHostnamesAfterNodeUrlNormalization() {
        AllowedOriginService service = serviceFor(Map.of());

        assertThat(service.isAllowed(" HTTPS://FOO-123.BAR.DEVTUNNELS.MS:443 ")).isTrue();
        assertThat(service.isAllowed("https://foo.bar.devtunnels.ms")).isFalse();
        assertThat(service.isAllowed("http://foo-123.bar.devtunnels.ms")).isFalse();
        assertThat(service.isAllowed("https://foo-123.bar.devtunnels.ms.evil.example")).isFalse();
    }

    private AllowedOriginService serviceFor(Map<String, String> environment) {
        return new AllowedOriginService(ApplicationProperties.from(
            environment,
            temporaryDirectory.resolve("backend")
        ));
    }
}

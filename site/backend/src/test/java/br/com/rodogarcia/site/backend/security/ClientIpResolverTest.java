package br.com.rodogarcia.site.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.util.Map;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void ignoresForwardedForWhenTrustIsDisabled() {
        assertThat(resolve("false", "10.0.0.5", "198.51.100.1, 192.0.2.2"))
            .isEqualTo("10.0.0.5");
    }

    @Test
    void mirrorsTrustAllAndNumericHopSelection() {
        assertThat(resolve("true", "10.0.0.5", "198.51.100.1, 192.0.2.2"))
            .isEqualTo("198.51.100.1");
        assertThat(resolve("1", "10.0.0.5", "198.51.100.1, 192.0.2.2"))
            .isEqualTo("192.0.2.2");
        assertThat(resolve("2", "10.0.0.5", "198.51.100.1, 192.0.2.2"))
            .isEqualTo("198.51.100.1");
        assertThat(resolve("0x1", "10.0.0.5", "198.51.100.1, 192.0.2.2"))
            .isEqualTo("192.0.2.2");
        assertThat(resolve("2147483648", "10.0.0.5", "198.51.100.1, 192.0.2.2"))
            .isEqualTo("198.51.100.1");
    }

    @Test
    void joinsDuplicateForwardedForFieldsLikeNode() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.5");
        request.addHeader("X-Forwarded-For", "198.51.100.1");
        request.addHeader("X-Forwarded-For", "192.0.2.2");

        assertThat(new ClientIpResolver(properties("1")).resolve(request))
            .isEqualTo("192.0.2.2");
    }

    @Test
    void supportsTheExpressAliasesCidrsAndIpv4MappedAddresses() {
        assertThat(resolve("uniquelocal", "10.0.0.5", "198.51.100.1, 192.168.1.2"))
            .isEqualTo("198.51.100.1");
        assertThat(resolve("10.0.0.0/8, 192.168.0.0/16", "10.0.0.5", "198.51.100.1, 192.168.1.2"))
            .isEqualTo("198.51.100.1");
        assertThat(resolve("127.0.0.1/8", "::ffff:127.0.0.1", "203.0.113.9"))
            .isEqualTo("203.0.113.9");
        assertThat(resolve("127.000.000.001/8", "127.0.0.2", "203.0.113.9"))
            .isEqualTo("203.0.113.9");
    }

    @Test
    void failsAtBeanConstructionForAnInvalidExpressTrustExpression() {
        ApplicationProperties properties = properties("proxy.example.invalid");
        assertThatThrownBy(() -> new ClientIpResolver(properties))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("TRUST_PROXY");

        assertThatThrownBy(() -> new ClientIpResolver(properties("1f")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("TRUST_PROXY");

        assertThatThrownBy(() -> new ClientIpResolver(properties("0.0.0.0/0")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("TRUST_PROXY");
    }

    @Test
    void keepsForwardedTabsUntrustedAndCanonicalizesSocketIpv6LikeNode() {
        assertThat(resolve("loopback", "127.0.0.1", "198.51.100.1,\t127.0.0.2"))
            .isEqualTo("\t127.0.0.2");
        assertThat(resolve("false", "0:0:0:0:0:0:0:1", null)).isEqualTo("::1");
        assertThat(resolve("false", "2001:db8:0:0:0:0:0:1", null)).isEqualTo("2001:db8::1");
    }

    private String resolve(String trustProxy, String remote, String forwardedFor) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remote);
        if (forwardedFor != null) {
            request.addHeader("X-Forwarded-For", forwardedFor);
        }
        return new ClientIpResolver(properties(trustProxy)).resolve(request);
    }

    private ApplicationProperties properties(String trustProxy) {
        return ApplicationProperties.from(
            Map.of("TRUST_PROXY", trustProxy),
            temporaryDirectory.resolve("backend")
        );
    }
}

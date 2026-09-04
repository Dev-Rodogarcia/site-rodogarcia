package br.com.rodogarcia.cms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.util.Map;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTest {

    @TempDir
    Path root;

    @Test
    void followsExpressHopAndTrustListSemantics() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "198.51.100.10, 10.0.0.5");

        assertThat(resolver("false").resolve(request)).isEqualTo("127.0.0.1");
        assertThat(resolver("1").resolve(request)).isEqualTo("10.0.0.5");
        assertThat(resolver("2").resolve(request)).isEqualTo("198.51.100.10");
        assertThat(resolver("1.0").resolve(request)).isEqualTo("10.0.0.5");
        assertThat(resolver("1e0").resolve(request)).isEqualTo("10.0.0.5");
        assertThat(resolver("0x1").resolve(request)).isEqualTo("10.0.0.5");
        assertThat(resolver("true").resolve(request)).isEqualTo("198.51.100.10");
        assertThat(resolver("loopback").resolve(request)).isEqualTo("10.0.0.5");
        assertThat(resolver("loopback, uniquelocal").resolve(request))
            .isEqualTo("198.51.100.10");
        assertThat(resolver("127.0.0.0/8, 10.0.0.0/8").resolve(request))
            .isEqualTo("198.51.100.10");
        assertThat(resolver("127.0.0.0/255.0.0.0, 10.0.0.0/255.0.0.0").resolve(request))
            .isEqualTo("198.51.100.10");
    }

    @Test
    void rejectsAnInvalidProxyAddrRuleAtStartup() {
        assertThatThrownBy(() -> resolver("not-a-proxy-range"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("TRUST_PROXY");
        assertThatThrownBy(() -> resolver("deadbeef"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("TRUST_PROXY");
        assertThatThrownBy(() -> resolver("0.0.0.0/0"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("TRUST_PROXY");
        assertThatThrownBy(() -> resolver("10.0.0.0/255.255.0.255"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("TRUST_PROXY");
    }

    @Test
    void combinesEveryForwardedForHeaderInWireOrder() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "198.51.100.10, 192.168.0.4");
        request.addHeader("X-Forwarded-For", "10.0.0.5");

        assertThat(resolver("1").resolve(request)).isEqualTo("10.0.0.5");
        assertThat(resolver("2").resolve(request)).isEqualTo("192.168.0.4");
        assertThat(resolver("3").resolve(request)).isEqualTo("198.51.100.10");
    }

    private ClientIpResolver resolver(String setting) {
        CmsProperties properties = CmsProperties.from(
            Map.of("TRUST_PROXY", setting), root.resolve("repo/cms/backend"));
        return new ClientIpResolver(properties);
    }
}

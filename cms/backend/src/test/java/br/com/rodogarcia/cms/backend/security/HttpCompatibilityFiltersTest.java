package br.com.rodogarcia.cms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class HttpCompatibilityFiltersTest {

    @TempDir
    Path root;

    @Test
    void emitsTheHelmetEightApiHeadersWithoutIdentifyingSpring() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        new SecurityHeadersFilter().doFilter(
            new MockHttpServletRequest("GET", "/health"), response,
            (request, target) -> ((jakarta.servlet.http.HttpServletResponse) target).setStatus(200)
        );

        assertThat(response.getHeader("Content-Security-Policy")).isEqualTo(
            "default-src 'self';base-uri 'self';font-src 'self' https: data:;"
                + "form-action 'self';frame-ancestors 'self';img-src 'self' data:;"
                + "object-src 'none';script-src 'self';script-src-attr 'none';"
                + "style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"
        );
        assertThat(response.getHeader("Cross-Origin-Opener-Policy")).isEqualTo("same-origin");
        assertThat(response.getHeader("Cross-Origin-Resource-Policy")).isEqualTo("cross-origin");
        assertThat(response.getHeader("Referrer-Policy")).isEqualTo("no-referrer");
        assertThat(response.getHeader("Strict-Transport-Security"))
            .isEqualTo("max-age=31536000; includeSubDomains");
        assertThat(response.getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(response.getHeader("X-Frame-Options")).isEqualTo("SAMEORIGIN");
        assertThat(response.getHeader("X-Powered-By")).isNull();
        assertThat(response.getHeader("Permissions-Policy")).isNull();
    }

    @Test
    void returnsTheCorsPreflightBeforeMvcOnlyForAllowedOrigins() throws Exception {
        RequestPolicy policy = new RequestPolicy(CmsProperties.from(Map.of(
            "FRONTEND_ORIGIN", "http://127.0.0.1:35180"
        ), root.resolve("repo/cms/backend")));
        CorsCompatibilityFilter filter = new CorsCompatibilityFilter(policy);
        MockHttpServletRequest allowed = new MockHttpServletRequest("OPTIONS", "/api/contact");
        allowed.addHeader("Origin", "http://127.0.0.1:35180");
        allowed.addHeader("Access-Control-Request-Headers", "x-csrf-token, content-type");
        MockHttpServletResponse allowedResponse = new MockHttpServletResponse();
        AtomicBoolean allowedChain = new AtomicBoolean();

        filter.doFilter(allowed, allowedResponse,
            (request, response) -> allowedChain.set(true));

        assertThat(allowedChain).isFalse();
        assertThat(allowedResponse.getStatus()).isEqualTo(204);
        assertThat(allowedResponse.getHeader("Access-Control-Allow-Origin"))
            .isEqualTo("http://127.0.0.1:35180");
        assertThat(allowedResponse.getHeader("Access-Control-Allow-Credentials")).isEqualTo("true");
        assertThat(allowedResponse.getHeader("Access-Control-Allow-Methods"))
            .isEqualTo("GET,HEAD,PUT,PATCH,POST,DELETE");
        assertThat(allowedResponse.getHeader("Access-Control-Allow-Headers"))
            .isEqualTo("x-csrf-token, content-type");
        assertThat(allowedResponse.getHeader("Vary"))
            .isEqualTo("Origin, Access-Control-Request-Headers");

        MockHttpServletRequest blocked = new MockHttpServletRequest("OPTIONS", "/api/contact");
        blocked.addHeader("Origin", "https://evil.example");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        AtomicBoolean blockedChain = new AtomicBoolean();
        filter.doFilter(blocked, blockedResponse,
            (request, response) -> blockedChain.set(true));

        assertThat(blockedChain).isTrue();
        assertThat(blockedResponse.getHeader("Access-Control-Allow-Origin")).isNull();
        assertThat(blockedResponse.getHeader("Vary")).isNull();
    }

    @Test
    void normalizesOneTrailingSlashExceptForStaticUploads() throws Exception {
        TrailingSlashCompatibilityFilter filter = new TrailingSlashCompatibilityFilter();
        AtomicReference<String> observed = new AtomicReference<>();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/contact/"),
            new MockHttpServletResponse(), (request, response) -> observed.set(
                ((jakarta.servlet.http.HttpServletRequest) request).getRequestURI()));
        assertThat(observed).hasValue("/api/contact");

        filter.doFilter(new MockHttpServletRequest("GET", "/UPLOADS/file.webp/"),
            new MockHttpServletResponse(), (request, response) -> observed.set(
                ((jakarta.servlet.http.HttpServletRequest) request).getRequestURI()));
        assertThat(observed).hasValue("/UPLOADS/file.webp/");

        filter.doFilter(new MockHttpServletRequest("GET", "/api/contact//"),
            new MockHttpServletResponse(), (request, response) -> observed.set(
                ((jakarta.servlet.http.HttpServletRequest) request).getRequestURI()));
        assertThat(observed).hasValue("/api/contact//");

        filter.doFilter(new MockHttpServletRequest("GET", "/api/items/id;matrix=value/"),
            new MockHttpServletResponse(), (request, response) -> observed.set(
                ((jakarta.servlet.http.HttpServletRequest) request).getRequestURI()));
        assertThat(observed).hasValue("/api/items/id%3Bmatrix=value");
    }
}

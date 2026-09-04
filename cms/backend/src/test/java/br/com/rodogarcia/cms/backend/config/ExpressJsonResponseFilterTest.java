package br.com.rodogarcia.cms.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class ExpressJsonResponseFilterTest {

    private static final byte[] HEALTH = "{\"ok\":true}".getBytes(StandardCharsets.UTF_8);
    private static final String HEALTH_ETAG = "W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"";
    private final ExpressJsonResponseFilter filter = new ExpressJsonResponseFilter();

    @Test
    void writesTheSameWeakEntityTagCharsetAndLengthAsExpress() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, target) -> {
            var http = (jakarta.servlet.http.HttpServletResponse) target;
            http.setContentType("application/json");
            http.getOutputStream().write(HEALTH);
        });

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeader("ETag")).isEqualTo(HEALTH_ETAG);
        assertThat(response.getHeader("Content-Length")).isEqualTo("11");
        assertThat(response.getContentType()).isEqualTo("application/json; charset=utf-8");
        assertThat(response.getContentAsByteArray()).isEqualTo(HEALTH);
    }

    @Test
    void turnsMatchingConditionalGetsIntoExpressStyleNotModifiedResponses() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health");
        request.addHeader("If-None-Match", HEALTH_ETAG);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, target) -> {
            var http = (jakarta.servlet.http.HttpServletResponse) target;
            http.setHeader("Vary", "Origin");
            http.setContentType("application/json");
            http.getOutputStream().write(HEALTH);
        });

        assertThat(response.getStatus()).isEqualTo(304);
        assertThat(response.getHeader("ETag")).isEqualTo(HEALTH_ETAG);
        assertThat(response.getHeader("Vary")).isEqualTo("Origin");
        assertThat(response.getHeader("Content-Type")).isNull();
        assertThat(response.getHeader("Content-Length")).isNull();
        assertThat(response.getContentAsByteArray()).isEmpty();
    }
}

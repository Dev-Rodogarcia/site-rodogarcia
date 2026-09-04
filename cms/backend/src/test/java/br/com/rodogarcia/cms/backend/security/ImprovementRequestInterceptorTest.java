package br.com.rodogarcia.cms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.service.ImprovementService;
import br.com.rodogarcia.cms.backend.service.RateLimitService;
import br.com.rodogarcia.cms.backend.support.DomainTestContext;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class ImprovementRequestInterceptorTest {
    @TempDir
    Path root;

    @Test
    void appliesPublicOriginRateAndDeclaredLengthInNodeOrder() {
        DomainTestContext context = new DomainTestContext(
            root,
            Clock.fixed(Instant.parse("2026-03-02T00:00:00Z"), ZoneOffset.UTC),
            Map.of()
        );
        ImprovementRequestInterceptor interceptor = new ImprovementRequestInterceptor(
            new RequestPolicy(context.properties),
            context.rateLimits,
            context.clientIp
        );
        MockHttpServletRequest request = publicRequest();
        request.setRequestURI("/API/IMPROVEMENTS/");
        request.addHeader("Content-Length", "invalid");

        assertThatThrownBy(() -> interceptor.preHandle(
            request,
            new MockHttpServletResponse(),
            new Object()
        ))
            .isInstanceOf(ApiException.class)
            .satisfies(error -> assertThat(((ApiException) error).status()).isEqualTo(400))
            .hasMessage("Content-Length inválido.");

        String clientIp = context.clientIp.resolve(request);
        assertThat(context.rateLimits.state(
            "improvement",
            clientIp,
            RateLimitService.IMPROVEMENT
        ).count()).isEqualTo(1);
    }

    @Test
    void rejectsOriginBeforeRateAndRejectsOversizedAdminMultipart() {
        DomainTestContext context = new DomainTestContext(
            root,
            Clock.fixed(Instant.parse("2026-03-02T00:00:00Z"), ZoneOffset.UTC),
            Map.of()
        );
        ImprovementRequestInterceptor interceptor = new ImprovementRequestInterceptor(
            new RequestPolicy(context.properties),
            context.rateLimits,
            context.clientIp
        );
        MockHttpServletRequest publicRequest = publicRequest();
        publicRequest.removeHeader("Origin");

        assertThatThrownBy(() -> interceptor.preHandle(
            publicRequest,
            new MockHttpServletResponse(),
            new Object()
        ))
            .isInstanceOf(ApiException.class)
            .satisfies(error -> assertThat(((ApiException) error).status()).isEqualTo(403));
        assertThat(context.rateLimits.state(
            "improvement",
            context.clientIp.resolve(publicRequest),
            RateLimitService.IMPROVEMENT
        ).count()).isZero();

        MockHttpServletRequest adminRequest = new MockHttpServletRequest(
            "POST",
            "/api/admin/improvements"
        );
        adminRequest.addHeader("Content-Length", ImprovementService.MAX_REQUEST_BYTES + 1);
        assertThatThrownBy(() -> interceptor.preHandle(
            adminRequest,
            new MockHttpServletResponse(),
            new Object()
        ))
            .isInstanceOf(ApiException.class)
            .satisfies(error -> assertThat(((ApiException) error).status()).isEqualTo(413))
            .hasMessage("Arquivo ou payload excede o limite permitido.");
    }

    private static MockHttpServletRequest publicRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/improvements");
        request.setRemoteAddr("198.51.100.9");
        request.addHeader("Origin", "http://127.0.0.1:35180");
        return request;
    }
}

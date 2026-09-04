package br.com.rodogarcia.cms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.rodogarcia.cms.backend.controller.FallbackController;
import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.exception.GlobalExceptionHandler;
import br.com.rodogarcia.cms.backend.service.RateLimitService;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

class CmsSecurityInterceptorTest {

    @Test
    void preservesAdminAuthPermissionOriginJsonAndCsrfOrder() {
        Fixture fixture = new Fixture("POST", "/api/admin/content");

        assertThat(fixture.invoke()).isTrue();

        InOrder order = inOrder(fixture.security, fixture.policy);
        order.verify(fixture.security).requireAdmin(fixture.request, fixture.response);
        order.verify(fixture.security).requirePermission(fixture.request, "dashboard");
        order.verify(fixture.policy).requireAllowedOrigin(fixture.request);
        order.verify(fixture.policy).requireJson(fixture.request);
        order.verify(fixture.security).requireCsrf(fixture.request);
    }

    @Test
    void doesNotRunRouteMiddlewareForAnUnsupportedMutationMethod() {
        Fixture fixture = new Fixture("PATCH", "/api/admin/content");

        assertThat(fixture.invoke()).isTrue();

        verify(fixture.security).requireAdmin(fixture.request, fixture.response);
        verify(fixture.security).requirePermission(fixture.request, "dashboard");
        verify(fixture.security, never()).requireCsrf(fixture.request);
        verifyNoInteractions(fixture.policy);
    }

    @Test
    void keepsPermissionLookupCaseSensitiveBeforeCaseInsensitiveRouteMatching() {
        Fixture fixture = new Fixture("GET", "/api/admin/HOME");

        assertThatThrownBy(fixture::invoke)
            .isInstanceOf(ApiException.class)
            .satisfies(error -> assertThat(((ApiException) error).status()).isEqualTo(403))
            .hasMessage("Recurso administrativo sem permissão cadastrada.");

        verify(fixture.security).requireAdmin(fixture.request, fixture.response);
        verify(fixture.security, never()).requirePermission(fixture.request, "home");
    }

    @Test
    void runsSupremeBeforeMutationGuardsAndLandingLengthAfterCsrf() {
        Fixture identity = new Fixture("POST", "/api/admin/users");
        assertThat(identity.invoke()).isTrue();
        InOrder identityOrder = inOrder(identity.security, identity.policy);
        identityOrder.verify(identity.security).requireAdmin(identity.request, identity.response);
        identityOrder.verify(identity.security).requirePermission(identity.request, "users");
        identityOrder.verify(identity.security).requireSupreme(identity.request);
        identityOrder.verify(identity.policy).requireAllowedOrigin(identity.request);
        identityOrder.verify(identity.policy).requireJson(identity.request);
        identityOrder.verify(identity.security).requireCsrf(identity.request);

        Fixture media = new Fixture("POST", "/api/admin/landing-media");
        assertThat(media.invoke()).isTrue();
        InOrder mediaOrder = inOrder(media.security, media.policy);
        mediaOrder.verify(media.security).requireAdmin(media.request, media.response);
        mediaOrder.verify(media.security).requirePermission(media.request, "landing-pages");
        mediaOrder.verify(media.policy).requireAllowedOrigin(media.request);
        mediaOrder.verify(media.security).requireCsrf(media.request);
        mediaOrder.verify(media.policy).requireContentLength(
            media.request,
            AdminRouteContract.LANDING_MEDIA_MAX_REQUEST_BYTES
        );
        verify(media.policy, never()).requireJson(media.request);
    }

    @Test
    void authenticatesBeforeContentTypeEvenWhenConsumesMakesMvcChooseTheFallback() throws Exception {
        AdminSecurity unauthenticatedSecurity = mock(AdminSecurity.class);
        RequestPolicy unauthenticatedPolicy = mock(RequestPolicy.class);
        CmsSecurityInterceptor unauthenticated = interceptor(
            unauthenticatedSecurity,
            unauthenticatedPolicy
        );
        doThrow(new ApiException(401, "Nao autenticado."))
            .when(unauthenticatedSecurity).requireAdmin(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
            );

        mvc(unauthenticated).perform(put("/api/admin/home/hero")
                .contentType(MediaType.TEXT_PLAIN)
                .content("not-json"))
            .andExpect(status().isUnauthorized())
            .andExpect(content().json("{\"error\":\"Nao autenticado.\"}"));
        verifyNoInteractions(unauthenticatedPolicy);

        AdminSecurity authenticatedSecurity = mock(AdminSecurity.class);
        RequestPolicy authenticatedPolicy = mock(RequestPolicy.class);
        CmsSecurityInterceptor authenticated = interceptor(authenticatedSecurity, authenticatedPolicy);
        doThrow(new ApiException(415, "Content-Type deve ser application/json."))
            .when(authenticatedPolicy).requireJson(org.mockito.ArgumentMatchers.any());

        mvc(authenticated).perform(put("/api/admin/home/hero")
                .contentType(MediaType.TEXT_PLAIN)
                .content("not-json"))
            .andExpect(status().isUnsupportedMediaType())
            .andExpect(content().json(
                "{\"error\":\"Content-Type deve ser application/json.\"}"
            ));
        InOrder order = inOrder(authenticatedSecurity, authenticatedPolicy);
        order.verify(authenticatedSecurity).requireAdmin(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()
        );
        order.verify(authenticatedSecurity).requirePermission(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.eq("home")
        );
        order.verify(authenticatedPolicy).requireAllowedOrigin(
            org.mockito.ArgumentMatchers.any()
        );
        order.verify(authenticatedPolicy).requireJson(org.mockito.ArgumentMatchers.any());
        verify(authenticatedSecurity, never()).requireCsrf(
            org.mockito.ArgumentMatchers.any()
        );
    }

    private static CmsSecurityInterceptor interceptor(
        AdminSecurity security,
        RequestPolicy policy
    ) {
        return new CmsSecurityInterceptor(
            security,
            policy,
            mock(RateLimitService.class),
            mock(ClientIpResolver.class)
        );
    }

    private static MockMvc mvc(CmsSecurityInterceptor interceptor) {
        return MockMvcBuilders.standaloneSetup(
                new JsonConsumesController(),
                new FallbackController()
            )
            .addInterceptors(interceptor)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    private static final class Fixture {
        private final AdminSecurity security = mock(AdminSecurity.class);
        private final RequestPolicy policy = mock(RequestPolicy.class);
        private final MockHttpServletRequest request;
        private final MockHttpServletResponse response = new MockHttpServletResponse();
        private final CmsSecurityInterceptor interceptor;

        private Fixture(String method, String path) {
            request = new MockHttpServletRequest(method, path);
            interceptor = interceptor(security, policy);
        }

        private boolean invoke() {
            return interceptor.preHandle(request, response, new Object());
        }
    }

    @RestController
    static class JsonConsumesController {
        @PutMapping(
            value = "/api/admin/home/{section}",
            consumes = MediaType.APPLICATION_JSON_VALUE
        )
        void update(@PathVariable String section) {
        }
    }
}

package br.com.rodogarcia.cms.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CmsSecurityInterceptorLandingBuilderTest {

    @Test
    void requiresJsonOnlyForLandingMutationsThatUseAJsonBody() {
        assertThat(policy("/landings", "POST").requiresJson()).isTrue();
        assertThat(policy("/landings/id", "PUT").requiresJson()).isTrue();
        assertThat(policy("/landings/id/publish", "POST").requiresJson()).isFalse();
        assertThat(policy("/landings/id/unpublish", "POST").requiresJson()).isFalse();
        assertThat(policy("/landing-media", "POST").requiresJson()).isFalse();
        assertThat(policy("/landing-media/id", "DELETE").requiresJson()).isFalse();
    }

    private static AdminRouteContract.MutationPolicy policy(String path, String method) {
        return AdminRouteContract.mutationPolicy(path, method);
    }
}

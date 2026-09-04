package br.com.rodogarcia.cms.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;

import br.com.rodogarcia.cms.backend.service.CmsReadinessService;
import org.junit.jupiter.api.Test;

class HealthControllerTest {

    @Test
    void keepsLivenessIndependentFromReadiness() {
        CmsReadinessService readiness = mock(CmsReadinessService.class);
        when(readiness.isReady()).thenReturn(false);
        HealthController controller = new HealthController(readiness);

        assertThat(controller.health()).isEqualTo(Map.of("ok", true));
        assertThat(controller.ready().getStatusCode().value()).isEqualTo(503);
        assertThat(controller.ready().getBody()).isEqualTo(Map.of("ok", false));
    }

    @Test
    void returnsTheExistingReadyEnvelopeWhenAllDependenciesPass() {
        CmsReadinessService readiness = mock(CmsReadinessService.class);
        when(readiness.isReady()).thenReturn(true);
        HealthController controller = new HealthController(readiness);

        assertThat(controller.ready().getStatusCode().value()).isEqualTo(200);
        assertThat(controller.ready().getBody()).isEqualTo(Map.of("ok", true));
    }
}

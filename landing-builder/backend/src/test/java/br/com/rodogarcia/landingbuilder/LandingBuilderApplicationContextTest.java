package br.com.rodogarcia.landingbuilder;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.rodogarcia.landingbuilder.service.CampaignService;
import br.com.rodogarcia.landingbuilder.service.LandingMediaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.MOCK,
    properties = {
        "NODE_ENV=test",
        "LANDING_BUILDER_STORAGE_ROOT=${java.io.tmpdir}/rodogarcia-landing-builder-context-test",
        "LANDING_BUILDER_SERVICE_TOKEN=test-service-token-with-at-least-thirty-two-characters"
    }
)
class LandingBuilderApplicationContextTest {

    @Autowired
    private ApplicationContext context;

    @Test
    void wiresTheMvcRuntimeWithoutOpeningAnExternalPort() {
        assertThat(context.getBean(CampaignService.class)).isNotNull();
        assertThat(context.getBean(LandingMediaService.class)).isNotNull();
    }
}

package br.com.rodogarcia.landingbuilder.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;

class LandingBuilderPropertiesTest {

    @Test
    void retainsNodeEnvironmentPrecedenceAndDefaults() {
        LandingBuilderProperties properties = new LandingBuilderProperties(Map.of(
            "LANDING_BUILDER_HOST", "127.0.0.2",
            "HOST", "127.0.0.3",
            "LANDING_BUILDER_PORT", "36111",
            "PORT", "36112"
        ));

        assertThat(properties.host()).isEqualTo("127.0.0.2");
        assertThat(properties.port()).isEqualTo(36111);
        assertThat(properties.isProduction()).isFalse();
    }

    @Test
    void rejectsInvalidProductionConfiguration() {
        assertThatThrownBy(() -> new LandingBuilderProperties(Map.of(
            "NODE_ENV", "production",
            "LANDING_BUILDER_SERVICE_TOKEN", "placeholder",
            "LANDING_BUILDER_STORAGE_ROOT", "storage"
        ))).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void readsTheLocalDotenvButLetsTheProcessEnvironmentWin(@TempDir Path directory) throws Exception {
        Files.writeString(directory.resolve(".env"), """
            LANDING_BUILDER_HOST=127.0.0.7
            LANDING_BUILDER_PORT=36119
            LANDING_BUILDER_SERVICE_TOKEN=file-token
            """);

        Map<String, String> values = LandingBuilderProperties.environmentValues(
            new MockEnvironment().withProperty("LANDING_BUILDER_PORT", "36120"),
            directory
        );

        assertThat(values).containsEntry("LANDING_BUILDER_HOST", "127.0.0.7");
        assertThat(values).containsEntry("LANDING_BUILDER_SERVICE_TOKEN", "file-token");
        assertThat(values).containsEntry("LANDING_BUILDER_PORT", "36120");
    }
}

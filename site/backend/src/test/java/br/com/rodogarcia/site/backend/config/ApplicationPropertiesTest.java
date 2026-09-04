package br.com.rodogarcia.site.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ApplicationPropertiesTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void usesTheCanonicalBackendAsProjectAndStorageRoot() {
        Path backendRoot = temporaryDirectory.resolve("site").resolve("backend");

        ApplicationProperties properties = ApplicationProperties.from(Map.of(), backendRoot);

        assertThat(properties.port()).isEqualTo(31012);
        assertThat(properties.projectRoot()).isEqualTo(backendRoot.toAbsolutePath().normalize());
        assertThat(properties.backendRoot()).isEqualTo(backendRoot.toAbsolutePath().normalize());
        assertThat(properties.storageRoot()).isEqualTo(
            properties.backendRoot().resolve("storage")
        );
        assertThat(properties.rateLimitsStorePath()).isEqualTo(
            properties.backendRoot().resolve("storage/private/rate-limits.json")
        );
        assertThat(properties.eslGraphqlUrl())
            .isEqualTo("https://rodogarcia.eslcloud.com.br/graphql");
    }

    @Test
    void keepsRelativeStorageOverridesAnchoredToTheCanonicalBackend() {
        Path backendRoot = temporaryDirectory.resolve("site").resolve("backend");
        Map<String, String> environment = new HashMap<>();
        environment.put("STORAGE_ROOT", "runtime-storage");
        environment.put("RATE_LIMITS_STORE_PATH", "limits/rate-limits.json");

        ApplicationProperties properties = ApplicationProperties.from(environment, backendRoot);

        assertThat(properties.storageRoot())
            .isEqualTo(properties.backendRoot().resolve("runtime-storage"));
        assertThat(properties.rateLimitsStorePath())
            .isEqualTo(properties.backendRoot().resolve("limits/rate-limits.json"));
    }

    @Test
    void preservesNodeEmptyStringCoercionForStorageOverrides() {
        Path backendRoot = temporaryDirectory.resolve("site").resolve("backend");

        ApplicationProperties properties = ApplicationProperties.from(
            Map.of("STORAGE_ROOT", "", "RATE_LIMITS_STORE_PATH", ""),
            backendRoot
        );

        assertThat(properties.storageRoot())
            .isEqualTo(properties.backendRoot());
        assertThat(properties.rateLimitsStorePath())
            .isEqualTo(properties.backendRoot().resolve("private/rate-limits.json"));
    }

    @Test
    void keepsJavascriptLikeEmptyPortCoercionAndProductionHardening() {
        ApplicationProperties development = ApplicationProperties.from(
            Map.of("PORT", "   "),
            temporaryDirectory.resolve("backend")
        );
        assertThat(development.port()).isZero();
        assertThat(ApplicationProperties.from(
            Map.of("PORT", "0x10"),
            temporaryDirectory.resolve("backend")
        ).port()).isEqualTo(16);
        assertThat(ApplicationProperties.from(
            Map.of("PORT", "1f"),
            temporaryDirectory.resolve("backend")
        ).port()).isEqualTo(31012);
        assertThat(ApplicationProperties.from(
            Map.of("PORT", "0x1.0p0"),
            temporaryDirectory.resolve("backend")
        ).port()).isEqualTo(31012);
        assertThat(ApplicationProperties.from(
            Map.of("PORT", "\ufeff16\u00a0"),
            temporaryDirectory.resolve("backend")
        ).port()).isEqualTo(16);
        assertThatThrownBy(() -> ApplicationProperties.from(
            Map.of("PORT", "1.5"),
            temporaryDirectory.resolve("backend")
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("PORT");
        assertThatThrownBy(() -> ApplicationProperties.from(
            Map.of("PORT", "65536"),
            temporaryDirectory.resolve("backend")
        )).isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("PORT");

        assertThatThrownBy(() -> ApplicationProperties.from(
            Map.of(
                "NODE_ENV", "production",
                "FRONTEND_ORIGIN", "http://localhost:3000",
                "ESL_OPERATION_SECRET", "fraco"
            ),
            temporaryDirectory.resolve("backend")
        )).isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Configuração de produção insegura")
            .hasMessageContaining("HTTPS")
            .hasMessageContaining("32 caracteres");

        assertThatThrownBy(() -> ApplicationProperties.from(
            Map.of(
                "NODE_ENV", "production",
                "FRONTEND_ORIGIN", "https://LOCALHOST",
                "ESL_OPERATION_SECRET", "segredo-forte-com-pelo-menos-32-caracteres"
            ),
            temporaryDirectory.resolve("backend")
        )).isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("localhost");
    }

    @Test
    void saturatesHugeNumericTrustProxyHopCountsWithoutOverflowing() {
        ApplicationProperties properties = ApplicationProperties.from(
            Map.of("TRUST_PROXY", "2147483648"),
            temporaryDirectory.resolve("backend")
        );

        assertThat(properties.trustProxy().mode()).isEqualTo(TrustProxySetting.Mode.HOPS);
        assertThat(properties.trustProxy().hops()).isEqualTo(Integer.MAX_VALUE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://2130706433", "https://0x7f000001"})
    void rejectsWhatwgIpv4LoopbackAliasesInProduction(String frontendOrigin) {
        assertThatThrownBy(() -> ApplicationProperties.from(
            Map.of(
                "NODE_ENV", "production",
                "FRONTEND_ORIGIN", frontendOrigin,
                "ESL_OPERATION_SECRET", "segredo-forte-com-pelo-menos-32-caracteres"
            ),
            temporaryDirectory.resolve("backend")
        )).isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("localhost");
    }

    @Test
    void serializesTheConfiguredGraphqlUrlLikeNodeWhatwgUrl() {
        ApplicationProperties properties = ApplicationProperties.from(
            Map.of(
                "ESL_GRAPHQL_URL",
                "HTTPS://BÜCHER.Example:0443/graphql com espaço?q=olá mundo"
            ),
            temporaryDirectory.resolve("backend")
        );

        assertThat(properties.eslGraphqlUrl()).isEqualTo(
            "https://xn--bcher-kva.example/graphql%20com%20espa%C3%A7o?q=ol%C3%A1%20mundo"
        );
    }
}

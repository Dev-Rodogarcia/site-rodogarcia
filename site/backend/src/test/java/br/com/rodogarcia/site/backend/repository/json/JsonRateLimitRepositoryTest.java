package br.com.rodogarcia.site.backend.repository.json;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.model.RateLimitPolicy;
import br.com.rodogarcia.site.backend.model.RateLimitState;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.json.JsonMapper;

class JsonRateLimitRepositoryTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void hashesTheRawIpAndBlocksBeforeTheThirdHit() throws Exception {
        Path file = temporaryDirectory.resolve("rate-limits.json");
        ApplicationProperties properties = ApplicationProperties.from(
            Map.of(
                "STORAGE_ROOT", temporaryDirectory.toString(),
                "RATE_LIMITS_STORE_PATH", file.toString()
            ),
            temporaryDirectory.resolve("backend")
        );
        JsonMapper mapper = JsonMapper.builder().build();
        JsonRateLimitRepository repository = new JsonRateLimitRepository(
            new NodeCompatibleJsonStore(mapper),
            mapper,
            properties,
            Clock.fixed(Instant.ofEpochMilli(1_000), ZoneOffset.UTC)
        );
        RateLimitPolicy policy = new RateLimitPolicy("test", Duration.ofHours(1), 2, "blocked");

        RateLimitState first = repository.inspectAndHit("::ffff:127.0.0.1", policy);
        RateLimitState second = repository.inspectAndHit("::ffff:127.0.0.1", policy);
        RateLimitState blocked = repository.inspectAndHit("::ffff:127.0.0.1", policy);

        assertThat(first).isEqualTo(new RateLimitState(true, 1, 3_601_000, 1));
        assertThat(second).isEqualTo(new RateLimitState(true, 2, 3_601_000, 0));
        assertThat(blocked).isEqualTo(new RateLimitState(false, 2, 3_601_000, 0));
        assertThat(Files.readString(file)).contains("\"test:3e48ef9d22e096da\"");
    }

    @Test
    void defaultConfigurationWritesOnlyToTheCanonicalBackendStorage() throws Exception {
        Path siteRoot = temporaryDirectory.resolve("site");
        Path backendRoot = siteRoot.resolve("backend");
        Path siblingStorage = siteRoot.resolve("unrelated-service").resolve("storage");
        Files.createDirectories(siblingStorage);
        Path sentinel = siblingStorage.resolve("sentinel.txt");
        Files.writeString(sentinel, "unchanged");

        ApplicationProperties properties = ApplicationProperties.from(Map.of(), backendRoot);
        JsonMapper mapper = JsonMapper.builder().build();
        JsonRateLimitRepository repository = new JsonRateLimitRepository(
            new NodeCompatibleJsonStore(mapper),
            mapper,
            properties,
            Clock.fixed(Instant.ofEpochMilli(1_000), ZoneOffset.UTC)
        );

        repository.inspectAndHit(
            "127.0.0.1",
            new RateLimitPolicy("canonical", Duration.ofMinutes(1), 1, "blocked")
        );

        Path canonicalStore = backendRoot.resolve("storage/private/rate-limits.json")
            .toAbsolutePath()
            .normalize();
        assertThat(properties.rateLimitsStorePath()).isEqualTo(canonicalStore);
        assertThat(canonicalStore).exists();
        assertThat(siblingStorage.resolve("private/rate-limits.json")).doesNotExist();
        assertThat(Files.readString(sentinel)).isEqualTo("unchanged");
        try (var entries = Files.list(siblingStorage)) {
            assertThat(entries.toList()).containsExactly(sentinel);
        }
    }
}

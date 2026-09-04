package br.com.rodogarcia.cms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.support.DomainTestContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RateLimitServiceTest {

    @TempDir Path root;

    @Test
    void checksAndRegistersConcurrentAttemptsAtomically() throws Exception {
        DomainTestContext context = new DomainTestContext(
            root,
            Clock.fixed(Instant.parse("2026-09-03T12:00:00Z"), ZoneOffset.UTC),
            Map.of()
        );
        int attempts = 32;
        CountDownLatch ready = new CountDownLatch(attempts);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        try (var executor = Executors.newFixedThreadPool(attempts)) {
            for (int index = 0; index < attempts; index++) {
                results.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    try {
                        context.rateLimits.require(
                            "concurrent", "same-client", RateLimitService.LEAD, "limit");
                        return true;
                    } catch (ApiException error) {
                        assertThat(error.status()).isEqualTo(429);
                        return false;
                    }
                }));
            }
            ready.await();
            start.countDown();
            int accepted = 0;
            for (Future<Boolean> result : results) if (result.get()) accepted++;
            assertThat(accepted).isEqualTo(RateLimitService.LEAD.maxAttempts());
        }
        assertThat(context.rateLimits.state(
            "concurrent", "same-client", RateLimitService.LEAD).count())
            .isEqualTo(RateLimitService.LEAD.maxAttempts());
    }
}

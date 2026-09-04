package br.com.rodogarcia.site.backend.integration.esl;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

class EslRequestSchedulerTest {

    @Test
    void reservesStartSlotsTwoSecondsApartWithoutHoldingTheOperation() throws Exception {
        List<Long> waits = new ArrayList<>();
        EslRequestScheduler scheduler = new EslRequestScheduler(
            2_000,
            Clock.fixed(Instant.ofEpochMilli(1_000), ZoneOffset.UTC),
            waits::add
        );

        assertThat(scheduler.run(() -> "first")).isEqualTo("first");
        assertThat(scheduler.run(() -> "second")).isEqualTo("second");
        assertThat(scheduler.run(() -> "third")).isEqualTo("third");

        assertThat(waits).containsExactly(2_000L, 4_000L);
    }
}

package br.com.rodogarcia.cms.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import br.com.rodogarcia.cms.backend.service.ImprovementService;
import br.com.rodogarcia.cms.backend.service.MediaService;
import org.junit.jupiter.api.Test;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;

class ImprovementRetentionLifecycleTest {
    private static final Instant NOW = Instant.parse("2026-09-03T12:34:56.789Z");
    private static final long ONE_DAY_MILLIS = 24L * 60 * 60 * 1_000;

    private final MediaService media = mock(MediaService.class);
    private final ImprovementService improvements = mock(ImprovementService.class);
    private final ConfigurableApplicationContext applicationContext =
        mock(ConfigurableApplicationContext.class);
    private final ImprovementRetentionLifecycle lifecycle = new ImprovementRetentionLifecycle(
        media,
        improvements,
        Clock.fixed(NOW, ZoneOffset.UTC),
        applicationContext
    );

    @Test
    void recoversInterruptedMediaTransactionBeforeBootRetention() {
        lifecycle.initialMaintenance();

        var ordered = inOrder(media, improvements);
        ordered.verify(media).recoverReferenceTransaction();
        ordered.verify(improvements).runRetention(NOW);
    }

    @Test
    void abortsBootRetentionWhenRecoveryFails() {
        IllegalStateException failure = new IllegalStateException("journal unreadable");
        doThrow(failure).when(media).recoverReferenceTransaction();

        assertThatThrownBy(lifecycle::initialMaintenance).isSameAs(failure);
        verify(improvements, never()).runRetention(NOW);
        verify(applicationContext, never()).close();
    }

    @Test
    void propagatesBootRetentionFailureAfterRecovery() {
        IllegalStateException failure = new IllegalStateException("retention unavailable");
        doThrow(failure).when(improvements).runRetention(NOW);

        assertThatThrownBy(lifecycle::initialMaintenance).isSameAs(failure);
        var ordered = inOrder(media, improvements);
        ordered.verify(media).recoverReferenceTransaction();
        ordered.verify(improvements).runRetention(NOW);
        verify(applicationContext, never()).close();
    }

    @Test
    void runsEveryDayOnlyAfterTheImmediateBootMaintenance() throws Exception {
        Scheduled schedule = ImprovementRetentionLifecycle.class
            .getDeclaredMethod("scheduledRetention")
            .getAnnotation(Scheduled.class);

        assertThat(schedule.fixedRate()).isEqualTo(ONE_DAY_MILLIS);
        assertThat(schedule.initialDelay()).isEqualTo(ONE_DAY_MILLIS);

        lifecycle.scheduledRetention();
        verify(improvements).runRetention(NOW);
    }

    @Test
    void closesTheRuntimeAndPropagatesPeriodicRetentionFailures() {
        IllegalStateException failure = new IllegalStateException("retention unavailable");
        doThrow(failure).when(improvements).runRetention(NOW);

        assertThatThrownBy(lifecycle::scheduledRetention).isSameAs(failure);
        var ordered = inOrder(improvements, applicationContext);
        ordered.verify(improvements).runRetention(NOW);
        ordered.verify(applicationContext).close();
    }
}

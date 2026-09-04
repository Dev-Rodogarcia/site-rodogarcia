package br.com.rodogarcia.cms.backend.config;

import java.time.Clock;

import br.com.rodogarcia.cms.backend.service.ImprovementService;
import br.com.rodogarcia.cms.backend.service.MediaService;
import jakarta.annotation.PostConstruct;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
public class ImprovementRetentionLifecycle {
    private static final long RETENTION_INTERVAL_MILLIS = 24 * 60 * 60 * 1_000L;

    private final MediaService media;
    private final ImprovementService improvements;
    private final Clock clock;
    private final ConfigurableApplicationContext applicationContext;

    public ImprovementRetentionLifecycle(
        MediaService media,
        ImprovementService improvements,
        Clock clock,
        ConfigurableApplicationContext applicationContext
    ) {
        this.media = media;
        this.improvements = improvements;
        this.clock = clock;
        this.applicationContext = applicationContext;
    }

    @PostConstruct
    void initialMaintenance() {
        media.recoverReferenceTransaction();
        improvements.runRetention(clock.instant());
    }

    @Scheduled(
        fixedRate = RETENTION_INTERVAL_MILLIS,
        initialDelay = RETENTION_INTERVAL_MILLIS
    )
    void scheduledRetention() {
        try {
            improvements.runRetention(clock.instant());
        } catch (RuntimeException failure) {
            throw closeAfterFailure(failure);
        } catch (Error failure) {
            throw closeAfterFailure(failure);
        }
    }

    private <T extends Throwable> T closeAfterFailure(T failure) {
        try {
            applicationContext.close();
        } catch (RuntimeException closeFailure) {
            failure.addSuppressed(closeFailure);
        }
        return failure;
    }
}

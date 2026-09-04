package br.com.rodogarcia.site.backend.integration.esl;

import java.time.Clock;
import java.util.concurrent.Callable;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EslRequestScheduler {

    static final long DEFAULT_MINIMUM_INTERVAL_MILLIS = 2_000;

    @FunctionalInterface
    interface Waiter {
        void waitFor(long milliseconds) throws InterruptedException;
    }

    private final long minimumIntervalMillis;
    private final Clock clock;
    private final Waiter waiter;
    private long nextRequestAt;

    @Autowired
    public EslRequestScheduler(Clock clock) {
        this(DEFAULT_MINIMUM_INTERVAL_MILLIS, clock, Thread::sleep);
    }

    EslRequestScheduler(long minimumIntervalMillis, Clock clock, Waiter waiter) {
        this.minimumIntervalMillis = minimumIntervalMillis;
        this.clock = clock;
        this.waiter = waiter;
    }

    public <T> T run(Callable<T> operation) throws Exception {
        long requestedAt = clock.millis();
        long scheduledAt = reserve(requestedAt);
        if (scheduledAt > requestedAt) {
            waiter.waitFor(scheduledAt - requestedAt);
        }
        return operation.call();
    }

    private synchronized long reserve(long requestedAt) {
        long scheduledAt = Math.max(requestedAt, nextRequestAt);
        nextRequestAt = scheduledAt + minimumIntervalMillis;
        return scheduledAt;
    }
}

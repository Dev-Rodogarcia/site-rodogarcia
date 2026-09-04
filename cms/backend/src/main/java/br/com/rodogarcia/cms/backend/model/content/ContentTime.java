package br.com.rodogarcia.cms.backend.model.content;

import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

public final class ContentTime {
    private static final DateTimeFormatter ISO_MILLIS = new DateTimeFormatterBuilder()
        .appendInstant(3)
        .toFormatter();

    private ContentTime() {
    }

    public static String now(Clock clock) {
        return ISO_MILLIS.format(Instant.now(clock));
    }
}

package br.com.rodogarcia.cms.backend.utils;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;

public final class IsoTime {

    private static final DateTimeFormatter ISO_MILLIS = new DateTimeFormatterBuilder()
        .appendInstant(3)
        .toFormatter()
        .withZone(ZoneOffset.UTC);

    private IsoTime() {
    }

    public static String format(long epochMillis) {
        return ISO_MILLIS.format(Instant.ofEpochMilli(epochMillis));
    }
}

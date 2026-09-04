package br.com.rodogarcia.cms.backend.security;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.model.auth.SessionRecord;
import br.com.rodogarcia.cms.backend.repository.auth.SessionRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    public static final long SESSION_TTL_MS = 8L * 60 * 60 * 1_000;
    public static final String SESSION_COOKIE = "sid";

    private static final DateTimeFormatter COOKIE_DATE = DateTimeFormatter
        .ofPattern("EEE, dd MMM yyyy HH:mm:ss 'GMT'", java.util.Locale.ENGLISH)
        .withZone(ZoneOffset.UTC);

    private final SessionRepository repository;
    private final CmsProperties properties;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public SessionService(SessionRepository repository, CmsProperties properties, Clock clock) {
        this.repository = repository;
        this.properties = properties;
        this.clock = clock;
    }

    public SessionRecord create(String userId) {
        long now = clock.millis();
        SessionRecord session = new SessionRecord(
            randomHex(32),
            userId,
            randomHex(32),
            now,
            now + SESSION_TTL_MS
        );
        repository.save(session);
        return session;
    }

    public SessionRecord get(String id) {
        return repository.findAndRenew(id, SESSION_TTL_MS);
    }

    public void destroy(String id) {
        repository.delete(id);
    }

    public void setCookie(HttpServletResponse response, SessionRecord session) {
        response.addHeader("Set-Cookie", SESSION_COOKIE + "=" + session.getId()
            + "; Path=/; HttpOnly"
            + (properties.production() ? "; Secure" : "")
            + "; SameSite=Strict");
    }

    public void clearCookie(HttpServletResponse response) {
        response.addHeader(
            "Set-Cookie",
            SESSION_COOKIE + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
        );
        response.addHeader(
            "Set-Cookie",
            SESSION_COOKIE + "=; Max-Age=0; Path=/; Expires="
                + COOKIE_DATE.format(Instant.ofEpochMilli(clock.millis()))
                + "; HttpOnly"
                + (properties.production() ? "; Secure" : "")
                + "; SameSite=Strict"
        );
    }

    private String randomHex(int bytes) {
        byte[] value = new byte[bytes];
        random.nextBytes(value);
        return HexFormat.of().formatHex(value);
    }
}

package br.com.rodogarcia.landingbuilder.security;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Limite efêmero por processo, antes de token, JSON ou multipart. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public final class LandingRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_CLIENTS = 10_000;
    private static final long WINDOW_MILLIS = 60_000L;
    private final ObjectMapper mapper;
    private final Clock clock;
    private final Map<String, Bucket> publicBuckets = new LinkedHashMap<>();
    private final Map<String, Bucket> internalBuckets = new LinkedHashMap<>();

    @Autowired
    public LandingRateLimitFilter(ObjectMapper mapper) {
        this(mapper, Clock.systemUTC());
    }

    LandingRateLimitFilter(ObjectMapper mapper, Clock clock) {
        this.mapper = mapper;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(path.startsWith("/api/internal/")
            || path.startsWith("/api/public/")
            || path.startsWith("/landing-media/"));
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        boolean internal = request.getRequestURI().startsWith("/api/internal/");
        Result result = consume(internal ? internalBuckets : publicBuckets, clientKey(request), internal ? 60 : 120);
        if (!result.allowed()) {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Retry-After", String.valueOf(result.retryAfterSeconds()));
            mapper.writeValue(response.getOutputStream(), Map.of("error", "Muitas solicitações. Tente novamente em instantes."));
            return;
        }
        chain.doFilter(request, response);
    }

    private synchronized Result consume(Map<String, Bucket> buckets, String client, int maximum) {
        long now = clock.millis();
        Bucket bucket = buckets.get(client);
        if (bucket == null || bucket.resetAt() <= now) {
            prune(buckets, now);
            if (buckets.size() >= MAX_CLIENTS) buckets.remove(buckets.keySet().iterator().next());
            buckets.put(client, new Bucket(1, now + WINDOW_MILLIS));
            return new Result(true, 0);
        }
        if (bucket.count() >= maximum) {
            return new Result(false, Math.max(1, (int) Math.ceil((bucket.resetAt() - now) / 1_000d)));
        }
        buckets.put(client, new Bucket(bucket.count() + 1, bucket.resetAt()));
        return new Result(true, 0);
    }

    private static void prune(Map<String, Bucket> buckets, long now) {
        buckets.entrySet().removeIf(entry -> entry.getValue().resetAt() <= now);
    }

    private static String clientKey(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if ("127.0.0.1".equals(remote) || "::1".equals(remote) || "0:0:0:0:0:0:0:1".equals(remote)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) remote = forwarded.split(",", 2)[0].trim();
        }
        return (remote == null ? "unknown" : remote).substring(0, Math.min(128, (remote == null ? "unknown" : remote).length()));
    }

    private record Bucket(int count, long resetAt) { }
    private record Result(boolean allowed, int retryAfterSeconds) { }
}

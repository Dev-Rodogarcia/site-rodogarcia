package br.com.rodogarcia.cms.backend.service;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.repository.RateLimitRepository;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {

    public static final Limit LOGIN = new Limit(10 * 60_000L, 8);
    public static final Limit PASSWORD_RESET = new Limit(60 * 60_000L, 5);
    public static final Limit LEAD = new Limit(60 * 60_000L, 8);
    public static final Limit IMPROVEMENT = new Limit(60 * 60_000L, 8);
    public static final Limit POPUP_EVENT = new Limit(60 * 60_000L, 150);
    public static final Limit ANALYTICS = new Limit(60 * 60_000L, 1_200);
    public static final Limit CONSENT = new Limit(60 * 60_000L, 20);
    public static final Limit SETUP = new Limit(60 * 60_000L, 5);

    private final RateLimitRepository repository;

    public RateLimitService(RateLimitRepository repository) {
        this.repository = repository;
    }

    public void require(String namespace, String key, Limit limit, String message) {
        if (!repository.tryHit(namespace, key, limit.windowMs(), limit.maxAttempts())) {
            throw new ApiException(429, message);
        }
    }

    public RateLimitRepository.RateLimitState state(
        String namespace,
        String key,
        Limit limit
    ) {
        return repository.get(namespace, key, limit.windowMs(), limit.maxAttempts());
    }

    public record Limit(long windowMs, int maxAttempts) {
    }
}

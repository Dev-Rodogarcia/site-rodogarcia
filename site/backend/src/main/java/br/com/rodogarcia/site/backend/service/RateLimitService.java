package br.com.rodogarcia.site.backend.service;

import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.model.RateLimitPolicy;
import br.com.rodogarcia.site.backend.model.RateLimitState;
import br.com.rodogarcia.site.backend.repository.RateLimitRepository;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {

    private final RateLimitRepository repository;

    public RateLimitService(RateLimitRepository repository) {
        this.repository = repository;
    }

    public void assertAvailableAndConsume(String key, RateLimitPolicy policy) {
        RateLimitState state = repository.inspectAndHit(key, policy);
        if (!state.allowed()) {
            throw new ApiException(429, policy.message());
        }
    }
}

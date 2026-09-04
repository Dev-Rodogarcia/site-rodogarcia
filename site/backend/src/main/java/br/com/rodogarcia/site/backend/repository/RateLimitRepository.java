package br.com.rodogarcia.site.backend.repository;

import br.com.rodogarcia.site.backend.model.RateLimitPolicy;
import br.com.rodogarcia.site.backend.model.RateLimitState;

public interface RateLimitRepository {

    RateLimitState inspectAndHit(String key, RateLimitPolicy policy);
}

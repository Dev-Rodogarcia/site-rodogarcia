package br.com.rodogarcia.site.backend.security;

import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.model.RateLimitPolicy;
import br.com.rodogarcia.site.backend.service.RateLimitService;
import br.com.rodogarcia.site.backend.utils.NodeRequestHeaders;
import br.com.rodogarcia.site.backend.validation.JsonBodyCompatibilityFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class RequestPolicy {

    private final AllowedOriginService allowedOriginService;
    private final ClientIpResolver clientIpResolver;
    private final RateLimitService rateLimitService;

    public RequestPolicy(
        AllowedOriginService allowedOriginService,
        ClientIpResolver clientIpResolver,
        RateLimitService rateLimitService
    ) {
        this.allowedOriginService = allowedOriginService;
        this.clientIpResolver = clientIpResolver;
        this.rateLimitService = rateLimitService;
    }

    public void requirePublicMutation(HttpServletRequest request, RateLimitPolicy policy) {
        requireAllowedOrigin(request);
        requireJson(request);
        consume(request, policy);
    }

    public void consume(HttpServletRequest request, RateLimitPolicy policy) {
        rateLimitService.assertAvailableAndConsume(clientIpResolver.resolve(request), policy);
    }

    public void requireAllowedOrigin(HttpServletRequest request) {
        if (!allowedOriginService.isAllowed(NodeRequestHeaders.commaJoined(request, "Origin"))) {
            throw new ApiException(403, "Origem não autorizada.");
        }
    }

    public void requireJson(HttpServletRequest request) {
        if (!JsonBodyCompatibilityFilter.hasBody(request)
            || !JsonBodyCompatibilityFilter.isJson(request.getContentType())) {
            throw new ApiException(415, "Content-Type deve ser application/json.");
        }
    }
}

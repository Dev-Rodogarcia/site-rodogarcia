package br.com.rodogarcia.cms.backend.security;

import br.com.rodogarcia.cms.backend.service.ImprovementService;
import br.com.rodogarcia.cms.backend.service.RateLimitService;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import java.util.Locale;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public final class ImprovementRequestInterceptor implements HandlerInterceptor {
    private final RequestPolicy policy;
    private final RateLimitService rateLimits;
    private final ClientIpResolver clientIpResolver;

    public ImprovementRequestInterceptor(
        RequestPolicy policy,
        RateLimitService rateLimits,
        ClientIpResolver clientIpResolver
    ) {
        this.policy = policy;
        this.rateLimits = rateLimits;
        this.clientIpResolver = clientIpResolver;
    }

    @Override
    public boolean preHandle(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler
    ) {
        if (!request.getMethod().equals("POST")) return true;
        String path = normalizeRoutePath(
            request.getRequestURI().substring(request.getContextPath().length())
        );
        if (path.equals("/api/improvements")) {
            policy.requireAllowedOrigin(request);
            rateLimits.require(
                "improvement",
                clientIpResolver.resolve(request),
                RateLimitService.IMPROVEMENT,
                "Limite de envios atingido. Tente novamente mais tarde."
            );
            policy.requireContentLength(request, ImprovementService.MAX_REQUEST_BYTES);
        } else if (path.equals("/api/admin/improvements")) {
            policy.requireContentLength(request, ImprovementService.MAX_REQUEST_BYTES);
        }
        return true;
    }

    private static String normalizeRoutePath(String path) {
        String normalized = path.toLowerCase(Locale.ROOT);
        return normalized.length() > 1 && normalized.endsWith("/")
            ? normalized.substring(0, normalized.length() - 1)
            : normalized;
    }
}

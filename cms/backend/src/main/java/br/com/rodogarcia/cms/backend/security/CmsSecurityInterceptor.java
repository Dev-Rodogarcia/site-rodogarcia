package br.com.rodogarcia.cms.backend.security;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.service.RateLimitService;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class CmsSecurityInterceptor implements HandlerInterceptor {

    private final AdminSecurity security;
    private final RequestPolicy requestPolicy;
    private final RateLimitService rateLimits;
    private final ClientIpResolver clientIpResolver;

    public CmsSecurityInterceptor(
        AdminSecurity security,
        RequestPolicy requestPolicy,
        RateLimitService rateLimits,
        ClientIpResolver clientIpResolver
    ) {
        this.security = security;
        this.requestPolicy = requestPolicy;
        this.rateLimits = rateLimits;
        this.clientIpResolver = clientIpResolver;
    }

    @Override
    public boolean preHandle(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler
    ) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        String method = request.getMethod();

        if (path.equalsIgnoreCase("/api/auth")
            || path.regionMatches(true, 0, "/api/auth/", 0, "/api/auth/".length())) {
            protectAuth(path.substring("/api/auth".length()), method, request, response);
            return true;
        }
        if (path.equalsIgnoreCase("/api/admin")
            || path.regionMatches(true, 0, "/api/admin/", 0, "/api/admin/".length())) {
            protectAdmin(path.substring("/api/admin".length()), method, request, response);
            return true;
        }
        protectStandaloneAdminRoutes(path, method, request, response);
        return true;
    }

    private void protectAuth(
        String path,
        String method,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        security.privateNoStore(response);
        String normalized = normalizeRoutePath(path);
        if (isRead(method) && (normalized.equals("/session") || normalized.equals("/me"))) {
            security.optionalSession(request, response);
            return;
        }
        if (method.equals("POST") && normalized.equals("/login")) {
            requestPolicy.requireAllowedOrigin(request);
            requestPolicy.requireJson(request);
            return;
        }
        if (method.equals("POST") && normalized.equals("/password-reset-request")) {
            requestPolicy.requireAllowedOrigin(request);
            requestPolicy.requireJson(request);
            rateLimits.require(
                "password-reset",
                clientIpResolver.resolve(request),
                RateLimitService.PASSWORD_RESET,
                "Muitas tentativas. Tente novamente mais tarde."
            );
            return;
        }
        if (method.equals("POST") && normalized.equals("/change-password")) {
            requestPolicy.requireAllowedOrigin(request);
            security.requireAuthenticated(request, response);
            requestPolicy.requireJson(request);
            security.requireCsrf(request);
            return;
        }
        if (method.equals("PATCH") && normalized.equals("/cms-theme")) {
            requestPolicy.requireAllowedOrigin(request);
            security.requireAuthenticated(request, response);
            requestPolicy.requireJson(request);
            security.requireCsrf(request);
            return;
        }
        if (method.equals("POST") && normalized.equals("/logout")) {
            requestPolicy.requireAllowedOrigin(request);
            security.optionalSession(request, response);
            security.requireCsrf(request);
            return;
        }
        if (method.equals("POST") && normalized.equals("/register")) {
            requestPolicy.requireAllowedOrigin(request);
            requestPolicy.requireJson(request);
            rateLimits.require(
                "setup",
                clientIpResolver.resolve(request),
                RateLimitService.SETUP,
                "Muitas tentativas. Tente novamente mais tarde."
            );
        }
    }

    private void protectAdmin(
        String path,
        String method,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        String routePath = AdminRouteContract.normalizeTrailingSlash(path);
        String permission = AdminRouteContract.permissionForPath(routePath);
        security.requireAdmin(request, response);
        if (permission == null) {
            throw new ApiException(403, "Recurso administrativo sem permissão cadastrada.");
        }
        security.requirePermission(request, permission);

        if (AdminRouteContract.requiresSupreme(routePath, method)) {
            security.requireSupreme(request);
        }

        AdminRouteContract.MutationPolicy mutation = AdminRouteContract.mutationPolicy(
            routePath,
            method
        );
        if (!mutation.matched()) return;
        requestPolicy.requireAllowedOrigin(request);
        if (mutation.requiresJson()) requestPolicy.requireJson(request);
        security.requireCsrf(request);
        if (mutation.maxContentLength() > 0) {
            requestPolicy.requireContentLength(request, mutation.maxContentLength());
        }
    }

    private void protectStandaloneAdminRoutes(
        String path,
        String method,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        String normalized = normalizeRoutePath(path);
        if (isRead(method) && (normalized.equals("/api/contact") || normalized.equals("/api/quote")
            || normalized.equals("/api/leads"))) {
            security.requireAdmin(request, response, "leads");
            return;
        }
        if (isRead(method) && normalized.equals("/api/popup-events")) {
            security.requireAdmin(request, response, "popup");
            return;
        }
        if (isRead(method) && (normalized.equals("/api/analytics/stats")
            || normalized.equals("/api/analytics/config"))) {
            security.requireAdmin(request, response, "analytics");
            return;
        }
        if (method.equals("POST") && normalized.equals("/api/popup-config")) {
            requestPolicy.requireAllowedOrigin(request);
            requestPolicy.requireJson(request);
            security.requireAdmin(request, response, "popup");
            security.requireCsrf(request);
            return;
        }
        if (method.equals("POST") && normalized.equals("/api/analytics/config")) {
            requestPolicy.requireAllowedOrigin(request);
            requestPolicy.requireJson(request);
            security.requireAdmin(request, response, "analytics");
            security.requireCsrf(request);
        }
    }

    private static String normalizeRoutePath(String path) {
        String normalized = path.toLowerCase(java.util.Locale.ROOT);
        return normalized.length() > 1 && normalized.endsWith("/")
            ? normalized.substring(0, normalized.length() - 1)
            : normalized;
    }

    private static boolean isRead(String method) {
        return method.equals("GET") || method.equals("HEAD");
    }

}

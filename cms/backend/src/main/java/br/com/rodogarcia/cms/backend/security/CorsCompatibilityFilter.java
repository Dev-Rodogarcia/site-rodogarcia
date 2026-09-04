package br.com.rodogarcia.cms.backend.security;

import java.io.IOException;
import java.util.Collections;

import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

public final class CorsCompatibilityFilter extends OncePerRequestFilter {

    private static final String ALLOWED_METHODS = "GET,HEAD,PUT,PATCH,POST,DELETE";
    private final RequestPolicy requestPolicy;

    public CorsCompatibilityFilter(RequestPolicy requestPolicy) {
        this.requestPolicy = requestPolicy;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        String origin = joined(request, "Origin");
        boolean accepted = origin == null || origin.isEmpty() || requestPolicy.isAllowedOrigin(origin);
        if (!accepted) {
            chain.doFilter(request, response);
            return;
        }
        appendVary(response, "Origin");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        if (origin != null && !origin.isEmpty()) response.setHeader("Access-Control-Allow-Origin", origin);
        if (!request.getMethod().equalsIgnoreCase("OPTIONS")) {
            chain.doFilter(request, response);
            return;
        }
        response.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
        String requestedHeaders = joined(request, "Access-Control-Request-Headers");
        appendVary(response, "Access-Control-Request-Headers");
        if (requestedHeaders != null && !requestedHeaders.isEmpty()) {
            response.setHeader("Access-Control-Allow-Headers", requestedHeaders);
        }
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
        response.setContentLength(0);
    }

    private static String joined(HttpServletRequest request, String name) {
        var values = Collections.list(request.getHeaders(name));
        return values.isEmpty() ? null : String.join(", ", values);
    }

    private static void appendVary(HttpServletResponse response, String value) {
        String current = response.getHeader("Vary");
        if (current == null || current.isBlank()) {
            response.setHeader("Vary", value);
            return;
        }
        for (String item : current.split(",")) {
            if (item.strip().equalsIgnoreCase(value)) return;
        }
        response.setHeader("Vary", current + ", " + value);
    }
}

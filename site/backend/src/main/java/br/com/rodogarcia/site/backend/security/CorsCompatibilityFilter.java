package br.com.rodogarcia.site.backend.security;

import java.io.IOException;

import br.com.rodogarcia.site.backend.config.TomcatWireCompatibility;
import br.com.rodogarcia.site.backend.utils.NodeRequestHeaders;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

public class CorsCompatibilityFilter extends OncePerRequestFilter {

    private static final String ALLOWED_METHODS = "GET,HEAD,PUT,PATCH,POST,DELETE";

    private final AllowedOriginService allowedOriginService;

    public CorsCompatibilityFilter(AllowedOriginService allowedOriginService) {
        this.allowedOriginService = allowedOriginService;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String origin = NodeRequestHeaders.commaJoined(request, "Origin");
        boolean accepted = origin == null
            || origin.isEmpty()
            || allowedOriginService.isAllowed(origin);
        if (!accepted) {
            filterChain.doFilter(request, response);
            return;
        }

        appendVary(response, "Origin");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        if (origin != null && !origin.isEmpty()) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
            String requestedHeaders = NodeRequestHeaders.commaJoined(
                request,
                "Access-Control-Request-Headers"
            );
            appendVary(response, "Access-Control-Request-Headers");
            if (requestedHeaders != null && !requestedHeaders.isEmpty()) {
                response.setHeader("Access-Control-Allow-Headers", requestedHeaders);
            }
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
            TomcatWireCompatibility.setLiteralZeroContentLength(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static void appendVary(HttpServletResponse response, String value) {
        String current = response.getHeader("Vary");
        if (current == null || current.isBlank()) {
            response.setHeader("Vary", value);
            return;
        }
        for (String item : current.split(",")) {
            if (item.strip().equalsIgnoreCase(value)) {
                return;
            }
        }
        response.setHeader("Vary", current + ", " + value);
    }
}

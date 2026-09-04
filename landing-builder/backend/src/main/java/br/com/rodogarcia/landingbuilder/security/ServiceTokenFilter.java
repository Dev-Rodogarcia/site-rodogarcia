package br.com.rodogarcia.landingbuilder.security;

import tools.jackson.databind.ObjectMapper;
import br.com.rodogarcia.landingbuilder.config.LandingBuilderProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public final class ServiceTokenFilter extends OncePerRequestFilter {

    private static final String TOKEN_HEADER = "x-landing-builder-service-token";
    private final ObjectMapper mapper;
    private final byte[] expected;

    public ServiceTokenFilter(ObjectMapper mapper, LandingBuilderProperties properties) {
        this.mapper = mapper;
        expected = properties.serviceToken().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/internal/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        byte[] received = String.valueOf(request.getHeader(TOKEN_HEADER) == null ? "" : request.getHeader(TOKEN_HEADER))
            .getBytes(StandardCharsets.UTF_8);
        if (expected.length == 0 || expected.length != received.length || !MessageDigest.isEqual(expected, received)) {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            mapper.writeValue(response.getOutputStream(), Map.of("error", "Integração de serviço não autorizada."));
            return;
        }
        response.setHeader("Cache-Control", "private, no-store");
        chain.doFilter(request, response);
    }
}

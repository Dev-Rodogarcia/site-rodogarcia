package br.com.rodogarcia.landingbuilder.security;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Preserva a precedência do Express: depois do limiter/token interno e antes
 * do mapeamento MVC, o tipo de corpo incompatível recebe 415 mesmo quando a
 * rota curinga de 404 também seria elegível para a URL.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 25)
public final class RequestContractFilter extends OncePerRequestFilter {

    private static final String INTERNAL_LANDINGS = "/api/internal/landings";
    private static final String INTERNAL_MEDIA = "/api/internal/media";
    private final ObjectMapper mapper;

    public RequestContractFilter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (requiresJson(path, method) && !isJson(request.getContentType())) {
            reject(response, "Use Content-Type: application/json.");
            return;
        }
        if ("POST".equals(method) && INTERNAL_MEDIA.equals(path) && !isMultipart(request.getContentType())) {
            reject(response, "Use Content-Type: multipart/form-data.");
            return;
        }
        if (allowsEmptyOrJson(path, method) && hasBody(request) && !isJson(request.getContentType())) {
            reject(response, "Use Content-Type: application/json.");
            return;
        }
        chain.doFilter(request, response);
    }

    private static boolean requiresJson(String path, String method) {
        return ("POST".equals(method) && INTERNAL_LANDINGS.equals(path))
            || ("PUT".equals(method) && path.startsWith(INTERNAL_LANDINGS + "/"));
    }

    private static boolean allowsEmptyOrJson(String path, String method) {
        if ("DELETE".equals(method) && path.startsWith(INTERNAL_MEDIA + "/")) return true;
        if (!"POST".equals(method) || !path.startsWith(INTERNAL_LANDINGS + "/")) return false;
        return path.endsWith("/publish") || path.endsWith("/unpublish") || path.endsWith("/preview");
    }

    private static boolean hasBody(HttpServletRequest request) {
        String contentLength = request.getHeader("Content-Length");
        return request.getHeader("Transfer-Encoding") != null || (contentLength != null && !"0".equals(contentLength));
    }

    private static boolean isJson(String value) {
        return value != null && value.toLowerCase().startsWith(MediaType.APPLICATION_JSON_VALUE);
    }

    private static boolean isMultipart(String value) {
        return value != null && value.toLowerCase().startsWith(MediaType.MULTIPART_FORM_DATA_VALUE);
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE);
        response.setContentType("application/json;charset=UTF-8");
        mapper.writeValue(response.getOutputStream(), Map.of("error", message));
    }
}

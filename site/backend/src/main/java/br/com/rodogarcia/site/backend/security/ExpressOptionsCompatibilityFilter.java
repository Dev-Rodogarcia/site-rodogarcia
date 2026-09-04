package br.com.rodogarcia.site.backend.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;

import br.com.rodogarcia.site.backend.dto.response.ApiErrorResponse;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import br.com.rodogarcia.site.backend.utils.NodePathDecoder;
import br.com.rodogarcia.site.backend.utils.NodeRequestHeaders;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

/** Reproduz o OPTIONS automático do Router Express quando o CORS recusa a origem. */
public class ExpressOptionsCompatibilityFilter extends OncePerRequestFilter {

    private static final List<RouteMethods> ROUTES = List.of(
        route("/api/public/postal-code/[^/]+/?", "GET, HEAD", true),
        route("/api/public/company/[^/]+/?", "GET, HEAD", true),
        route("/api/quote/fractional/?", "POST", false),
        route("/api/quote/closed/whatsapp/?", "POST", false),
        route("/api/collections/invoice-validation/?", "POST", false),
        route("/api/collections/?", "POST", false),
        route("/api/collections/[^/]+/?", "PATCH", true),
        route("/api/collections/[^/]+/cancel/?", "POST", true)
    );

    private final AllowedOriginService allowedOriginService;
    private final ExpressJsonResponse jsonResponse;

    public ExpressOptionsCompatibilityFilter(AllowedOriginService allowedOriginService) {
        this(allowedOriginService, null);
    }

    public ExpressOptionsCompatibilityFilter(
        AllowedOriginService allowedOriginService,
        ExpressJsonResponse jsonResponse
    ) {
        this.allowedOriginService = allowedOriginService;
        this.jsonResponse = jsonResponse;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String origin = NodeRequestHeaders.commaJoined(request, "Origin");
        if (!"OPTIONS".equalsIgnoreCase(request.getMethod())
            || origin == null
            || allowedOriginService.isAllowed(origin)) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        if (jsonResponse != null && path.matches("(?i)^/(?:health|ready)/?$")) {
            jsonResponse.write(
                request,
                response,
                HttpServletResponse.SC_NOT_FOUND,
                new ApiErrorResponse("Recurso não encontrado.")
            );
            return;
        }
        for (RouteMethods route : ROUTES) {
            if (route.pattern().matcher(path).matches()) {
                if (route.decodesParameter()
                    && !NodePathDecoder.canDecodeURIComponent(path)) {
                    if (jsonResponse != null) {
                        jsonResponse.write(
                            request,
                            response,
                            HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                            new ApiErrorResponse("Erro interno no servidor.")
                        );
                    } else {
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    }
                    return;
                }
                byte[] body = route.methods().getBytes(StandardCharsets.UTF_8);
                response.setStatus(HttpServletResponse.SC_OK);
                response.setHeader("Allow", route.methods());
                response.setHeader("Content-Type", "text/plain");
                response.setContentLength(body.length);
                response.getOutputStream().write(body);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private static RouteMethods route(
        String expression,
        String methods,
        boolean decodesParameter
    ) {
        return new RouteMethods(
            Pattern.compile("^" + expression + "$", Pattern.CASE_INSENSITIVE),
            methods,
            decodesParameter
        );
    }

    static boolean matchesParameterizedRoute(String path) {
        return ROUTES.stream().anyMatch(route ->
            route.decodesParameter() && route.pattern().matcher(path).matches()
        );
    }

    private record RouteMethods(Pattern pattern, String methods, boolean decodesParameter) {
    }
}

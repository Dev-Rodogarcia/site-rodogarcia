package br.com.rodogarcia.site.backend.security;

import java.io.IOException;

import br.com.rodogarcia.site.backend.dto.response.ApiErrorResponse;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import br.com.rodogarcia.site.backend.utils.NodePathDecoder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Adia o erro de decode para rotas parametrizadas, como o Router Express. Em
 * paths desconhecidos, protege o parser global do Spring e preserva o 404.
 */
public final class InvalidPathDecodingCompatibilityFilter extends OncePerRequestFilter {

    private final ExpressJsonResponse jsonResponse;

    public InvalidPathDecodingCompatibilityFilter(ExpressJsonResponse jsonResponse) {
        this.jsonResponse = jsonResponse;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String rawPath = request.getRequestURI();
        if (NodePathDecoder.canDecodeURIComponent(rawPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (ExpressOptionsCompatibilityFilter.matchesParameterizedRoute(rawPath)) {
            jsonResponse.write(
                request,
                response,
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                new ApiErrorResponse("Erro interno no servidor.")
            );
            return;
        }

        filterChain.doFilter(new PercentEscapedRequest(request), response);
    }

    private static final class PercentEscapedRequest extends HttpServletRequestWrapper {

        private final String requestUri;

        private PercentEscapedRequest(HttpServletRequest request) {
            super(request);
            this.requestUri = request.getRequestURI().replace("%", "%25");
        }

        @Override
        public String getRequestURI() {
            return requestUri;
        }

        @Override
        public StringBuffer getRequestURL() {
            StringBuffer original = super.getRequestURL();
            String originalUri = super.getRequestURI();
            int uriStart = original.length() - originalUri.length();
            if (uriStart < 0) {
                return original;
            }
            return original.replace(uriStart, original.length(), requestUri);
        }
    }
}

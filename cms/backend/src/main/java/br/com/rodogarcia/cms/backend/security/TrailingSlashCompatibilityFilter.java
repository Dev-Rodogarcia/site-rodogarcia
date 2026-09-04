package br.com.rodogarcia.cms.backend.security;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

/** Mantém o comportamento padrão `strict routing: false` do Express. */
public final class TrailingSlashCompatibilityFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String compatibleUri = encodeSemicolons(uri);
        if (!isUploadsPath(uri)
            && uri.length() > 1 && uri.endsWith("/") && !uri.endsWith("//")) {
            compatibleUri = compatibleUri.substring(0, compatibleUri.length() - 1);
        }
        String servletPath = request.getServletPath();
        String compatibleServletPath = encodeSemicolons(servletPath);
        if (!isUploadsPath(uri) && servletPath != null && servletPath.length() > 1
            && servletPath.endsWith("/") && !servletPath.endsWith("//")) {
            compatibleServletPath = compatibleServletPath.substring(
                0,
                compatibleServletPath.length() - 1
            );
        }
        if (compatibleUri.equals(uri)
            && java.util.Objects.equals(compatibleServletPath, servletPath)) {
            chain.doFilter(request, response);
            return;
        }
        String normalizedUri = compatibleUri;
        String normalizedServletPath = compatibleServletPath;
        chain.doFilter(new HttpServletRequestWrapper(request) {
            @Override
            public String getRequestURI() {
                return normalizedUri;
            }

            @Override
            public String getServletPath() {
                return normalizedServletPath;
            }
        }, response);
    }

    private static String encodeSemicolons(String path) {
        return path == null || path.indexOf(';') < 0 ? path : path.replace(";", "%3B");
    }

    private static boolean isUploadsPath(String uri) {
        return uri.regionMatches(true, 0, "/uploads", 0, "/uploads".length())
            && (uri.length() == "/uploads".length() || uri.charAt("/uploads".length()) == '/');
    }
}

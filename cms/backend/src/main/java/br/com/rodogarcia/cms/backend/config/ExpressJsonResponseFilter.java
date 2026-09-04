package br.com.rodogarcia.cms.backend.config;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Base64;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

/** Reproduz charset, Content-Length, ETag fraco e freshness do {@code res.json} Express. */
public final class ExpressJsonResponseFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String normalized = path.toLowerCase(java.util.Locale.ROOT);
        return normalized.equals("/uploads")
            || normalized.startsWith("/uploads/")
            || path.matches("(?i)^/api/admin/improvements/[^/]+/attachments/[^/]+/?$");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        ContentCachingResponseWrapper wrapper = new ContentCachingResponseWrapper(response);
        wrapper.setCharacterEncoding("UTF-8");
        try {
            chain.doFilter(request, wrapper);
            byte[] body = wrapper.getContentAsByteArray();
            String contentType = wrapper.getContentType();
            if (body.length > 0 && isJson(contentType)) {
                wrapper.setContentType("application/json; charset=utf-8");
                wrapper.setContentLength(body.length);
                String etag = wrapper.getHeader("ETag");
                if (etag == null) {
                    etag = weakEntityTag(body);
                    wrapper.setHeader("ETag", etag);
                }
                if (isFresh(request, wrapper.getStatus(), etag)) {
                    resetAsNotModified(wrapper);
                }
            }
        } finally {
            wrapper.copyBodyToResponse();
        }
    }

    static String weakEntityTag(byte[] body) {
        try {
            String hash = Base64.getEncoder().encodeToString(
                MessageDigest.getInstance("SHA-1").digest(body)
            );
            if (hash.length() > 27) hash = hash.substring(0, 27);
            return "W/\"" + Integer.toHexString(body.length) + "-" + hash + "\"";
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-1 indisponível.", error);
        }
    }

    private static boolean isJson(String contentType) {
        return contentType != null
            && contentType.regionMatches(true, 0, "application/json", 0, "application/json".length());
    }

    private static boolean isFresh(HttpServletRequest request, int status, String etag) {
        String method = request.getMethod();
        if (!(method.equals("GET") || method.equals("HEAD")) || status < 200 || status >= 300) {
            return false;
        }
        String cacheControl = request.getHeader("Cache-Control");
        if (cacheControl != null && cacheControl.matches("(?i)(?:^|,)\\s*no-cache\\s*(?:,|$)")) {
            return false;
        }
        String noneMatch = request.getHeader("If-None-Match");
        if (noneMatch == null || noneMatch.isBlank()) return false;
        if (noneMatch.trim().equals("*")) return true;
        String normalized = stripWeak(etag);
        for (String candidate : noneMatch.split("\\s*,\\s*")) {
            if (candidate.equals(etag) || stripWeak(candidate).equals(normalized)) return true;
        }
        return false;
    }

    private static void resetAsNotModified(ContentCachingResponseWrapper response) {
        Map<String, List<String>> retained = new LinkedHashMap<>();
        for (String name : response.getHeaderNames()) {
            if (name.equalsIgnoreCase("Content-Type")
                || name.equalsIgnoreCase("Content-Length")
                || name.equalsIgnoreCase("Transfer-Encoding")) {
                continue;
            }
            retained.put(name, List.copyOf(response.getHeaders(name)));
        }
        response.reset();
        response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
        retained.forEach((name, values) -> values.forEach(value -> response.addHeader(name, value)));
    }

    private static String stripWeak(String value) {
        return value.startsWith("W/") ? value.substring(2) : value;
    }
}

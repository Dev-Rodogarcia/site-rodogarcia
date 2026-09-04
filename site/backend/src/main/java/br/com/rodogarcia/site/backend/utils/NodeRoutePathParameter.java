package br.com.rodogarcia.site.backend.utils;

import java.util.Locale;

import jakarta.servlet.http.HttpServletRequest;

/** Extrai o parâmetro do request-target cru antes das limpezas de matrix/session do Servlet. */
public final class NodeRoutePathParameter {

    private NodeRoutePathParameter() {
    }

    public static String single(
        HttpServletRequest request,
        String prefix,
        String suffix
    ) {
        String path = request.getRequestURI();
        if (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        String lower = path.toLowerCase(Locale.ROOT);
        String lowerPrefix = prefix.toLowerCase(Locale.ROOT);
        String lowerSuffix = suffix.toLowerCase(Locale.ROOT);
        if (!lower.startsWith(lowerPrefix)
            || (!lowerSuffix.isEmpty() && !lower.endsWith(lowerSuffix))) {
            throw new IllegalArgumentException("Rota parametrizada inválida.");
        }
        int end = path.length() - suffix.length();
        if (end < prefix.length()) {
            throw new IllegalArgumentException("Rota parametrizada inválida.");
        }
        return NodePathDecoder.decodeURIComponent(path.substring(prefix.length(), end));
    }
}

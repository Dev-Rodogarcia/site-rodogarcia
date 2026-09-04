package br.com.rodogarcia.cms.backend.security;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;

public final class SecurityContext {

    public static final String AUTH_ATTRIBUTE = SecurityContext.class.getName() + ".authenticatedUser";

    private SecurityContext() {
    }

    public static AuthenticatedUser get(HttpServletRequest request) {
        Object value = request.getAttribute(AUTH_ATTRIBUTE);
        return value instanceof AuthenticatedUser authenticated ? authenticated : null;
    }

    public static AuthenticatedUser require(HttpServletRequest request) {
        AuthenticatedUser authenticated = get(request);
        if (authenticated == null) throw new ApiException(401, "Nao autenticado.");
        return authenticated;
    }

    static void set(HttpServletRequest request, AuthenticatedUser authenticated) {
        request.setAttribute(AUTH_ATTRIBUTE, authenticated);
    }
}

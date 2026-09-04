package br.com.rodogarcia.cms.backend.security;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.model.auth.SessionRecord;
import br.com.rodogarcia.cms.backend.model.auth.UserRecord;
import br.com.rodogarcia.cms.backend.repository.auth.UserRepository;
import br.com.rodogarcia.cms.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import org.springframework.stereotype.Component;

@Component
public class AdminSecurity {

    private final SessionService sessions;
    private final UserRepository users;
    private final AuthService authService;
    private final CmsAccessService access;

    public AdminSecurity(
        SessionService sessions,
        UserRepository users,
        AuthService authService,
        CmsAccessService access
    ) {
        this.sessions = sessions;
        this.users = users;
        this.authService = authService;
        this.access = access;
    }

    public void privateNoStore(HttpServletResponse response) {
        response.setHeader("Cache-Control", "private, no-store");
    }

    public AuthenticatedUser optionalSession(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        String sid = sessionCookie(request);
        if (sid == null || sid.isEmpty()) return null;
        SessionRecord session = sessions.get(sid);
        UserRecord user = session == null ? null : users.findById(session.getUserId());
        if (session == null || user == null || !user.isActive()) return null;
        AuthenticatedUser authenticated = new AuthenticatedUser(session, user);
        SecurityContext.set(request, authenticated);
        privateNoStore(response);
        return authenticated;
    }

    public AuthenticatedUser requireAuthenticated(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        privateNoStore(response);
        String sid = sessionCookie(request);
        if (sid == null || sid.isEmpty()) throw new ApiException(401, "Nao autenticado.");
        SessionRecord session = sessions.get(sid);
        UserRecord user = session == null ? null : users.findById(session.getUserId());
        if (session == null || user == null || !user.isActive()) {
            throw new ApiException(401, "Sessão expirada.");
        }
        AuthenticatedUser authenticated = new AuthenticatedUser(session, user);
        SecurityContext.set(request, authenticated);
        return authenticated;
    }

    public AuthenticatedUser requireAdmin(
        HttpServletRequest request,
        HttpServletResponse response,
        String... permissions
    ) {
        privateNoStore(response);
        String sid = sessionCookie(request);
        if (sid == null || sid.isEmpty()) throw new ApiException(401, "Nao autenticado.");
        SessionRecord session = sessions.get(sid);
        if (session == null) throw new ApiException(401, "Sessão expirada.");
        UserRecord user = users.findById(session.getUserId());
        if (user == null || !user.isActive() || !user.isAdmin()) {
            throw new ApiException(403, "Acesso administrativo obrigatório.");
        }
        if (authService.isPasswordChangeRequired(user)) {
            throw new ApiException(403, "Troque sua senha antes de acessar o painel.");
        }
        AuthenticatedUser authenticated = new AuthenticatedUser(session, user);
        SecurityContext.set(request, authenticated);
        if (permissions.length > 0) access.requireAnyPermission(user, permissions);
        return authenticated;
    }

    public void requireSupreme(HttpServletRequest request) {
        AuthenticatedUser authenticated = SecurityContext.require(request);
        access.assertSupreme(authenticated.user());
    }

    public void requirePermission(HttpServletRequest request, String... permissions) {
        AuthenticatedUser authenticated = SecurityContext.require(request);
        access.requireAnyPermission(authenticated.user(), permissions);
    }

    public void requireCsrf(HttpServletRequest request) {
        AuthenticatedUser authenticated = SecurityContext.get(request);
        String expected = authenticated == null ? "" : authenticated.session().getCsrfToken();
        String provided = request.getHeader("X-CSRF-Token");
        if (provided == null) provided = "";
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = provided.getBytes(StandardCharsets.UTF_8);
        if (expectedBytes.length == 0 || providedBytes.length == 0
            || !MessageDigest.isEqual(expectedBytes, providedBytes)) {
            throw new ApiException(403, "Token CSRF invalido ou ausente.");
        }
    }

    public String sessionCookie(HttpServletRequest request) {
        Cookie[] parsedCookies = request.getCookies();
        if (parsedCookies != null) {
            for (Cookie cookie : parsedCookies) {
                if (SessionService.SESSION_COOKIE.equals(cookie.getName())) return cookie.getValue();
            }
        }
        String header = request.getHeader("Cookie");
        if (header == null) return null;
        for (String entry : header.split(";")) {
            String candidate = entry.trim();
            int separator = candidate.indexOf('=');
            if (separator < 0 || !candidate.substring(0, separator).equals(SessionService.SESSION_COOKIE)) {
                continue;
            }
            String value = candidate.substring(separator + 1);
            try {
                return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
            } catch (IllegalArgumentException ignored) {
                return value;
            }
        }
        return null;
    }
}

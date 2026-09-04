package br.com.rodogarcia.cms.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.model.auth.CmsAccessProfile;
import br.com.rodogarcia.cms.backend.model.auth.UserRecord;
import br.com.rodogarcia.cms.backend.security.AuthenticatedUser;
import br.com.rodogarcia.cms.backend.security.CmsAccessService;
import br.com.rodogarcia.cms.backend.security.SecurityContext;
import br.com.rodogarcia.cms.backend.security.SessionService;
import br.com.rodogarcia.cms.backend.service.AuthService;
import br.com.rodogarcia.cms.backend.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@RestController
public class AuthController {

    private final AuthService auth;
    private final SessionService sessions;
    private final CmsAccessService access;
    private final AuditService audit;
    private final JsonMapper mapper;

    public AuthController(
        AuthService auth,
        SessionService sessions,
        CmsAccessService access,
        AuditService audit,
        JsonMapper mapper
    ) {
        this.auth = auth;
        this.sessions = sessions;
        this.access = access;
        this.audit = audit;
        this.mapper = mapper;
    }

    @GetMapping("/api/auth/session")
    public Map<String, Object> session(HttpServletRequest request) {
        AuthenticatedUser authenticated = SecurityContext.get(request);
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        if (authenticated == null) {
            response.put("authenticated", false);
            response.put("csrfToken", "");
            response.put("setupRequired", !auth.hasAnyUser());
            return response;
        }
        response.put("authenticated", true);
        response.put("user", auth.publicUser(authenticated.user()));
        response.put("csrfToken", authenticated.session().getCsrfToken());
        response.put("expiresAt", authenticated.session().getExpiresAt());
        response.put("setupRequired", !auth.hasAnyUser());
        return response;
    }

    @GetMapping("/api/auth/me")
    public Map<String, Object> me(HttpServletRequest request) {
        AuthenticatedUser authenticated = SecurityContext.get(request);
        if (authenticated == null) throw new ApiException(401, "Nao autenticado.");
        return Map.of("user", auth.publicUser(authenticated.user()));
    }

    @GetMapping("/api/auth/setup")
    public Map<String, Boolean> setupStatus() {
        return Map.of("setupRequired", !auth.hasAnyUser());
    }

    @PostMapping("/api/auth/login")
    public Map<String, Object> login(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        AuthService.LoginResult result = auth.login(body(body), request);
        sessions.setCookie(response, result.session());
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("message", "Autenticado com sucesso.");
        payload.put("user", auth.publicUser(result.user()));
        payload.put("csrfToken", result.session().getCsrfToken());
        return payload;
    }

    @PostMapping("/api/auth/password-reset-request")
    public Map<String, String> passwordResetRequest(
        @RequestBody(required = false) JsonNode body
    ) {
        auth.requestPasswordReset(body(body));
        return Map.of(
            "message",
            "Se o acesso estiver cadastrado, sua solicitação foi enviada ao administrador."
        );
    }

    @PostMapping("/api/auth/change-password")
    public Map<String, Object> changePassword(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        AuthenticatedUser authenticated = SecurityContext.require(request);
        UserRecord updated = auth.changeOwnPassword(
            authenticated.user(),
            body(body),
            authenticated.session().getId()
        );
        return Map.of(
            "message", "Senha alterada com sucesso.",
            "user", auth.publicUser(updated)
        );
    }

    @PatchMapping("/api/auth/cms-theme")
    public Map<String, Object> updateCmsTheme(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        UserRecord updated = auth.updateOwnCmsTheme(
            SecurityContext.require(request).user(),
            body(body)
        );
        return Map.of("user", auth.publicUser(updated));
    }

    @PostMapping("/api/auth/logout")
    public Map<String, String> logout(HttpServletRequest request, HttpServletResponse response) {
        AuthenticatedUser authenticated = SecurityContext.require(request);
        sessions.destroy(authenticated.session().getId());
        sessions.clearCookie(response);
        return Map.of("message", "Sessão encerrada.");
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<Map<String, Object>> register(
        @RequestBody(required = false) JsonNode body
    ) {
        UserRecord created = auth.createInitialUser(body(body));
        return ResponseEntity.status(201).body(Map.of(
            "message", "Usuário cadastrado com sucesso.",
            "user", auth.publicUser(created)
        ));
    }

    @GetMapping("/api/admin/users")
    public Map<String, Object> listUsers(HttpServletRequest request) {
        UserRecord actor = SecurityContext.require(request).user();
        return Map.of("user", auth.publicUser(actor), "users", auth.listUsers(actor));
    }

    @PostMapping("/api/admin/users")
    public ResponseEntity<Map<String, Object>> createUser(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        UserRecord actor = SecurityContext.require(request).user();
        UserRecord created = auth.createUser(body(body), actor);
        audit.record(request, "user.create", created.getEmail(), Map.of("role", created.getRole()));
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Usuário criado com sucesso.");
        response.put("createdUser", auth.publicUser(created));
        response.put("users", auth.listUsers(actor));
        return ResponseEntity.status(201).body(response);
    }

    @PutMapping("/api/admin/users/{id}")
    public Map<String, Object> updateUser(
        @PathVariable String id,
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        UserRecord actor = SecurityContext.require(request).user();
        UserRecord updated = auth.updateUser(id, body(body), actor);
        audit.record(request, "user.update", updated.getEmail(), Map.of(
            "role", updated.getRole(),
            "active", String.valueOf(updated.isActive())
        ));
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Usuário atualizado com sucesso.");
        response.put("updatedUser", auth.publicUser(updated));
        response.put("users", auth.listUsers(actor));
        return response;
    }

    @DeleteMapping("/api/admin/users/{id}")
    public Map<String, Object> deleteUser(@PathVariable String id, HttpServletRequest request) {
        UserRecord actor = SecurityContext.require(request).user();
        auth.deleteUser(id, actor);
        audit.record(request, "user.delete", id, Map.of());
        return Map.of(
            "message", "Usuário removido com sucesso.",
            "users", auth.listUsers(actor)
        );
    }

    @GetMapping("/api/admin/access-profiles")
    public Map<String, List<CmsAccessProfile>> listProfiles(HttpServletRequest request) {
        return Map.of(
            "profiles",
            access.listProfiles(SecurityContext.require(request).user(), true)
        );
    }

    @PostMapping("/api/admin/access-profiles")
    public ResponseEntity<Map<String, CmsAccessProfile>> createProfile(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        CmsAccessProfile profile = access.createProfile(
            body(body), SecurityContext.require(request).user());
        audit.record(request, "access.profile_create", profile.getId(), Map.of());
        return ResponseEntity.status(201).body(Map.of("profile", profile));
    }

    @PutMapping("/api/admin/access-profiles/{id}")
    public Map<String, CmsAccessProfile> updateProfile(
        @PathVariable String id,
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        CmsAccessProfile profile = access.updateProfile(
            id, body(body), SecurityContext.require(request).user());
        audit.record(request, "access.profile_update", profile.getId(), Map.of());
        return Map.of("profile", profile);
    }

    @DeleteMapping("/api/admin/access-profiles/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable String id, HttpServletRequest request) {
        access.deleteProfile(id, SecurityContext.require(request).user());
        audit.record(request, "access.profile_delete", id, Map.of());
        return ResponseEntity.noContent().build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> body(JsonNode body) {
        if (body == null || body.isArray()) return Map.of();
        if (!body.isObject()) throw new ApiException(400, "JSON inválido.");
        return mapper.convertValue(body, Map.class);
    }
}

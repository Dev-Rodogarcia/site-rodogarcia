package br.com.rodogarcia.cms.backend.service;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;
import java.util.regex.Pattern;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.model.auth.CmsPermissionOverride;
import br.com.rodogarcia.cms.backend.model.auth.SessionRecord;
import br.com.rodogarcia.cms.backend.model.auth.UserRecord;
import br.com.rodogarcia.cms.backend.repository.auth.CmsAccessProfileRepository;
import br.com.rodogarcia.cms.backend.repository.auth.SessionRepository;
import br.com.rodogarcia.cms.backend.repository.auth.UserRepository;
import br.com.rodogarcia.cms.backend.security.ClientIpResolver;
import br.com.rodogarcia.cms.backend.security.CmsAccessService;
import br.com.rodogarcia.cms.backend.security.PasswordService;
import br.com.rodogarcia.cms.backend.security.SessionService;
import br.com.rodogarcia.cms.backend.utils.Ids;
import br.com.rodogarcia.cms.backend.utils.Sanitizers;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final List<String> USER_PERMISSIONS = List.of("createUsers", "deleteUsers");
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final DateTimeFormatter ISO_MILLIS = new java.time.format.DateTimeFormatterBuilder()
        .appendInstant(3).toFormatter().withZone(ZoneOffset.UTC);
    private static final int AUTH_LOCK_STRIPES = 128;

    private final UserRepository users;
    private final SessionRepository sessions;
    private final CmsAccessProfileRepository profiles;
    private final PasswordService passwords;
    private final SessionService sessionService;
    private final CmsAccessService access;
    private final RateLimitService rateLimits;
    private final ClientIpResolver clientIpResolver;
    private final CmsProperties properties;
    private final Clock clock;
    private final ReentrantLock[] loginRateLocks = lockStripes();
    private final ReentrantLock[] credentialLocks = lockStripes();

    public AuthService(
        UserRepository users,
        SessionRepository sessions,
        CmsAccessProfileRepository profiles,
        PasswordService passwords,
        SessionService sessionService,
        CmsAccessService access,
        RateLimitService rateLimits,
        ClientIpResolver clientIpResolver,
        CmsProperties properties,
        Clock clock
    ) {
        this.users = users;
        this.sessions = sessions;
        this.profiles = profiles;
        this.passwords = passwords;
        this.sessionService = sessionService;
        this.access = access;
        this.rateLimits = rateLimits;
        this.clientIpResolver = clientIpResolver;
        this.properties = properties;
        this.clock = clock;
    }

    public Map<String, Object> publicUser(UserRecord user) {
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", user.getId());
        payload.put("email", user.getEmail());
        if (user.getName() != null) payload.put("name", user.getName());
        payload.put("role", user.getRole());
        payload.put("isSupreme", isSupremeUser(user));
        payload.put("isOwner", Boolean.TRUE.equals(user.getIsOwner()));
        payload.put("passwordChangeRequired", isPasswordChangeRequired(user));
        payload.put("permissions", user.getPermissions() == null ? List.of() : user.getPermissions());
        payload.put("accessProfileId", user.getAccessProfileId() == null ? "" : user.getAccessProfileId());
        payload.put("cmsPermissions", access.effectivePermissions(user));
        payload.put("cmsPermissionOverrides", user.getCmsPermissionOverrides() == null
            ? List.of() : user.getCmsPermissionOverrides());
        if (user.getCmsTheme() != null) payload.put("cmsTheme", user.getCmsTheme());
        return payload;
    }

    public boolean isPasswordChangeRequired(UserRecord user) {
        return user != null && !Boolean.TRUE.equals(user.getIsOwner())
            && !Boolean.FALSE.equals(user.getMustChangePassword());
    }

    public boolean isSupremeUser(UserRecord user) {
        return access.isSupreme(user);
    }

    public List<Map<String, Object>> listUsers(UserRecord actor) {
        boolean showReset = isSupremeUser(actor);
        List<Map<String, Object>> result = new ArrayList<>();
        for (UserRecord user : users.list()) {
            LinkedHashMap<String, Object> item = new LinkedHashMap<>(publicUser(user));
            item.put("createdAt", user.getCreatedAt());
            item.put("active", user.isActive());
            item.put("protected", isSupremeUser(user));
            if (showReset && user.getPasswordResetRequestedAt() != null) {
                item.put("passwordResetRequestedAt", user.getPasswordResetRequestedAt());
            }
            result.add(item);
        }
        result.sort(Comparator.comparing(
            item -> String.valueOf(item.get("createdAt")),
            Comparator.reverseOrder()
        ));
        return result;
    }

    public LoginResult login(Map<String, Object> body, HttpServletRequest request) {
        String email = sanitizeEmail(body.get("email"));
        String password = body.get("password") instanceof String value ? value : "";
        String ip = clientIpResolver.resolve(request);
        return withLocks(loginRateLocks, List.of("ip:" + ip, "email:" + email), () -> {
            assertLoginRateLimit(ip, email);
            if (email.isEmpty() || password.isEmpty()) {
                registerFailedLogin(ip, email);
                throw new ApiException(400, "E-mail e senha são obrigatórios.");
            }

            UserRecord candidate = users.findByEmail(email);
            if (candidate == null) {
                registerFailedLogin(ip, email);
                throw new ApiException(401, "Credenciais invalidas.");
            }
            return withLock(credentialLocks, candidate.getId(), () -> {
                UserRecord current = users.findByEmail(email);
                if (current == null || !candidate.getId().equals(current.getId())
                    || !passwords.verify(password, current.getPasswordHash())) {
                    registerFailedLogin(ip, email);
                    throw new ApiException(401, "Credenciais invalidas.");
                }
                return new LoginResult(current, sessionService.create(current.getId()));
            });
        });
    }

    public void requestPasswordReset(Map<String, Object> params) {
        String email = parseUserEmail(params.get("email"), true, params.containsKey("email"));
        UserRecord user = users.findByEmail(email);
        if (user != null && user.isActive()) {
            users.update(user.getId(), current -> current.setPasswordResetRequestedAt(nowIso()));
        }
    }

    public UserRecord createUser(Map<String, Object> params, UserRecord actor) {
        access.assertSupreme(actor);
        UserRecord candidate = buildUser(params, false);
        UserRecord created = users.createIfEmailAvailable(candidate);
        if (created == null) throw new ApiException(409, "Ja existe conta com este e-mail.");
        return created;
    }

    public UserRecord updateUser(Object id, Map<String, Object> params, UserRecord actor) {
        access.assertSupreme(actor);
        String userId = Sanitizers.text(id, 120);
        String requestedRole = parseUserRole(params.get("role"), false, params.containsKey("role"));
        Boolean requestedActive = parseActive(params.get("active"), params.containsKey("active"));
        List<String> requestedPermissions = parseUserPermissions(
            params.get("permissions"), params.containsKey("permissions"));
        List<String> requestedCmsPermissions = access.parsePermissions(
            params.get("cmsPermissions"), params.containsKey("cmsPermissions"));
        List<CmsPermissionOverride> requestedOverrides = access.parseOverrides(
            params.get("cmsPermissionOverrides"), params.containsKey("cmsPermissionOverrides"));
        String requestedProfile = parseAccessProfileId(
            params.get("accessProfileId"), params.containsKey("accessProfileId"));
        String name = parseUserName(params.get("name"), false, params.containsKey("name"));
        String email = parseUserEmail(params.get("email"), false, params.containsKey("email"));
        boolean passwordPresent = params.containsKey("password");
        Object rawPassword = params.get("password");
        if (passwordPresent && !(rawPassword instanceof String)) {
            throw new ApiException(422, "A senha deve ser uma string.");
        }
        String password = rawPassword instanceof String value ? value : "";
        String passwordHash = null;
        if (!password.isEmpty()) {
            String confirmation = params.get("confirmPassword") instanceof String value ? value : "";
            if (!password.equals(confirmation)) throw new ApiException(422, "As senhas não coincidem.");
            validatePassword(password);
            passwordHash = passwords.hash(password);
        }
        String finalPasswordHash = passwordHash;
        return withLock(credentialLocks, userId, () -> {
            UserRecord target = users.findById(userId);
            if (target == null) throw new ApiException(404, "Usuário não encontrado.");
            if (isSupremeUser(target)
                && ((requestedRole != null && !requestedRole.equals("admin"))
                    || Boolean.FALSE.equals(requestedActive))) {
                throw new ApiException(403, "O usuário supremo não pode perder perfil master ou ser desativado.");
            }
            if (requestedPermissions != null
                && ("user".equals(requestedRole)
                    || (requestedRole == null && !"admin".equals(target.getRole())))) {
                throw new ApiException(422, "Permissões de usuários exigem perfil de administrador.");
            }

            var outcome = users.updateIfEmailAvailable(target.getId(), current -> {
                if (name != null) current.setName(name);
                if (email != null && !email.equals(target.getEmail())) current.setEmail(email);
                if (requestedRole != null) current.setRole(requestedRole);
                if (requestedActive != null) current.setActive(requestedActive);
                if (requestedPermissions != null) current.setPermissions(new ArrayList<>(requestedPermissions));
                else if ("user".equals(requestedRole)) current.setPermissions(new ArrayList<>());
                if (requestedCmsPermissions != null) {
                    current.setCmsPermissions(new ArrayList<>(requestedCmsPermissions));
                }
                if (requestedOverrides != null) {
                    current.setCmsPermissionOverrides(copyOverrides(requestedOverrides));
                }
                if (requestedProfile != null) current.setAccessProfileId(requestedProfile);
                if (finalPasswordHash != null) {
                    current.setPasswordHash(finalPasswordHash);
                    current.setMustChangePassword(isSupremeUser(target) ? false : true);
                    current.setPasswordResetRequestedAt(null);
                }
            });
            if (outcome.emailConflict()) {
                throw new ApiException(409, "Ja existe conta com este e-mail.");
            }
            UserRecord updated = outcome.user();
            if (updated == null) throw new ApiException(404, "Usuário não encontrado.");

            boolean activeChanged = requestedActive != null && requestedActive != target.isActive();
            boolean roleChanged = requestedRole != null && !requestedRole.equals(target.getRole());
            if (finalPasswordHash != null || activeChanged || roleChanged || requestedCmsPermissions != null
                || requestedOverrides != null || requestedProfile != null) {
                sessions.deleteByUserId(target.getId());
            }
            return updated;
        });
    }

    public UserRecord changeOwnPassword(
        UserRecord user,
        Map<String, Object> params,
        String currentSessionId
    ) {
        String currentPassword = params.get("currentPassword") instanceof String value ? value : "";
        String password = params.get("password") instanceof String value ? value : "";
        String confirmation = params.get("confirmPassword") instanceof String value ? value : "";
        if (currentPassword.isEmpty() || password.isEmpty() || confirmation.isEmpty()) {
            throw new ApiException(422, "Preencha a senha atual e a nova senha.");
        }
        if (!password.equals(confirmation)) throw new ApiException(422, "As senhas não coincidem.");
        validatePassword(password);
        return withLock(credentialLocks, user.getId(), () -> {
            UserRecord current = users.findById(user.getId());
            if (current == null || !current.isActive()) {
                throw new ApiException(401, "Sessão expirada.");
            }
            if (currentSessionId != null && !currentSessionId.isEmpty()) {
                SessionRecord currentSession = sessions.findWithoutRenewal(currentSessionId);
                if (currentSession == null || !current.getId().equals(currentSession.getUserId())) {
                    throw new ApiException(401, "Sessão expirada.");
                }
            }
            if (!passwords.verify(currentPassword, current.getPasswordHash())) {
                throw new ApiException(422, "A senha atual está incorreta.");
            }

            String hash = passwords.hash(password);
            UserRecord updated = users.update(current.getId(), record -> {
                record.setPasswordHash(hash);
                record.setMustChangePassword(false);
            });
            if (updated == null) throw new ApiException(404, "Usuário não encontrado.");
            if (currentSessionId == null || currentSessionId.isEmpty()) {
                sessions.deleteByUserId(current.getId());
            } else {
                sessions.deleteByUserIdExcept(current.getId(), currentSessionId);
            }
            return updated;
        });
    }

    public UserRecord updateOwnCmsTheme(UserRecord user, Map<String, Object> params) {
        Object raw = params.get("theme");
        if (!(raw instanceof String theme) || !(theme.equals("light") || theme.equals("dark"))) {
            throw new ApiException(422, "Tema do CMS inválido.");
        }
        UserRecord updated = users.update(user.getId(), current -> current.setCmsTheme(theme));
        if (updated == null) throw new ApiException(404, "Usuário não encontrado.");
        return updated;
    }

    public void deleteUser(Object id, UserRecord actor) {
        access.assertSupreme(actor);
        String userId = Sanitizers.text(id, 120);
        withLock(credentialLocks, userId, () -> {
            UserRecord target = users.findById(userId);
            if (target == null) throw new ApiException(404, "Usuário não encontrado.");
            if (isSupremeUser(target)) {
                throw new ApiException(403, "O usuário supremo não pode ser excluído.");
            }
            if (target.getId().equals(actor.getId())) {
                throw new ApiException(403, "Você não pode excluir sua própria conta.");
            }
            sessions.deleteByUserId(target.getId());
            users.delete(target.getId());
            return null;
        });
    }

    public UserRecord createInitialUser(Map<String, Object> params) {
        if (users.hasAny()) throw new ApiException(403, "Setup inicial ja foi concluido.");
        String setupCode = Sanitizers.text(params.get("setupCode"), 160);
        if (properties.adminSetupCode().isEmpty() || !setupCode.equals(properties.adminSetupCode())) {
            throw new ApiException(403, "Codigo de setup invalido.");
        }
        LinkedHashMap<String, Object> initial = new LinkedHashMap<>(params);
        initial.put("role", "admin");
        UserRecord candidate = buildUser(initial, true);
        UserRecord created = users.createIfEmpty(candidate);
        if (created == null) throw new ApiException(403, "Setup inicial ja foi concluido.");
        return created;
    }

    public boolean hasAnyUser() {
        return users.hasAny();
    }

    private UserRecord buildUser(Map<String, Object> params, boolean initialOwner) {
        String name = parseUserName(params.get("name"), true, params.containsKey("name"));
        String email = parseUserEmail(params.get("email"), true, params.containsKey("email"));
        String password = params.get("password") instanceof String value ? value : "";
        String confirmation = params.get("confirmPassword") instanceof String value ? value : password;
        String role = parseUserRole(params.get("role"), true, params.containsKey("role"));
        List<String> permissions = parseUserPermissions(
            params.get("permissions"), params.containsKey("permissions"));
        if (permissions == null) permissions = List.of();
        List<String> cmsPermissions = access.parsePermissions(
            params.get("cmsPermissions"), params.containsKey("cmsPermissions"));
        List<CmsPermissionOverride> overrides = access.parseOverrides(
            params.get("cmsPermissionOverrides"), params.containsKey("cmsPermissionOverrides"));
        String accessProfileId = parseAccessProfileId(
            params.get("accessProfileId"), params.containsKey("accessProfileId"));
        if (!"admin".equals(role) && !permissions.isEmpty()) {
            throw new ApiException(422, "Permissões de usuários exigem perfil de administrador.");
        }
        if (password.isEmpty()) throw new ApiException(422, "Preencha nome, e-mail e senha corretamente.");
        if (!password.equals(confirmation)) throw new ApiException(422, "As senhas não coincidem.");
        validatePassword(password);

        UserRecord user = new UserRecord();
        user.setId(Ids.generate("usr"));
        user.setEmail(email);
        user.setName(name);
        user.setRole(role);
        user.setActive(true);
        user.setIsOwner(initialOwner);
        user.setMustChangePassword(!initialOwner);
        user.setPermissions(new ArrayList<>(initialOwner ? List.of() : permissions));
        if (!initialOwner && accessProfileId != null) user.setAccessProfileId(accessProfileId);
        if (!initialOwner) user.setCmsPermissions(new ArrayList<>(cmsPermissions == null ? List.of() : cmsPermissions));
        if (!initialOwner && overrides != null) user.setCmsPermissionOverrides(copyOverrides(overrides));
        user.setCreatedAt(nowIso());
        user.setPasswordHash(passwords.hash(password));
        return user;
    }

    private List<String> parseUserPermissions(Object value, boolean present) {
        if (!present) return null;
        if (!(value instanceof List<?> list)) {
            throw new ApiException(422, "Permissões de usuário inválidas.");
        }
        LinkedHashSet<String> result = new LinkedHashSet<>();
        for (Object permission : list) {
            if (!(permission instanceof String text) || !USER_PERMISSIONS.contains(text)) {
                throw new ApiException(422, "Permissões de usuário inválidas.");
            }
            result.add(text);
        }
        return List.copyOf(result);
    }

    private String parseUserRole(Object value, boolean required, boolean present) {
        if (!present && !required) return null;
        if (value instanceof String role && (role.equals("admin") || role.equals("user"))) return role;
        throw new ApiException(422, "Perfil de acesso inválido.");
    }

    private Boolean parseActive(Object value, boolean present) {
        if (!present) return null;
        if (value instanceof Boolean active) return active;
        throw new ApiException(422, "O status do usuário deve ser booleano.");
    }

    private String parseUserName(Object value, boolean required, boolean present) {
        if (!present && !required) return null;
        if (!(value instanceof String)) {
            throw new ApiException(422, "Informe um nome válido.");
        }
        String name = Sanitizers.text(value, 81);
        if (name.isEmpty()) throw new ApiException(422, "Informe um nome válido.");
        if (name.length() > 80) throw new ApiException(422, "O nome deve ter no máximo 80 caracteres.");
        return name;
    }

    private String parseUserEmail(Object value, boolean required, boolean present) {
        if (!present && !required) return null;
        if (!(value instanceof String)) throw new ApiException(422, "Informe um e-mail válido.");
        String normalized = Sanitizers.text(value, 161);
        if (normalized.length() > 160) {
            throw new ApiException(422, "O e-mail deve ter no máximo 160 caracteres.");
        }
        String email = sanitizeEmail(value);
        if (email.isEmpty()) throw new ApiException(422, "Informe um e-mail válido.");
        return email;
    }

    private String parseAccessProfileId(Object value, boolean present) {
        if (!present) return null;
        String id = Sanitizers.text(value, 120);
        if (id.isEmpty()) return null;
        var profile = profiles.findById(id);
        if (profile == null || !profile.isActive()) {
            throw new ApiException(422, "Perfil-base de acesso inválido ou inativo.");
        }
        return id;
    }

    private String sanitizeEmail(Object value) {
        String email = Sanitizers.text(value, 160).toLowerCase(java.util.Locale.ROOT);
        return EMAIL.matcher(email).matches() ? email : "";
    }

    private void validatePassword(String password) {
        List<String> errors = passwords.validateStrength(password);
        if (!errors.isEmpty()) throw new ApiException(422, errors.getFirst());
    }

    private void assertLoginRateLimit(String ip, String email) {
        var ipState = rateLimits.state("login:ip", ip, RateLimitService.LOGIN);
        var emailState = email.isEmpty()
            ? null
            : rateLimits.state("login:email", email, RateLimitService.LOGIN);
        if (ipState.count() >= RateLimitService.LOGIN.maxAttempts()
            || (emailState != null && emailState.count() >= RateLimitService.LOGIN.maxAttempts())) {
            throw new ApiException(429, "Muitas tentativas de login. Tente novamente mais tarde.");
        }
    }

    private void registerFailedLogin(String ip, String email) {
        String message = "Muitas tentativas de login. Tente novamente mais tarde.";
        rateLimits.require("login:ip", ip, RateLimitService.LOGIN, message);
        if (!email.isEmpty()) {
            rateLimits.require("login:email", email, RateLimitService.LOGIN, message);
        }
    }

    private static ReentrantLock[] lockStripes() {
        ReentrantLock[] locks = new ReentrantLock[AUTH_LOCK_STRIPES];
        for (int index = 0; index < locks.length; index++) locks[index] = new ReentrantLock();
        return locks;
    }

    private static <T> T withLock(ReentrantLock[] stripes, String key, Supplier<T> operation) {
        return withLocks(stripes, List.of(key), operation);
    }

    /**
     * Locks de rate limit são sempre adquiridos antes do lock de credencial. Os
     * índices de cada grupo são ordenados para impedir ciclos entre IP e e-mail.
     */
    private static <T> T withLocks(
        ReentrantLock[] stripes,
        List<String> keys,
        Supplier<T> operation
    ) {
        List<Integer> indexes = keys.stream()
            .map(key -> Math.floorMod(key.hashCode(), stripes.length))
            .distinct()
            .sorted()
            .toList();
        indexes.forEach(index -> stripes[index].lock());
        try {
            return operation.get();
        } finally {
            for (int index = indexes.size() - 1; index >= 0; index--) {
                stripes[indexes.get(index)].unlock();
            }
        }
    }

    private static List<CmsPermissionOverride> copyOverrides(List<CmsPermissionOverride> source) {
        return source.stream().map(CmsPermissionOverride::copy).toList();
    }

    private String nowIso() {
        return ISO_MILLIS.format(Instant.ofEpochMilli(clock.millis()));
    }

    public record LoginResult(UserRecord user, SessionRecord session) {
    }
}

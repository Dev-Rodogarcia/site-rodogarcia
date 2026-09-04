package br.com.rodogarcia.cms.backend.security;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.model.auth.CmsAccessProfile;
import br.com.rodogarcia.cms.backend.model.auth.CmsPermissionOverride;
import br.com.rodogarcia.cms.backend.model.auth.UserRecord;
import br.com.rodogarcia.cms.backend.repository.auth.CmsAccessProfileRepository;
import br.com.rodogarcia.cms.backend.utils.Ids;
import br.com.rodogarcia.cms.backend.utils.Sanitizers;
import org.springframework.stereotype.Service;

@Service
public class CmsAccessService {

    public static final List<String> CMS_PERMISSIONS = List.of(
        "dashboard", "home", "services", "about-page", "business-page",
        "contact-page", "careers-page", "collections", "quote-page", "improvements",
        "header-navigation", "footer-links", "units", "analytics", "images", "popup",
        "tracking", "seo", "cookie-monitoring", "leads", "cookies", "users",
        "landing-pages"
    );

    private static final Map<String, String> LABELS = Map.ofEntries(
        Map.entry("dashboard", "Dashboard"),
        Map.entry("home", "Página Inicial"),
        Map.entry("services", "Página Serviços"),
        Map.entry("about-page", "Página Sobre"),
        Map.entry("business-page", "Página Empresas"),
        Map.entry("contact-page", "Página Contato"),
        Map.entry("careers-page", "Página Carreiras"),
        Map.entry("collections", "Página Coletas"),
        Map.entry("quote-page", "Página Cotação"),
        Map.entry("improvements", "Página Melhoria"),
        Map.entry("header-navigation", "Navegação"),
        Map.entry("footer-links", "Rodapé"),
        Map.entry("units", "Unidades"),
        Map.entry("analytics", "Analytics"),
        Map.entry("images", "Imagens"),
        Map.entry("popup", "Popup de saída"),
        Map.entry("tracking", "Rastreamento"),
        Map.entry("seo", "SEO"),
        Map.entry("cookie-monitoring", "Consentimentos"),
        Map.entry("leads", "Leads"),
        Map.entry("cookies", "LGPD e cookies"),
        Map.entry("users", "Usuários e acessos"),
        Map.entry("landing-pages", "Landing Pages")
    );

    private static final DateTimeFormatter ISO_MILLIS = new java.time.format.DateTimeFormatterBuilder()
        .appendInstant(3).toFormatter().withZone(ZoneOffset.UTC);

    private final CmsAccessProfileRepository repository;
    private final Clock clock;

    public CmsAccessService(CmsAccessProfileRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public List<Map<String, String>> permissionCatalog() {
        return CMS_PERMISSIONS.stream().map(key -> Map.of("key", key, "label", LABELS.get(key))).toList();
    }

    public boolean isSupreme(UserRecord user) {
        return user != null && user.isAdmin() && user.isActive() && Boolean.TRUE.equals(user.getIsOwner());
    }

    public void assertSupreme(UserRecord user) {
        if (!isSupreme(user)) {
            throw new ApiException(403, "Somente o usuário supremo pode gerenciar acessos.");
        }
    }

    public List<String> effectivePermissions(UserRecord user) {
        if (Boolean.TRUE.equals(user.getIsOwner())) return List.copyOf(CMS_PERMISSIONS);

        boolean referencesProfile = user.getAccessProfileId() != null
            && !user.getAccessProfileId().isEmpty();
        CmsAccessProfile profile = referencesProfile
            ? repository.findById(user.getAccessProfileId())
            : null;
        List<String> base;
        if (referencesProfile) {
            base = profile != null && profile.isActive() && profile.getPermissions() != null
                ? profile.getPermissions() : List.of();
        } else {
            base = user.getCmsPermissions() == null ? CMS_PERMISSIONS : user.getCmsPermissions();
        }
        Set<String> allowed = new LinkedHashSet<>(base);
        if (user.getCmsPermissionOverrides() != null) {
            for (CmsPermissionOverride override : user.getCmsPermissionOverrides()) {
                if (override == null || !CMS_PERMISSIONS.contains(override.getPermission())) continue;
                if ("deny".equals(override.getEffect())) allowed.remove(override.getPermission());
                else if ("grant".equals(override.getEffect())) allowed.add(override.getPermission());
            }
        }
        return CMS_PERMISSIONS.stream().filter(allowed::contains).toList();
    }

    public boolean hasPermission(UserRecord user, String permission) {
        return user != null && user.isAdmin() && user.isActive()
            && effectivePermissions(user).contains(permission);
    }

    public void requireAnyPermission(UserRecord user, String... permissions) {
        for (String permission : permissions) {
            if (hasPermission(user, permission)) return;
        }
        throw new ApiException(403, "Sua conta não tem acesso a esta área do CMS.");
    }

    public List<String> parsePermissions(Object value, boolean present) {
        if (!present) return null;
        if (!(value instanceof List<?> list)) {
            throw new ApiException(422, "Permissões do CMS inválidas.");
        }
        LinkedHashSet<String> parsed = new LinkedHashSet<>();
        for (Object item : list) {
            if (!(item instanceof String permission) || !CMS_PERMISSIONS.contains(permission)) {
                throw new ApiException(422, "Permissões do CMS inválidas.");
            }
            parsed.add(permission);
        }
        return List.copyOf(parsed);
    }

    public List<CmsPermissionOverride> parseOverrides(Object value, boolean present) {
        if (!present) return null;
        if (!(value instanceof List<?> list)) {
            throw new ApiException(422, "Exceções de permissão inválidas.");
        }
        LinkedHashMap<String, CmsPermissionOverride> parsed = new LinkedHashMap<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                throw new ApiException(422, "Exceções de permissão inválidas.");
            }
            Object rawPermission = map.get("permission");
            Object rawEffect = map.get("effect");
            if (!(rawPermission instanceof String permission)
                || !CMS_PERMISSIONS.contains(permission)
                || !(rawEffect instanceof String effect)
                || !(effect.equals("grant") || effect.equals("deny"))) {
                throw new ApiException(422, "Exceções de permissão inválidas.");
            }
            parsed.put(permission, new CmsPermissionOverride(permission, effect));
        }
        return List.copyOf(parsed.values());
    }

    public List<CmsAccessProfile> listProfiles(UserRecord actor, boolean includeInactive) {
        assertSupreme(actor);
        List<CmsAccessProfile> profiles = repository.list();
        return includeInactive
            ? profiles
            : profiles.stream().filter(CmsAccessProfile::isActive).toList();
    }

    public CmsAccessProfile createProfile(Map<String, Object> payload, UserRecord actor) {
        assertSupreme(actor);
        ProfileValues values = parseProfile(payload);
        String foldedName = values.name().toLowerCase(Locale.forLanguageTag("pt-BR"));
        boolean exists = repository.list().stream().anyMatch(profile ->
            String.valueOf(profile.getName()).toLowerCase(Locale.forLanguageTag("pt-BR"))
                .equals(foldedName));
        if (exists) throw new ApiException(409, "Já existe um perfil com esse nome.");

        CmsAccessProfile profile = new CmsAccessProfile();
        String now = nowIso();
        profile.setId(Ids.generate("access"));
        profile.setName(values.name());
        profile.setDescription(values.description());
        profile.setPermissions(values.permissions());
        profile.setActive(true);
        profile.setCreatedAt(now);
        profile.setUpdatedAt(now);
        return repository.create(profile);
    }

    public CmsAccessProfile updateProfile(String id, Map<String, Object> payload, UserRecord actor) {
        assertSupreme(actor);
        CmsAccessProfile profile = repository.findById(id);
        if (profile == null) throw new ApiException(404, "Perfil de acesso não encontrado.");
        ProfileValues values = parseProfile(payload);
        Boolean active = payload.get("active") instanceof Boolean bool ? bool : profile.getActive();
        return repository.update(id, current -> {
            current.setName(values.name());
            current.setDescription(values.description());
            current.setPermissions(values.permissions());
            current.setActive(active);
            current.setUpdatedAt(nowIso());
        });
    }

    public void deleteProfile(String id, UserRecord actor) {
        assertSupreme(actor);
        if (repository.findById(id) == null) {
            throw new ApiException(404, "Perfil de acesso não encontrado.");
        }
        repository.remove(id);
    }

    private ProfileValues parseProfile(Map<String, Object> payload) {
        String name = Sanitizers.text(payload.get("name"), 80);
        String description = Sanitizers.text(payload.get("description"), 220);
        List<String> permissions = parsePermissions(payload.get("permissions"), payload.containsKey("permissions"));
        if (permissions == null) permissions = List.of();
        if (name.isEmpty()) throw new ApiException(422, "Informe o nome do perfil de acesso.");
        return new ProfileValues(name, description, new ArrayList<>(permissions));
    }

    private String nowIso() {
        return ISO_MILLIS.format(Instant.ofEpochMilli(clock.millis()));
    }

    private record ProfileValues(String name, String description, List<String> permissions) {
    }
}

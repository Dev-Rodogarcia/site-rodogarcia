package br.com.rodogarcia.cms.backend.support;

import java.nio.file.Path;
import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.repository.JsonFileStore;
import br.com.rodogarcia.cms.backend.repository.JsonCollections;
import br.com.rodogarcia.cms.backend.repository.RateLimitRepository;
import br.com.rodogarcia.cms.backend.repository.auth.CmsAccessProfileRepository;
import br.com.rodogarcia.cms.backend.repository.auth.SessionRepository;
import br.com.rodogarcia.cms.backend.repository.auth.UserRepository;
import br.com.rodogarcia.cms.backend.security.AdminSecurity;
import br.com.rodogarcia.cms.backend.security.ClientIpResolver;
import br.com.rodogarcia.cms.backend.security.CmsAccessService;
import br.com.rodogarcia.cms.backend.security.CmsSecurityInterceptor;
import br.com.rodogarcia.cms.backend.security.PasswordService;
import br.com.rodogarcia.cms.backend.security.SessionService;
import br.com.rodogarcia.cms.backend.service.AuthService;
import br.com.rodogarcia.cms.backend.service.AuditService;
import br.com.rodogarcia.cms.backend.service.RateLimitService;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import tools.jackson.databind.json.JsonMapper;

public final class AuthTestContext {

    public static final String SETUP_CODE = "codigo-setup-seguro-123";
    public static final String ORIGIN = "http://127.0.0.1:35180";

    public final JsonMapper mapper;
    public final CmsProperties properties;
    public final JsonFileStore jsonStore;
    public final UserRepository users;
    public final SessionRepository sessionRepository;
    public final CmsAccessProfileRepository profiles;
    public final PasswordService passwords;
    public final SessionService sessions;
    public final CmsAccessService access;
    public final RateLimitService rateLimits;
    public final ClientIpResolver clientIpResolver;
    public final AuthService auth;
    public final AuditService audit;
    public final AdminSecurity adminSecurity;
    public final CmsSecurityInterceptor interceptor;

    public AuthTestContext(Path root, Clock clock) {
        Map<String, String> env = new LinkedHashMap<>();
        env.put("NODE_ENV", "development");
        env.put("ADMIN_SETUP_CODE", SETUP_CODE);
        env.put("FRONTEND_ORIGIN", ORIGIN);
        env.put("CMS_INTERNAL_URL", "http://127.0.0.1:35013");
        env.put("CMS_STORAGE_ROOT", root.resolve("storage").toAbsolutePath().toString());
        env.put("TRUST_PROXY", "false");
        this.properties = CmsProperties.from(env, root.resolve("repo/cms/backend"));
        this.mapper = JsonMapper.builder().build();
        this.jsonStore = new JsonFileStore(mapper);
        this.users = new UserRepository(jsonStore, properties.storagePaths());
        this.sessionRepository = new SessionRepository(jsonStore, properties.storagePaths(), clock);
        this.profiles = new CmsAccessProfileRepository(jsonStore, properties.storagePaths());
        this.passwords = new PasswordService();
        this.sessions = new SessionService(sessionRepository, properties, clock);
        this.access = new CmsAccessService(profiles, clock);
        RateLimitRepository rateLimitRepository = new RateLimitRepository(
            jsonStore, properties.storagePaths(), clock);
        this.rateLimits = new RateLimitService(rateLimitRepository);
        this.clientIpResolver = new ClientIpResolver(properties);
        this.auth = new AuthService(
            users,
            sessionRepository,
            profiles,
            passwords,
            sessions,
            access,
            rateLimits,
            clientIpResolver,
            properties,
            clock
        );
        this.audit = new AuditService(
            new JsonCollections(jsonStore), properties.storagePaths(), clientIpResolver, clock
        );
        this.adminSecurity = new AdminSecurity(sessions, users, auth, access);
        this.interceptor = new CmsSecurityInterceptor(
            adminSecurity,
            new RequestPolicy(properties),
            rateLimits,
            clientIpResolver
        );
    }
}

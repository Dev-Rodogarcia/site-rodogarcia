package br.com.rodogarcia.cms.backend.support;

import java.nio.file.Path;
import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.repository.JsonCollections;
import br.com.rodogarcia.cms.backend.repository.JsonFileStore;
import br.com.rodogarcia.cms.backend.repository.RateLimitRepository;
import br.com.rodogarcia.cms.backend.security.ClientIpResolver;
import br.com.rodogarcia.cms.backend.service.AuditService;
import br.com.rodogarcia.cms.backend.service.RateLimitService;
import br.com.rodogarcia.cms.backend.service.TrackingService;
import tools.jackson.databind.json.JsonMapper;

public final class DomainTestContext {

    public final CmsProperties properties;
    public final JsonMapper mapper;
    public final JsonFileStore store;
    public final JsonCollections collections;
    public final ClientIpResolver clientIp;
    public final RateLimitService rateLimits;
    public final AuditService audit;
    public final TrackingService tracking;

    public DomainTestContext(Path root, Clock clock, Map<String, String> extraEnvironment) {
        Map<String, String> environment = new LinkedHashMap<>();
        environment.put("NODE_ENV", "development");
        environment.put("FRONTEND_ORIGIN", "http://127.0.0.1:35180");
        environment.put("CMS_INTERNAL_URL", "http://127.0.0.1:35013");
        environment.put("CMS_STORAGE_ROOT", root.resolve("storage").toAbsolutePath().toString());
        environment.putAll(extraEnvironment);
        properties = CmsProperties.from(environment, root.resolve("repo/cms/backend"));
        mapper = JsonMapper.builder().build();
        store = new JsonFileStore(mapper);
        collections = new JsonCollections(store);
        clientIp = new ClientIpResolver(properties);
        rateLimits = new RateLimitService(new RateLimitRepository(store, properties.storagePaths(), clock));
        audit = new AuditService(collections, properties.storagePaths(), clientIp, clock);
        tracking = new TrackingService(collections, properties.storagePaths(), rateLimits, clientIp, clock);
    }
}

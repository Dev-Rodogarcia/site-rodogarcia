package br.com.rodogarcia.cms.backend.repository.content;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.function.UnaryOperator;

import br.com.rodogarcia.cms.backend.config.StoragePaths;
import br.com.rodogarcia.cms.backend.model.content.ContentDefaults;
import br.com.rodogarcia.cms.backend.model.content.ContentJson;
import br.com.rodogarcia.cms.backend.repository.JsonFileStore;
import br.com.rodogarcia.cms.backend.service.content.ContentMigrationService;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@Repository
public final class ContentRepository {
    private static final List<String> SERIALIZED_KEYS = List.of(
        "homePage", "servicesPage", "aboutPage", "businessPage", "contactPage",
        "careersPage", "quotePage", "collectionsPage", "headerNavigation", "footerLinks",
        "heroSlides", "dnaSlides", "vagas", "feedbacks", "units"
    );
    private static final Set<String> ORDERED_COLLECTIONS = Set.of(
        "heroSlides", "dnaSlides", "vagas", "feedbacks", "units"
    );

    private final JsonFileStore store;
    private final JsonMapper mapper;
    private final StoragePaths paths;
    private final ContentMigrationService migrations;

    public ContentRepository(
        JsonFileStore store,
        StoragePaths paths,
        ContentMigrationService migrations
    ) {
        this.store = store;
        this.mapper = store.mapper();
        this.paths = paths;
        this.migrations = migrations;
    }

    public ObjectNode read() {
        return store.withWriteLock(
            List.of(paths.content(), paths.siteTexts(), paths.mediaSlots()),
            this::readLocked
        );
    }

    public ObjectNode update(UnaryOperator<ObjectNode> command) {
        return store.withWriteLock(
            List.of(paths.content(), paths.siteTexts(), paths.mediaSlots()),
            () -> {
                ObjectNode content = readLocked();
                ObjectNode updated = command.apply(content.deepCopy());
                store.write(paths.content(), serialize(updated));
                return updated.deepCopy();
            }
        );
    }

    public void write(ObjectNode content) {
        store.write(paths.content(), serialize(content));
    }

    private ObjectNode readLocked() {
        boolean missing = !Files.isRegularFile(paths.content());
        JsonNode raw = store.read(paths.content(), ContentDefaults.repositoryContent(mapper));
        JsonNode siteTexts = store.read(paths.siteTexts(), mapper.createObjectNode());
        JsonNode mediaSlots = store.read(paths.mediaSlots(), mapper.createObjectNode());
        ContentMigrationService.MigrationResult result = migrations.migrate(raw, siteTexts, mediaSlots);
        if (missing || result.shouldPersist()) store.write(paths.content(), serialize(result.content()));
        return result.content().deepCopy();
    }

    private ObjectNode serialize(ObjectNode content) {
        ObjectNode result = mapper.createObjectNode();
        for (String key : SERIALIZED_KEYS) {
            JsonNode value = content.get(key);
            if (value == null || value.isNull()) continue;
            if (ORDERED_COLLECTIONS.contains(key) && value.isArray()) {
                ArrayNode ordered = migrationsSort(value);
                result.set(key, ordered);
            } else if (value.isObject() || value.isArray()) {
                result.set(key, value.deepCopy());
            }
        }
        return result;
    }

    private ArrayNode migrationsSort(JsonNode value) {
        ArrayNode result = mapper.createArrayNode();
        ContentJson.array(value).valueStream()
            .filter(JsonNode::isObject)
            .sorted(java.util.Comparator.comparingLong(item -> ContentJson.order(item.get("order"), 0)))
            .forEach(item -> result.add(item.deepCopy()));
        return result;
    }

    public Path path() {
        return paths.content();
    }
}

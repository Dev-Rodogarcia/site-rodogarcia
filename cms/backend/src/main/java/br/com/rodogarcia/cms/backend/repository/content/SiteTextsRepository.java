package br.com.rodogarcia.cms.backend.repository.content;

import br.com.rodogarcia.cms.backend.config.StoragePaths;
import br.com.rodogarcia.cms.backend.repository.JsonFileStore;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

@Repository
public final class SiteTextsRepository {
    private final JsonFileStore store;
    private final StoragePaths paths;

    public SiteTextsRepository(JsonFileStore store, StoragePaths paths) {
        this.store = store;
        this.paths = paths;
    }

    public ObjectNode read() {
        JsonNode value = store.read(paths.siteTexts(), store.mapper().createObjectNode());
        return value.isObject() ? (ObjectNode) value.deepCopy() : store.mapper().createObjectNode();
    }

    public ObjectNode update(java.util.function.UnaryOperator<ObjectNode> command) {
        return store.withWriteLock(java.util.List.of(paths.siteTexts()), () -> {
            ObjectNode updated = command.apply(read());
            store.write(paths.siteTexts(), updated);
            return updated.deepCopy();
        });
    }
}

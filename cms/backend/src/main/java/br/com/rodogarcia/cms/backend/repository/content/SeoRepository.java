package br.com.rodogarcia.cms.backend.repository.content;

import br.com.rodogarcia.cms.backend.config.StoragePaths;
import br.com.rodogarcia.cms.backend.repository.JsonFileStore;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

@Repository
public final class SeoRepository {
    private final JsonFileStore store;
    private final StoragePaths paths;

    public SeoRepository(JsonFileStore store, StoragePaths paths) {
        this.store = store;
        this.paths = paths;
    }

    public ObjectNode read(ObjectNode defaults) {
        JsonNode value = store.read(paths.seoSettings(), defaults);
        return value.isObject() ? (ObjectNode) value.deepCopy() : defaults.deepCopy();
    }

    public void write(ObjectNode value) {
        store.write(paths.seoSettings(), value);
    }

    public ObjectNode update(ObjectNode defaults, java.util.function.UnaryOperator<ObjectNode> command) {
        return store.withWriteLock(java.util.List.of(paths.seoSettings()), () -> {
            ObjectNode updated = command.apply(read(defaults));
            store.write(paths.seoSettings(), updated);
            return updated.deepCopy();
        });
    }
}

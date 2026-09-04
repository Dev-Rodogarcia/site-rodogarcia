package br.com.rodogarcia.cms.backend.repository.content;

import br.com.rodogarcia.cms.backend.config.StoragePaths;
import br.com.rodogarcia.cms.backend.repository.JsonFileStore;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

@Repository
public final class MediaSlotsRepository {
    private final JsonFileStore store;
    private final StoragePaths paths;

    public MediaSlotsRepository(JsonFileStore store, StoragePaths paths) {
        this.store = store;
        this.paths = paths;
    }

    public ObjectNode read() {
        JsonNode value = store.read(paths.mediaSlots(), store.mapper().createObjectNode());
        return value.isObject() ? (ObjectNode) value.deepCopy() : store.mapper().createObjectNode();
    }
}

package br.com.rodogarcia.cms.backend.repository;

import java.nio.file.Path;
import java.util.List;

import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;

@Repository
public class JsonCollections {

    private final JsonFileStore store;

    public JsonCollections(JsonFileStore store) {
        this.store = store;
    }

    public ArrayNode read(Path path) {
        return store.readArray(path);
    }

    public void write(Path path, JsonNode items) {
        store.write(path, items);
    }

    public <T> T mutate(Path path, java.util.function.Function<ArrayNode, T> mutation) {
        return store.withWriteLock(List.of(path), () -> {
            ArrayNode items = store.readArray(path);
            T result = mutation.apply(items);
            store.write(path, items);
            return result;
        });
    }
}

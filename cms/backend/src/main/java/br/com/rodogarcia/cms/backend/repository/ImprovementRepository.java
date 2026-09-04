package br.com.rodogarcia.cms.backend.repository;

import java.nio.file.Path;
import java.util.List;
import java.util.function.Function;

import br.com.rodogarcia.cms.backend.config.StoragePaths;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.node.ArrayNode;

@Repository
public final class ImprovementRepository {
    private final JsonFileStore store;
    private final StoragePaths paths;

    public ImprovementRepository(JsonFileStore store, StoragePaths paths) {
        this.store = store;
        this.paths = paths;
    }

    public ArrayNode read() {
        return store.readArray(paths.improvements());
    }

    public void write(ArrayNode value) {
        store.write(paths.improvements(), value);
    }

    public <T> T mutate(Function<ArrayNode, T> operation) {
        return store.withWriteLock(List.of(paths.improvements()), () -> {
            ArrayNode current = store.readArray(paths.improvements());
            T result = operation.apply(current);
            store.write(paths.improvements(), current);
            return result;
        });
    }

    public <T> T locked(Function<ArrayNode, T> operation) {
        return store.withWriteLock(
            List.of(paths.improvements()),
            () -> operation.apply(store.readArray(paths.improvements()))
        );
    }

    public Path attachmentRoot() {
        return paths.improvementAttachments();
    }

    public JsonFileStore store() {
        return store;
    }
}

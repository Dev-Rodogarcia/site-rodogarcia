package br.com.rodogarcia.landingbuilder.repository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import br.com.rodogarcia.landingbuilder.exception.ApiException;
import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

abstract class JsonArrayRepository {

    private final ObjectMapper mapper;
    private final Path file;

    JsonArrayRepository(ObjectMapper mapper, Path file) {
        this.mapper = mapper;
        this.file = file;
    }

    protected final synchronized ArrayNode read() {
        if (Files.notExists(file)) return mapper.createArrayNode();
        try {
            JsonNode value = mapper.readTree(Files.readAllBytes(file));
            if (value instanceof ArrayNode array) return array;
        } catch (IOException ignored) {
            // O erro público não revela o caminho do volume nem o parser usado.
        }
        throw new ApiException("Não foi possível processar a solicitação.", 500);
    }

    protected final synchronized void write(ArrayNode value) {
        Path directory = file.getParent();
        try {
            Files.createDirectories(directory);
            Path temporary = directory.resolve(file.getFileName() + "." + UUID.randomUUID() + ".tmp");
            Files.write(temporary, mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(value));
            try {
                Files.move(temporary, file, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException ignored) {
                Files.move(temporary, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ignored) {
            throw new ApiException("Não foi possível processar a solicitação.", 500);
        }
    }
}

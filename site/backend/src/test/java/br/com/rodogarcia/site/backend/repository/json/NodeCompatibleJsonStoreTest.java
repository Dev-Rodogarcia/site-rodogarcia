package br.com.rodogarcia.site.backend.repository.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import br.com.rodogarcia.site.backend.exception.JsonStoreException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

class NodeCompatibleJsonStoreTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final NodeCompatibleJsonStore store = new NodeCompatibleJsonStore(jsonMapper);

    @TempDir
    Path temporaryDirectory;

    @Test
    void writesUtf8WithTwoSpacesLfAndNoTrailingNewline() throws Exception {
        Path file = temporaryDirectory.resolve("nested/rate-limits.json");
        ObjectNode value = jsonMapper.createObjectNode();
        ObjectNode entry = value.putObject("bucket");
        entry.put("count", 1);
        entry.put("resetAt", 1234);

        store.write(file, value);

        assertThat(Files.readString(file, StandardCharsets.UTF_8)).isEqualTo(
            "{\n  \"bucket\": {\n    \"count\": 1,\n    \"resetAt\": 1234\n  }\n}"
        );
        assertThat(Files.list(file.getParent()).map(path -> path.getFileName().toString()))
            .containsExactly("rate-limits.json");
    }

    @Test
    void stripsExactlyOneBomAndReturnsACopyForMissingFiles() throws Exception {
        Path file = temporaryDirectory.resolve("bom.json");
        Files.writeString(file, "\uFEFF{\"ok\":true}", StandardCharsets.UTF_8);

        assertThat(store.read(file, jsonMapper.createObjectNode()).path("ok").asBoolean()).isTrue();

        ObjectNode fallback = jsonMapper.createObjectNode().put("default", true);
        assertThat(store.read(temporaryDirectory.resolve("missing.json"), fallback))
            .isEqualTo(fallback)
            .isNotSameAs(fallback);
    }

    @Test
    void preservesInvalidSyntaxAndFailsClosed() throws Exception {
        Path file = temporaryDirectory.resolve("rate-limits.json");
        Files.writeString(file, "{invalid", StandardCharsets.UTF_8);

        assertThatThrownBy(() -> store.read(file, jsonMapper.createObjectNode()))
            .isInstanceOf(JsonStoreException.class);
        assertThat(Files.list(temporaryDirectory)
            .map(path -> path.getFileName().toString())
            .filter(name -> name.startsWith(".rate-limits.json.invalid-")))
            .hasSize(1);
    }

    @Test
    void treatsAnEmptyDocumentAsInvalidJson() throws Exception {
        Path file = temporaryDirectory.resolve("empty.json");
        Files.write(file, new byte[0]);

        assertThatThrownBy(() -> store.read(file, jsonMapper.createObjectNode()))
            .isInstanceOf(JsonStoreException.class);
        assertThat(Files.list(temporaryDirectory)
            .map(path -> path.getFileName().toString())
            .filter(name -> name.startsWith(".empty.json.invalid-")))
            .hasSize(1);
    }

    @Test
    void rejectsAndPreservesTrailingJsonDocuments() throws Exception {
        Path file = temporaryDirectory.resolve("trailing.json");
        Files.writeString(file, "{} {}", StandardCharsets.UTF_8);

        assertThatThrownBy(() -> store.read(file, jsonMapper.createObjectNode()))
            .isInstanceOf(JsonStoreException.class);
        assertThat(Files.list(temporaryDirectory)
            .map(path -> path.getFileName().toString())
            .filter(name -> name.startsWith(".trailing.json.invalid-")))
            .hasSize(1);
    }

    @Test
    void writesNodeStyleLowercaseUnicodeEscapes() throws Exception {
        Path file = temporaryDirectory.resolve("unicode.json");
        ObjectNode value = jsonMapper.createObjectNode();
        value.put("surrogate", "\uD800");
        value.put("literal", "\\uD800");

        store.write(file, value);

        assertThat(Files.readString(file, StandardCharsets.UTF_8)).isEqualTo(
            "{\n  \"surrogate\": \"\\ud800\",\n  \"literal\": \"\\\\uD800\"\n}"
        );
    }
}

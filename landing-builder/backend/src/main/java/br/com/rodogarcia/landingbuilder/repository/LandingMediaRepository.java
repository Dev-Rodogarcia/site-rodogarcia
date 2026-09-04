package br.com.rodogarcia.landingbuilder.repository;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import br.com.rodogarcia.landingbuilder.config.LandingBuilderProperties;
import java.nio.file.Path;
import org.springframework.stereotype.Repository;

@Repository
public final class LandingMediaRepository extends JsonArrayRepository {

    private final Path mediaRoot;

    public LandingMediaRepository(ObjectMapper mapper, LandingBuilderProperties properties) {
        super(mapper, properties.storageRoot().resolve("media.json"));
        mediaRoot = properties.storageRoot().resolve("media").toAbsolutePath().normalize();
    }

    public ArrayNode readMedia() {
        return read();
    }

    public void writeMedia(ArrayNode media) {
        write(media);
    }

    public Path mediaRoot() {
        return mediaRoot;
    }
}

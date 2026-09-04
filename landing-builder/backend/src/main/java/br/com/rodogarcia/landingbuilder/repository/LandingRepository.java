package br.com.rodogarcia.landingbuilder.repository;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import br.com.rodogarcia.landingbuilder.config.LandingBuilderProperties;
import org.springframework.stereotype.Repository;

@Repository
public final class LandingRepository extends JsonArrayRepository {

    public LandingRepository(ObjectMapper mapper, LandingBuilderProperties properties) {
        super(mapper, properties.storageRoot().resolve("landings.json"));
    }

    public ArrayNode readLandings() {
        return read();
    }

    public void writeLandings(ArrayNode landings) {
        write(landings);
    }
}

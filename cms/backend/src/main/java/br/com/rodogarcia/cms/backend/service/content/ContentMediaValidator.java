package br.com.rodogarcia.cms.backend.service.content;

import tools.jackson.databind.JsonNode;

public interface ContentMediaValidator {
    String image(JsonNode value, String label);

    String video(JsonNode value, String label);

    String media(JsonNode value, String label);

    String normalize(JsonNode value);

    boolean isKnownImage(String value);
}

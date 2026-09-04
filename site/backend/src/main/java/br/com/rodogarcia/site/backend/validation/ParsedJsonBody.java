package br.com.rodogarcia.site.backend.validation;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.MissingNode;

public final class ParsedJsonBody {

    public static final String ATTRIBUTE = ParsedJsonBody.class.getName() + ".value";

    private ParsedJsonBody() {
    }

    public static JsonNode from(HttpServletRequest request) {
        Object value = request.getAttribute(ATTRIBUTE);
        return value instanceof JsonNode node ? node : MissingNode.getInstance();
    }
}

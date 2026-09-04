package br.com.rodogarcia.site.backend.validation;

import br.com.rodogarcia.site.backend.utils.NodeUtf8;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Lê exatamente um documento JSON, como JSON.parse/Response.json no runtime Node. */
public final class StrictJson {

    private StrictJson() {
    }

    public static JsonNode readTree(JsonMapper mapper, byte[] source) throws JacksonException {
        // iconv/Response.json substituem UTF-8 inválido e removem exatamente um BOM inicial.
        return readDecodedText(mapper, NodeUtf8.decode(source));
    }

    public static JsonNode readDecodedText(JsonMapper mapper, String source)
        throws JacksonException {
        return readTree(
            mapper,
            !source.isEmpty() && source.charAt(0) == '\uFEFF' ? source.substring(1) : source
        );
    }

    public static JsonNode readTree(JsonMapper mapper, String source) throws JacksonException {
        return requireDocument(
            mapper.reader()
                .with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                .readTree(source)
        );
    }

    private static JsonNode requireDocument(JsonNode value) throws JacksonException {
        if (value == null || value.isMissingNode()) {
            throw new EmptyJsonDocumentException();
        }
        return value;
    }

    private static final class EmptyJsonDocumentException extends JacksonException {

        private EmptyJsonDocumentException() {
            super("O documento JSON está vazio.");
        }
    }
}

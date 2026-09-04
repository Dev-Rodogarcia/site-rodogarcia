package br.com.rodogarcia.site.backend.validation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.DoubleNode;
import tools.jackson.databind.node.StringNode;

class EslTextNormalizerTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Test
    void mirrorsControlWhitespaceTrimAndUtf16Slice() {
        JsonNode text = StringNode.valueOf("\u0000 A\u00A0\tB\u3000 C ");
        assertEquals("A B C", EslTextNormalizer.sanitizeText(text, 100));

        String cutPair = EslTextNormalizer.sanitizeText(StringNode.valueOf("A😀B"), 2);
        assertEquals(2, cutPair.length());
        assertEquals('A', cutPair.charAt(0));
        assertTrue(Character.isHighSurrogate(cutPair.charAt(1)));
    }

    @Test
    void acceptsOnlyStringsAndNumbersForSanitizedText() throws Exception {
        assertEquals("", EslTextNormalizer.sanitizeText(jsonMapper.readTree("true"), 10));
        assertEquals("", EslTextNormalizer.sanitizeText(jsonMapper.readTree("{}"), 10));
        assertEquals("", EslTextNormalizer.sanitizeText(jsonMapper.readTree("null"), 10));
        assertEquals("1", EslTextNormalizer.sanitizeText(jsonMapper.readTree("1.0"), 10));
        assertEquals("0", EslTextNormalizer.sanitizeText(DoubleNode.valueOf(-0.0d), 10));
        assertEquals("0.000001", EslTextNormalizer.sanitizeText(DoubleNode.valueOf(1e-6d), 100));
        assertEquals("1e-7", EslTextNormalizer.sanitizeText(DoubleNode.valueOf(1e-7d), 100));
        assertEquals(
            "100000000000000000000",
            EslTextNormalizer.sanitizeText(DoubleNode.valueOf(1e20d), 100)
        );
        assertEquals("1e+21", EslTextNormalizer.sanitizeText(DoubleNode.valueOf(1e21d), 100));
    }

    @Test
    void normalizesEmailAndAsciiDigitsLikeNode() throws Exception {
        assertEquals("user@example.com", EslTextNormalizer.sanitizeEmail(StringNode.valueOf(" USER@EXAMPLE.COM ")));
        assertEquals("", EslTextNormalizer.sanitizeEmail(StringNode.valueOf("user @example.com")));
        assertEquals(
            "12345678000190",
            EslTextNormalizer.digits(StringNode.valueOf("12.345.678/0001-90"), 14)
        );
        assertEquals(
            "12345678000190",
            EslTextNormalizer.digits(jsonMapper.readTree("12345678000190"), 14)
        );
    }

    @Test
    void reproducesRelevantJavascriptNumberCoercions() throws Exception {
        assertEquals(1.0d, EslTextNormalizer.coerceNumber(jsonMapper.readTree("true")));
        assertEquals(0.0d, EslTextNormalizer.coerceNumber(jsonMapper.readTree("null")));
        assertEquals(0.0d, EslTextNormalizer.coerceNumber(jsonMapper.readTree("\"\"")));
        assertEquals(16.0d, EslTextNormalizer.coerceNumber(jsonMapper.readTree("\"0x10\"")));
        assertEquals(5.0d, EslTextNormalizer.coerceNumber(jsonMapper.readTree("[5]")));
        assertEquals(5.0d, EslTextNormalizer.coerceNumber(jsonMapper.readTree("[[5]]")));
        assertEquals(0.0d, EslTextNormalizer.coerceNumber(jsonMapper.readTree("[]")));
        assertTrue(Double.isNaN(EslTextNormalizer.coerceNumber(jsonMapper.readTree("[1,2]"))));
        assertTrue(Double.isNaN(EslTextNormalizer.coerceNumber(jsonMapper.readTree("{}"))));
    }
}

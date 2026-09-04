package br.com.rodogarcia.site.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import br.com.rodogarcia.site.backend.utils.EcmaScriptJsonNumber;
import tools.jackson.databind.json.JsonMapper;

class ExpressJsonResponseTest {

    @Test
    void reproducesTheExpressWeakEtagForHealth() {
        assertThat(ExpressJsonResponse.weakEtag("{\"ok\":true}".getBytes(StandardCharsets.UTF_8)))
            .isEqualTo("W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"");
    }

    @Test
    void usesWeakComparisonButHonorsRequestNoCache() throws Exception {
        ExpressJsonResponse writer = new ExpressJsonResponse(JsonMapper.builder().build());
        MockHttpServletRequest freshRequest = new MockHttpServletRequest("GET", "/health");
        freshRequest.addHeader("If-None-Match", "\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"");
        MockHttpServletResponse freshResponse = new MockHttpServletResponse();

        writer.write(freshRequest, freshResponse, 200, java.util.Map.of("ok", true));

        assertThat(freshResponse.getStatus()).isEqualTo(304);
        assertThat(freshResponse.getHeader("ETag"))
            .isEqualTo("W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"");
        assertThat(freshResponse.getContentAsByteArray()).isEmpty();

        MockHttpServletRequest reloadRequest = new MockHttpServletRequest("GET", "/health");
        reloadRequest.addHeader("If-None-Match", "W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"");
        reloadRequest.addHeader("Cache-Control", "max-age=0, no-cache");
        MockHttpServletResponse reloadResponse = new MockHttpServletResponse();
        writer.write(reloadRequest, reloadResponse, 200, java.util.Map.of("ok", true));

        assertThat(reloadResponse.getStatus()).isEqualTo(200);
        assertThat(reloadResponse.getContentAsString(StandardCharsets.UTF_8))
            .isEqualTo("{\"ok\":true}");

        MockHttpServletRequest nodeQuirkRequest = new MockHttpServletRequest("GET", "/health");
        nodeQuirkRequest.addHeader("If-None-Match", "W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"");
        nodeQuirkRequest.addHeader("Cache-Control", "No-Cache");
        MockHttpServletResponse nodeQuirkResponse = new MockHttpServletResponse();
        writer.write(nodeQuirkRequest, nodeQuirkResponse, 200, java.util.Map.of("ok", true));

        assertThat(nodeQuirkResponse.getStatus()).isEqualTo(304);

        assertThat(statusFor(writer, " * ")).isEqualTo(200);
        assertThat(statusFor(writer, " W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\" "))
            .isEqualTo(304);
        assertThat(statusFor(writer, "\tW/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"\t"))
            .isEqualTo(200);
    }

    @Test
    void documentsTheNumericLexemesRequiredByJsonStringify() {
        ExpressJsonResponse writer = new ExpressJsonResponse(JsonMapper.builder().build());
        java.util.LinkedHashMap<String, Object> numbers = new java.util.LinkedHashMap<>();
        numbers.put("small", EcmaScriptJsonNumber.of(1e-7));
        numbers.put("large", EcmaScriptJsonNumber.of(1e21));
        numbers.put("fixed", EcmaScriptJsonNumber.of(1e20));
        numbers.put("roundTripInteger", EcmaScriptJsonNumber.of(1_000_000_000_000_000_100D));

        assertThat(new String(writer.serialize(numbers), StandardCharsets.UTF_8)).isEqualTo(
            "{\"small\":1e-7,\"large\":1e+21,\"fixed\":100000000000000000000," +
                "\"roundTripInteger\":1000000000000000100}"
        );
    }

    @Test
    void joinsDuplicateConditionalHeadersLikeNode() throws Exception {
        ExpressJsonResponse writer = new ExpressJsonResponse(JsonMapper.builder().build());
        MockHttpServletRequest etagRequest = new MockHttpServletRequest("GET", "/health");
        etagRequest.addHeader("If-None-Match", "\"unrelated\"");
        etagRequest.addHeader("If-None-Match", "W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"");
        MockHttpServletResponse etagResponse = new MockHttpServletResponse();

        writer.write(etagRequest, etagResponse, 200, java.util.Map.of("ok", true));

        assertThat(etagResponse.getStatus()).isEqualTo(304);

        MockHttpServletRequest cacheRequest = new MockHttpServletRequest("GET", "/health");
        cacheRequest.addHeader("If-None-Match", "W/\"b-Ai2R8hgEarLmHKwesT1qcY913ys\"");
        cacheRequest.addHeader("Cache-Control", "max-age=0");
        cacheRequest.addHeader("Cache-Control", "no-cache");
        MockHttpServletResponse cacheResponse = new MockHttpServletResponse();

        writer.write(cacheRequest, cacheResponse, 200, java.util.Map.of("ok", true));

        assertThat(cacheResponse.getStatus()).isEqualTo(200);
    }

    @Test
    void writesLowercaseUnicodeEscapesWithoutChangingLiteralBackslashUText() {
        ExpressJsonResponse writer = new ExpressJsonResponse(JsonMapper.builder().build());
        java.util.LinkedHashMap<String, String> values = new java.util.LinkedHashMap<>();
        values.put("high", "\uD800");
        values.put("low", "\uDFFF");
        values.put("control", "\u001F");
        values.put("literal", "\\uD800");

        assertThat(new String(writer.serialize(values), StandardCharsets.UTF_8)).isEqualTo(
            "{\"high\":\"\\ud800\",\"low\":\"\\udfff\",\"control\":\"\\u001f\","
                + "\"literal\":\"\\\\uD800\"}"
        );
    }

    private static int statusFor(ExpressJsonResponse writer, String ifNoneMatch)
        throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health");
        request.addHeader("If-None-Match", ifNoneMatch);
        MockHttpServletResponse response = new MockHttpServletResponse();
        writer.write(request, response, 200, java.util.Map.of("ok", true));
        return response.getStatus();
    }
}

package br.com.rodogarcia.site.backend.validation;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.Base64;
import java.util.zip.GZIPOutputStream;

import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

class JsonBodyCompatibilityFilterTest {

    private final JsonMapper mapper = JsonMapper.builder().build();
    private final JsonBodyCompatibilityFilter filter = new JsonBodyCompatibilityFilter(
        mapper,
        new ExpressJsonResponse(mapper)
    );

    @Test
    void parsesAnObjectOnceAndStoresItAsARequestAttribute() throws Exception {
        MockHttpServletRequest request = request("{\"ok\":true}");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilter(request, response, (filteredRequest, ignored) -> {
            called.set(true);
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest).path("ok").asBoolean())
                .isTrue();
        });

        assertThat(called).isTrue();
    }

    @Test
    void mirrorsTheCurrentGeneric500ForPrimitiveAndMalformedJson() throws Exception {
        for (String body : new String[] { "true", "{invalid", "{} {}", "   " }) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request(body), response, (ignoredRequest, ignoredResponse) -> {
                throw new AssertionError("O parser não deveria encaminhar este corpo.");
            });

            assertThat(response.getStatus()).isEqualTo(500);
            assertThat(response.getContentAsString(StandardCharsets.UTF_8))
                .isEqualTo("{\"error\":\"Erro interno no servidor.\"}");
        }
    }

    @Test
    void mapsAZeroByteJsonBodyToTheEmptyObjectUsedByBodyParser() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilter(request(""), response, (filteredRequest, ignored) -> {
            called.set(true);
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest).isObject())
                .isTrue();
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest).isEmpty())
                .isTrue();
        });

        assertThat(called).isTrue();
    }

    @Test
    void replacesMalformedUtf8LikeNodeBeforeParsingJson() throws Exception {
        byte[] prefix = "{\"value\":\"".getBytes(StandardCharsets.UTF_8);
        byte[] suffix = "\"}".getBytes(StandardCharsets.UTF_8);
        byte[] body = new byte[prefix.length + 1 + suffix.length];
        System.arraycopy(prefix, 0, body, 0, prefix.length);
        body[prefix.length] = (byte) 0xc3;
        System.arraycopy(suffix, 0, body, prefix.length + 1, suffix.length);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/unknown");
        request.setContentType("application/json");
        setFramedContent(request, body);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilter(request, response, (filteredRequest, ignored) -> {
            called.set(true);
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest)
                .path("value").stringValue()).isEqualTo("\ufffd");
        });

        assertThat(called).isTrue();

        byte[] surrogatePrefix = "{\"value\":\"".getBytes(StandardCharsets.UTF_8);
        byte[] surrogateBody = new byte[surrogatePrefix.length + 3 + suffix.length];
        System.arraycopy(surrogatePrefix, 0, surrogateBody, 0, surrogatePrefix.length);
        surrogateBody[surrogatePrefix.length] = (byte) 0xED;
        surrogateBody[surrogatePrefix.length + 1] = (byte) 0xA0;
        surrogateBody[surrogatePrefix.length + 2] = (byte) 0x80;
        System.arraycopy(suffix, 0, surrogateBody, surrogatePrefix.length + 3, suffix.length);
        MockHttpServletRequest surrogateRequest = new MockHttpServletRequest("POST", "/unknown");
        surrogateRequest.setContentType("application/json");
        setFramedContent(surrogateRequest, surrogateBody);

        filter.doFilter(
            surrogateRequest,
            new MockHttpServletResponse(),
            (filteredRequest, ignored) -> assertThat(
                ParsedJsonBody.from((MockHttpServletRequest) filteredRequest)
                    .path("value").stringValue()
            ).isEqualTo("\uFFFD\uFFFD\uFFFD")
        );
    }

    @Test
    void stripsExactlyOneUtf8BomLikeBodyParser() throws Exception {
        MockHttpServletRequest singleBom = request("\uFEFF{\"ok\":true}");
        MockHttpServletResponse singleResponse = new MockHttpServletResponse();
        AtomicBoolean called = new AtomicBoolean();

        filter.doFilter(singleBom, singleResponse, (filteredRequest, ignored) -> {
            called.set(true);
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest)
                .path("ok").asBoolean()).isTrue();
        });

        assertThat(called).isTrue();

        MockHttpServletResponse doubleResponse = new MockHttpServletResponse();
        filter.doFilter(request("\uFEFF\uFEFF{\"ok\":true}"), doubleResponse,
            (ignoredRequest, ignoredResponse) -> {
                throw new AssertionError("O segundo BOM precisa invalidar o JSON.");
            });
        assertThat(doubleResponse.getStatus()).isEqualTo(500);
    }

    @Test
    void mapsABomOnlyBodyToEmptyObjectButStillRejectsTwoBoms() throws Exception {
        for (MockHttpServletRequest request : new MockHttpServletRequest[] {
            binaryRequest("application/json;charset=utf-8", new byte[] {
                (byte) 0xef, (byte) 0xbb, (byte) 0xbf
            }),
            binaryRequest("application/json;charset=utf-16le", new byte[] {
                (byte) 0xff, (byte) 0xfe
            }),
            binaryRequest("application/json;charset=utf-32le", new byte[] {
                (byte) 0xff, (byte) 0xfe, 0, 0
            })
        }) {
            AtomicBoolean called = new AtomicBoolean();
            filter.doFilter(request, new MockHttpServletResponse(), (filteredRequest, ignored) -> {
                called.set(true);
                assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest).isEmpty())
                    .isTrue();
            });
            assertThat(called).isTrue();
        }

        MockHttpServletResponse doubleResponse = new MockHttpServletResponse();
        filter.doFilter(request("\uFEFF\uFEFF"), doubleResponse, (ignoredRequest, ignored) -> {
            throw new AssertionError("Dois BOMs não podem virar corpo vazio.");
        });
        assertThat(doubleResponse.getStatus()).isEqualTo(500);
    }

    @Test
    void usesTheLastCharsetAndUnescapesQuotedPairsLikeContentType() throws Exception {
        MockHttpServletRequest duplicate = binaryRequest(
            "application/json; charset=utf-8; charset=utf-16le",
            "{}".getBytes(StandardCharsets.UTF_16LE)
        );
        AtomicBoolean duplicateCalled = new AtomicBoolean();
        filter.doFilter(duplicate, new MockHttpServletResponse(), (filteredRequest, ignored) -> {
            duplicateCalled.set(true);
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest).isObject())
                .isTrue();
        });
        assertThat(duplicateCalled).isTrue();

        MockHttpServletRequest escaped = binaryRequest(
            "application/json; charset=\"utf\\-8\"",
            "{}".getBytes(StandardCharsets.UTF_8)
        );
        AtomicBoolean escapedCalled = new AtomicBoolean();
        filter.doFilter(escaped, new MockHttpServletResponse(), (filteredRequest, ignored) ->
            escapedCalled.set(true)
        );
        assertThat(escapedCalled).isTrue();
    }

    @Test
    void rejectsMalformedContentTypeParametersLikeTheNodeParser() throws Exception {
        MockHttpServletRequest request = binaryRequest(
            "application/json; charset",
            "{}".getBytes(StandardCharsets.UTF_8)
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignored) -> {
            throw new AssertionError("Content-Type malformado não pode avançar.");
        });

        assertThat(response.getStatus()).isEqualTo(500);
    }

    @Test
    void rejectsJoinedDuplicateContentEncodingLikeNode() throws Exception {
        MockHttpServletRequest request = request("{}");
        request.addHeader("Content-Encoding", "identity");
        request.addHeader("Content-Encoding", "gzip");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> {
            throw new AssertionError("Content-Encoding repetido não pode avançar.");
        });

        assertThat(response.getStatus()).isEqualTo(500);
    }

    @Test
    void mirrorsTheGeneric500ForANonUtfJsonCharset() throws Exception {
        MockHttpServletRequest request = request("{}");
        request.setContentType("application/json;charset=latin1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> {
            throw new AssertionError("Charset não UTF não pode chegar ao roteamento.");
        });

        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getContentAsString(StandardCharsets.UTF_8))
            .isEqualTo("{\"error\":\"Erro interno no servidor.\"}");
    }

    @Test
    void mirrorsIconvForOddUtf16BytesAndLoneSurrogates() throws Exception {
        MockHttpServletRequest oddByte = new MockHttpServletRequest("POST", "/api/test");
        oddByte.setContentType("application/json;charset=utf-16le");
        setFramedContent(oddByte, new byte[] { 0x7B, 0, 0x7D, 0, 0x78 });
        AtomicBoolean oddCalled = new AtomicBoolean();

        filter.doFilter(oddByte, new MockHttpServletResponse(), (filteredRequest, ignored) -> {
            oddCalled.set(true);
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest).isObject())
                .isTrue();
        });

        assertThat(oddCalled).isTrue();

        String prefix = "{\"value\":\"";
        String suffix = "\"}";
        byte[] prefixBytes = prefix.getBytes(StandardCharsets.UTF_16LE);
        byte[] suffixBytes = suffix.getBytes(StandardCharsets.UTF_16LE);
        byte[] body = new byte[prefixBytes.length + 2 + suffixBytes.length];
        System.arraycopy(prefixBytes, 0, body, 0, prefixBytes.length);
        body[prefixBytes.length] = 0;
        body[prefixBytes.length + 1] = (byte) 0xD8;
        System.arraycopy(suffixBytes, 0, body, prefixBytes.length + 2, suffixBytes.length);
        MockHttpServletRequest surrogate = new MockHttpServletRequest("POST", "/api/test");
        surrogate.setContentType("application/json;charset=utf-16le");
        setFramedContent(surrogate, body);

        filter.doFilter(surrogate, new MockHttpServletResponse(), (filteredRequest, ignored) ->
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest)
                .path("value").stringValue()).isEqualTo("\uD800")
        );
    }

    @Test
    void acceptsUtf7CharsetsAcceptedByBodyParserAndIconvLite() throws Exception {
        for (String charset : new String[] { "utf-7", "utf-7-imap" }) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");
            request.setContentType("application/json;charset=" + charset);
            setFramedContent(request, "{\"ok\":true}".getBytes(StandardCharsets.US_ASCII));
            AtomicBoolean called = new AtomicBoolean();

            filter.doFilter(request, new MockHttpServletResponse(), (filteredRequest, ignored) -> {
                called.set(true);
                assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest)
                    .path("ok").asBoolean()).isTrue();
            });

            assertThat(called).isTrue();
        }
    }

    @Test
    void inflatesGzipBeforeApplyingTheJsonContract() throws Exception {
        java.io.ByteArrayOutputStream compressed = new java.io.ByteArrayOutputStream();
        try (GZIPOutputStream gzip = new GZIPOutputStream(compressed)) {
            gzip.write("{\"ok\":true}".getBytes(StandardCharsets.UTF_8));
        }
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");
        request.setContentType("application/json");
        request.addHeader("Content-Encoding", "gzip");
        setFramedContent(request, compressed.toByteArray());
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (filteredRequest, ignoredResponse) ->
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest)
                .path("ok").asBoolean()).isTrue()
        );

        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void inflatesBrotliBeforeApplyingTheJsonContract() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");
        request.setContentType("application/json");
        request.addHeader("Content-Encoding", "br");
        setFramedContent(request, Base64.getDecoder().decode("CwWAeyJvayI6dHJ1ZX0D"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (filteredRequest, ignoredResponse) ->
            assertThat(ParsedJsonBody.from((MockHttpServletRequest) filteredRequest)
                .path("ok").asBoolean()).isTrue()
        );

        assertThat(response.getStatus()).isEqualTo(200);
    }

    private static MockHttpServletRequest request(String body) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");
        request.setContentType("application/json");
        setFramedContent(request, body.getBytes(StandardCharsets.UTF_8));
        return request;
    }

    private static MockHttpServletRequest binaryRequest(String contentType, byte[] body) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/test");
        request.setContentType(contentType);
        setFramedContent(request, body);
        return request;
    }

    private static void setFramedContent(MockHttpServletRequest request, byte[] body) {
        request.setContent(body);
        request.addHeader("Content-Length", Integer.toString(body.length));
    }
}

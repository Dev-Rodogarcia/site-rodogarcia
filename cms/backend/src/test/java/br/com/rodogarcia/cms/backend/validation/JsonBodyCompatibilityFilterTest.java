package br.com.rodogarcia.cms.backend.validation;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

class JsonBodyCompatibilityFilterTest {

    private final JsonBodyCompatibilityFilter filter =
        new JsonBodyCompatibilityFilter(JsonMapper.builder().build());

    @Test
    void preservesTheExpressMalformedJsonContract() throws Exception {
        MockHttpServletRequest request = jsonRequest("{\"email\":");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> continued.set(true));

        assertThat(continued).isFalse();
        assertThat(response.getStatus()).isEqualTo(400);
        assertThat(response.getContentAsString()).isEqualTo("{\"error\":\"JSON inválido.\"}");
    }

    @Test
    void preservesTheCurrentExpressGenericErrorForJsonAboveTwoMebibytes() throws Exception {
        byte[] body = new byte[JsonBodyCompatibilityFilter.MAX_JSON_BYTES + 1];
        java.util.Arrays.fill(body, (byte) ' ');
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setContentType("application/json");
        request.setContent(body);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> continued.set(true));

        assertThat(continued).isFalse();
        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getContentAsString()).isEqualTo("{\"error\":\"Erro interno no servidor.\"}");
    }

    @Test
    void passesAnEmptyJsonRequestThroughLikeExpressJson() throws Exception {
        MockHttpServletRequest request = jsonRequest("");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean();

        filter.doFilter(request, response, (wrapped, ignoredResponse) -> {
            continued.set(true);
            assertThat(wrapped.getInputStream().readAllBytes()).isEmpty();
        });

        assertThat(continued).isTrue();
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void exposesTheSingleParsedBodyToControllersAndKeepsArraysValid() throws Exception {
        MockHttpServletRequest objectRequest = jsonRequest("{\"value\":42}");
        filter.doFilter(objectRequest, new MockHttpServletResponse(), (wrapped, ignored) -> {
            var parsed = JsonBodyCompatibilityFilter.parsedBody(
                (jakarta.servlet.http.HttpServletRequest) wrapped);
            assertThat(parsed.path("value").asInt()).isEqualTo(42);
            assertThat(wrapped.getInputStream().readAllBytes())
                .isEqualTo("{\"value\":42}".getBytes(StandardCharsets.UTF_8));
        });

        MockHttpServletRequest arrayRequest = jsonRequest("[1,2]");
        filter.doFilter(arrayRequest, new MockHttpServletResponse(), (wrapped, ignored) ->
            assertThat(JsonBodyCompatibilityFilter.parsedBody(
                (jakarta.servlet.http.HttpServletRequest) wrapped)).hasSize(2));
    }

    @Test
    void rejectsJsonPrimitivesAsMalformedAndUnsupportedCharsetsAsGenericErrors() throws Exception {
        MockHttpServletResponse primitiveResponse = new MockHttpServletResponse();
        filter.doFilter(jsonRequest("true"), primitiveResponse, (request, response) -> { });
        assertThat(primitiveResponse.getStatus()).isEqualTo(400);
        assertThat(primitiveResponse.getContentAsString()).isEqualTo("{\"error\":\"JSON inválido.\"}");

        MockHttpServletRequest charsetRequest = jsonRequest("{}");
        charsetRequest.setContentType("application/json; charset=iso-8859-1");
        MockHttpServletResponse charsetResponse = new MockHttpServletResponse();
        filter.doFilter(charsetRequest, charsetResponse, (request, response) -> { });
        assertThat(charsetResponse.getStatus()).isEqualTo(500);
        assertThat(charsetResponse.getContentAsString())
            .isEqualTo("{\"error\":\"Erro interno no servidor.\"}");
    }

    private static MockHttpServletRequest jsonRequest(String body) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setContentType("application/json; charset=utf-8");
        request.setContent(body.getBytes(StandardCharsets.UTF_8));
        return request;
    }
}

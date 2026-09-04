package br.com.rodogarcia.site.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import br.com.rodogarcia.site.backend.dto.response.PostalCodeLookupResponse;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.integration.ProviderAccessException;
import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;
import br.com.rodogarcia.site.backend.integration.viacep.ViaCepClient;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class PostalCodeServiceTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Test
    void normalizesThePostalCodeAndExposesOnlyCityAndState() {
        AtomicReference<String> requestedPostalCode = new AtomicReference<>();
        ViaCepClient client = postalCode -> {
            requestedPostalCode.set(postalCode);
            return json(200, """
                {
                  "cep": "06090-000",
                  "logradouro": "Avenida não exposta",
                  "localidade": "\u00a0Osasco\ufeff",
                  "uf": "\u3000sp\u2028"
                }
                """);
        };
        PostalCodeService service = new PostalCodeService(client, jsonMapper);

        PostalCodeLookupResponse result = service.lookup("06090-000");

        assertThat(requestedPostalCode).hasValue("06090000");
        assertThat(result).isEqualTo(new PostalCodeLookupResponse("06090000", "Osasco", "SP"));
    }

    @Test
    void rejectsInvalidPostalCodeBeforeCallingTheProvider() {
        PostalCodeService service = new PostalCodeService(
            ignored -> {
                throw new AssertionError("O provedor não deveria ser consultado.");
            },
            jsonMapper
        );

        assertApiError(service, "123", 422, "Informe um CEP válido.");
    }

    @Test
    void mapsTransportAndHttpFailuresToServiceUnavailable() {
        PostalCodeService transportFailure = new PostalCodeService(
            ignored -> {
                throw new ProviderAccessException(new IllegalStateException("indisponível"));
            },
            jsonMapper
        );
        PostalCodeService httpFailure = new PostalCodeService(
            ignored -> json(500, "{}"),
            jsonMapper
        );

        assertApiError(
            transportFailure,
            "06090000",
            503,
            "Não foi possível consultar o CEP agora."
        );
        assertApiError(
            httpFailure,
            "06090000",
            503,
            "Não foi possível consultar o CEP agora."
        );
    }

    @Test
    void treatsProviderErrorInvalidJsonAndIncompleteAddressAsNotFound() {
        PostalCodeService providerError = new PostalCodeService(
            ignored -> json(200, "{\"erro\":false}"),
            jsonMapper
        );
        PostalCodeService invalidJson = new PostalCodeService(
            ignored -> json(200, "não é JSON"),
            jsonMapper
        );
        PostalCodeService trailingDocument = new PostalCodeService(
            ignored -> json(200, "{\"localidade\":\"Osasco\",\"uf\":\"SP\"} {}"),
            jsonMapper
        );
        PostalCodeService incomplete = new PostalCodeService(
            ignored -> json(200, "{\"localidade\":\"Osasco\",\"uf\":\"S\"}"),
            jsonMapper
        );

        assertApiError(providerError, "06090000", 404, "CEP não encontrado.");
        assertApiError(invalidJson, "06090000", 404, "CEP não encontrado.");
        assertApiError(trailingDocument, "06090000", 404, "CEP não encontrado.");
        assertApiError(incomplete, "06090000", 404, "CEP não encontrado.");
    }

    @Test
    void acceptsExactlyOneUtf8BomFromTheProvider() {
        PostalCodeService service = new PostalCodeService(
            ignored -> json(200, "\uFEFF{\"localidade\":\"Osasco\",\"uf\":\"SP\"}"),
            jsonMapper
        );

        assertThat(service.lookup("06090000"))
            .isEqualTo(new PostalCodeLookupResponse("06090000", "Osasco", "SP"));
    }

    private static ProviderHttpResponse json(int status, String body) {
        return new ProviderHttpResponse(status, body.getBytes(StandardCharsets.UTF_8));
    }

    private static void assertApiError(
        PostalCodeService service,
        String value,
        int status,
        String message
    ) {
        assertThatThrownBy(() -> service.lookup(value))
            .isInstanceOfSatisfying(ApiException.class, error -> {
                assertThat(error.status()).isEqualTo(status);
                assertThat(error).hasMessage(message);
            });
    }
}

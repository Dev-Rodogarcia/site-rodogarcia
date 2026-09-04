package br.com.rodogarcia.site.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import br.com.rodogarcia.site.backend.dto.response.CompanyAddressResponse;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.integration.ProviderAccessException;
import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;
import br.com.rodogarcia.site.backend.integration.brasilapi.BrasilApiClient;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class CompanyLookupServiceTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Test
    void exposesOnlyTheNormalizedAddressReturnedByBrasilApi() {
        AtomicReference<String> requestedCnpj = new AtomicReference<>();
        BrasilApiClient client = cnpj -> {
            requestedCnpj.set(cnpj);
            return json(200, """
                {
                  "cep": "06090-000",
                  "logradouro": "Avenida dos Autonomistas",
                  "numero": "1234",
                  "complemento": "Galpão 2",
                  "bairro": "Vila Yara",
                  "municipio": "Osasco",
                  "uf": "sp",
                  "razao_social": "Dado não exposto"
                }
                """);
        };
        CompanyLookupService service = new CompanyLookupService(client, jsonMapper);

        CompanyAddressResponse result = service.lookup("60.960.473/0002-43");

        assertThat(requestedCnpj).hasValue("60960473000243");
        assertThat(result).isEqualTo(new CompanyAddressResponse(
            "60960473000243",
            "06090000",
            "Avenida dos Autonomistas",
            "1234",
            "Galpão 2",
            "Vila Yara",
            "Osasco",
            "SP"
        ));
    }

    @Test
    void preservesNodeFieldLimitsAndStringOnlyContract() {
        CompanyLookupService service = new CompanyLookupService(
            ignored -> json(200, """
                {
                  "cep": "12.345-678-999",
                  "logradouro": 123,
                  "numero": null,
                  "complemento": true,
                  "bairro": [],
                  "municipio": " Cidade ",
                  "uf": "spx"
                }
                """),
            jsonMapper
        );

        CompanyAddressResponse result = service.lookup("60960473000243");

        assertThat(result.postalCode()).isEqualTo("12345678");
        assertThat(result.street()).isEmpty();
        assertThat(result.number()).isEmpty();
        assertThat(result.complement()).isEmpty();
        assertThat(result.neighborhood()).isEmpty();
        assertThat(result.city()).isEqualTo("Cidade");
        assertThat(result.stateCode()).isEqualTo("SP");
    }

    @Test
    void mapsEveryProviderFailureToTheNodeStatusAndMessage() {
        CompanyLookupService notFound = new CompanyLookupService(
            ignored -> json(404, "{}"),
            jsonMapper
        );
        CompanyLookupService httpFailure = new CompanyLookupService(
            ignored -> json(429, "{}"),
            jsonMapper
        );
        CompanyLookupService transportFailure = new CompanyLookupService(
            ignored -> {
                throw new ProviderAccessException(new IllegalStateException("indisponível"));
            },
            jsonMapper
        );
        CompanyLookupService invalidJson = new CompanyLookupService(
            ignored -> json(200, "não é JSON"),
            jsonMapper
        );
        CompanyLookupService trailingDocument = new CompanyLookupService(
            ignored -> json(200, "{\"municipio\":\"Osasco\",\"uf\":\"SP\"} {}"),
            jsonMapper
        );

        assertApiError(notFound, "60960473000243", 404, "CNPJ não encontrado.");
        assertApiError(
            httpFailure,
            "60960473000243",
            503,
            "Não foi possível confirmar o endereço pelo CNPJ agora."
        );
        assertApiError(
            transportFailure,
            "60960473000243",
            503,
            "Não foi possível confirmar o endereço pelo CNPJ agora."
        );
        assertApiError(
            invalidJson,
            "60960473000243",
            503,
            "Não foi possível confirmar o endereço pelo CNPJ agora."
        );
        assertApiError(
            trailingDocument,
            "60960473000243",
            503,
            "Não foi possível confirmar o endereço pelo CNPJ agora."
        );
    }

    @Test
    void rejectsInvalidCnpjAndIncompleteAddressWithDistinctMessages() {
        CompanyLookupService service = new CompanyLookupService(
            ignored -> json(200, "{\"municipio\":\"\",\"uf\":\"SP\"}"),
            jsonMapper
        );

        assertApiError(service, "123", 422, "Informe um CNPJ válido.");
        assertApiError(
            service,
            "60960473000243",
            404,
            "O CNPJ não possui endereço suficiente para confirmação."
        );
    }

    @Test
    void acceptsExactlyOneUtf8BomFromTheProvider() {
        CompanyLookupService service = new CompanyLookupService(
            ignored -> json(
                200,
                "\uFEFF{\"municipio\":\"Osasco\",\"uf\":\"SP\",\"cep\":\"06090000\"}"
            ),
            jsonMapper
        );

        assertThat(service.lookup("60960473000243").city()).isEqualTo("Osasco");
    }

    private static ProviderHttpResponse json(int status, String body) {
        return new ProviderHttpResponse(status, body.getBytes(StandardCharsets.UTF_8));
    }

    private static void assertApiError(
        CompanyLookupService service,
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

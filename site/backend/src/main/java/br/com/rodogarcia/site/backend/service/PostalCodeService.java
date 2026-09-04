package br.com.rodogarcia.site.backend.service;

import java.util.Locale;

import br.com.rodogarcia.site.backend.dto.response.PostalCodeLookupResponse;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.integration.ProviderAccessException;
import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;
import br.com.rodogarcia.site.backend.integration.viacep.ViaCepClient;
import br.com.rodogarcia.site.backend.validation.StrictJson;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class PostalCodeService {

    private static final String UNAVAILABLE_MESSAGE = "Não foi possível consultar o CEP agora.";

    private final ViaCepClient client;
    private final JsonMapper jsonMapper;

    public PostalCodeService(ViaCepClient client, JsonMapper jsonMapper) {
        this.client = client;
        this.jsonMapper = jsonMapper;
    }

    public PostalCodeLookupResponse lookup(String value) {
        String postalCode = normalizePostalCode(value);
        ProviderHttpResponse response;
        try {
            response = client.lookup(postalCode);
        } catch (ProviderAccessException error) {
            throw new ApiException(503, UNAVAILABLE_MESSAGE);
        }

        if (response.status() < 200 || response.status() >= 300) {
            throw new ApiException(503, UNAVAILABLE_MESSAGE);
        }

        JsonNode data = parseJson(response.body());
        if (data == null || data.has("erro")) {
            throw new ApiException(404, "CEP não encontrado.");
        }
        String city = NodeStringCompatibility.trim(text(data.get("localidade")));
        String stateCode = NodeStringCompatibility.trim(text(data.get("uf")))
            .toUpperCase(Locale.ROOT);
        if (city.isEmpty() || !stateCode.matches("^[A-Z]{2}$")) {
            throw new ApiException(404, "CEP não encontrado.");
        }
        return new PostalCodeLookupResponse(postalCode, city, stateCode);
    }

    private JsonNode parseJson(byte[] body) {
        try {
            return StrictJson.readTree(jsonMapper, body);
        } catch (JacksonException error) {
            return null;
        }
    }

    private static String normalizePostalCode(String value) {
        String postalCode = (value == null ? "" : value).replaceAll("\\D", "");
        if (!postalCode.matches("^\\d{8}$")) {
            throw new ApiException(422, "Informe um CEP válido.");
        }
        return postalCode;
    }

    private static String text(JsonNode value) {
        return value != null && value.isString() ? value.stringValue() : "";
    }
}

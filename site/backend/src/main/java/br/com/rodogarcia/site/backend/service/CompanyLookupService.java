package br.com.rodogarcia.site.backend.service;

import java.util.Locale;

import br.com.rodogarcia.site.backend.dto.response.CompanyAddressResponse;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.integration.ProviderAccessException;
import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;
import br.com.rodogarcia.site.backend.integration.brasilapi.BrasilApiClient;
import br.com.rodogarcia.site.backend.validation.StrictJson;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class CompanyLookupService {

    private static final String UNAVAILABLE_MESSAGE =
        "Não foi possível confirmar o endereço pelo CNPJ agora.";

    private final BrasilApiClient client;
    private final JsonMapper jsonMapper;

    public CompanyLookupService(BrasilApiClient client, JsonMapper jsonMapper) {
        this.client = client;
        this.jsonMapper = jsonMapper;
    }

    public CompanyAddressResponse lookup(String value) {
        String cnpj = normalizeCnpj(value);
        ProviderHttpResponse response;
        try {
            response = client.lookupCompany(cnpj);
        } catch (ProviderAccessException error) {
            throw new ApiException(503, UNAVAILABLE_MESSAGE);
        }

        if (response.status() == 404) {
            throw new ApiException(404, "CNPJ não encontrado.");
        }
        if (response.status() < 200 || response.status() >= 300) {
            throw new ApiException(503, UNAVAILABLE_MESSAGE);
        }

        JsonNode company = parseJson(response.body());
        if (company == null || !company.isObject()) {
            throw new ApiException(503, UNAVAILABLE_MESSAGE);
        }

        String stateCode = text(company.get("uf"), 2).toUpperCase(Locale.ROOT);
        String city = text(company.get("municipio"), 100);
        if (city.isEmpty() || !stateCode.matches("^[A-Z]{2}$")) {
            throw new ApiException(404, "O CNPJ não possui endereço suficiente para confirmação.");
        }

        return new CompanyAddressResponse(
            cnpj,
            digits(text(company.get("cep"), 12), 8),
            text(company.get("logradouro"), 160),
            text(company.get("numero"), 40),
            text(company.get("complemento"), 120),
            text(company.get("bairro"), 100),
            city,
            stateCode
        );
    }

    private JsonNode parseJson(byte[] body) {
        try {
            return StrictJson.readTree(jsonMapper, body);
        } catch (JacksonException error) {
            return null;
        }
    }

    private static String normalizeCnpj(String value) {
        String cnpj = (value == null ? "" : value).replaceAll("\\D", "");
        if (!cnpj.matches("^\\d{14}$")) {
            throw new ApiException(422, "Informe um CNPJ válido.");
        }
        return cnpj;
    }

    private static String text(JsonNode value, int maximumLength) {
        if (value == null || !value.isString()) {
            return "";
        }
        String normalized = NodeStringCompatibility.trim(value.stringValue());
        return normalized.length() <= maximumLength
            ? normalized
            : normalized.substring(0, maximumLength);
    }

    private static String digits(String value, int maximumLength) {
        String normalized = value.replaceAll("\\D", "");
        return normalized.length() <= maximumLength
            ? normalized
            : normalized.substring(0, maximumLength);
    }
}

package br.com.rodogarcia.site.backend.dto.response;

public record PostalCodeLookupResponse(
    String postalCode,
    String city,
    String stateCode
) {
}

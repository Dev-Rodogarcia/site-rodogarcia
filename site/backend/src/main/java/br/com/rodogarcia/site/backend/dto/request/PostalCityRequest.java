package br.com.rodogarcia.site.backend.dto.request;

public record PostalCityRequest(
    String name,
    String stateCode,
    String postalCode
) {
}

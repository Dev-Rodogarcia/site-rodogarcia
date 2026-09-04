package br.com.rodogarcia.site.backend.dto.request;

public record CityRequest(
    String name,
    String stateCode
) {
}

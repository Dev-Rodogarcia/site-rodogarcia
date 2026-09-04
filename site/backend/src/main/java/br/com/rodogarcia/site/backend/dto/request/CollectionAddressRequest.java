package br.com.rodogarcia.site.backend.dto.request;

public record CollectionAddressRequest(
    String postalCode,
    String street,
    String number,
    String complement,
    String neighborhood,
    String city,
    String stateCode
) {
}

package br.com.rodogarcia.site.backend.dto.response;

public record CompanyAddressResponse(
    String cnpj,
    String postalCode,
    String street,
    String number,
    String complement,
    String neighborhood,
    String city,
    String stateCode
) {
}

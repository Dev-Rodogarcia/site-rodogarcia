package br.com.rodogarcia.site.backend.dto.request;

public record CollectionRequest(
    String customerCnpj,
    String pickupLocationCnpj,
    String senderCnpj,
    String recipientCnpj,
    CityRequest origin,
    String serviceDate,
    String serviceStartHour,
    String serviceEndHour,
    CollectionAddressRequest deliveryAddress,
    String invoiceValidationToken,
    InvoiceReferenceRequest invoice,
    String referenceNumber,
    String comments
) {
}

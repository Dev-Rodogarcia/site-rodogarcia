package br.com.rodogarcia.site.backend.dto.request;

public record QuoteRequest(
    String customerCnpj,
    String senderCnpj,
    String recipientCnpj,
    PostalCityRequest origin,
    PostalCityRequest destination,
    double height,
    double width,
    double length,
    double realWeight,
    double cubicVolume,
    double invoiceValue,
    int invoiceVolumes,
    String requesterName,
    String requesterPhone,
    String requesterEmail,
    String productClassificationName,
    String comments
) {
}

package br.com.rodogarcia.site.backend.dto.request;

public record InvoiceLookupRequest(
    String invoiceKey,
    String invoiceNumber,
    String invoiceSeries,
    String senderCnpj,
    String recipientCnpj
) {
}

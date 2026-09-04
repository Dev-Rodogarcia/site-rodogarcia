package br.com.rodogarcia.site.backend.security;

public record InvoiceValidationFingerprintInput(
    String invoiceKey,
    String invoiceNumber,
    String invoiceSeries,
    String senderCnpj,
    String recipientCnpj
) {
}

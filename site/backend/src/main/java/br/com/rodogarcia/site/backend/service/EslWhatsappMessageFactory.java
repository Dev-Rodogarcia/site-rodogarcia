package br.com.rodogarcia.site.backend.service;

import java.util.ArrayList;
import java.util.List;

import br.com.rodogarcia.site.backend.dto.request.CollectionAddressRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionRequest;
import br.com.rodogarcia.site.backend.dto.request.InvoiceReferenceRequest;
import br.com.rodogarcia.site.backend.dto.request.QuoteRequest;
import br.com.rodogarcia.site.backend.utils.EcmaScriptNumberFormatter;
import org.springframework.stereotype.Component;

/** Centraliza os textos canônicos entregues ao fluxo público de WhatsApp. */
@Component
public class EslWhatsappMessageFactory {

    public String closedQuote(QuoteRequest input) {
        List<String> lines = new ArrayList<>();
        lines.add("Solicitação de cotação de carga fechada pelo site Rodogarcia");
        lines.add("Cliente/pagador: " + input.customerCnpj());
        lines.add("Tabela de preço: PADRÃO");
        lines.add(
            "Origem: " + input.origin().name() + "/" + input.origin().stateCode()
                + " — CEP " + input.origin().postalCode()
        );
        lines.add(
            "Destino: " + input.destination().name() + "/" + input.destination().stateCode()
                + " — CEP " + input.destination().postalCode()
        );
        if (!input.recipientCnpj().isEmpty()) {
            lines.add("Destinatário: " + input.recipientCnpj());
        }
        lines.add("Peso: " + EcmaScriptNumberFormatter.format(input.realWeight()) + " kg");
        lines.add("Volume: " + EcmaScriptNumberFormatter.format(input.cubicVolume()) + " m³");
        lines.add("Valor NF: R$ " + EcmaScriptNumberFormatter.format(input.invoiceValue()));
        lines.add("Volumes: " + input.invoiceVolumes());
        lines.add(
            "Solicitante: " + input.requesterName() + " — " + input.requesterPhone()
        );
        lines.add("E-mail: " + input.requesterEmail());
        return String.join("\n", lines);
    }

    public String collectionFallback(CollectionRequest input) {
        List<String> lines = new ArrayList<>();
        lines.add("Solicitação de coleta pelo site Rodogarcia");
        lines.add("Cliente: " + input.customerCnpj());
        lines.add("Local de coleta: " + input.pickupLocationCnpj());
        lines.add("Data: " + input.serviceDate());
        lines.add(
            "Horário: " + input.serviceStartHour() + " até " + input.serviceEndHour()
        );
        String address = formatCollectionAddress(input.deliveryAddress());
        if (!address.isEmpty()) {
            lines.add("Endereço de entrega: " + address);
        }
        if (hasInvoiceReference(input.invoice())) {
            lines.add(
                "NF: "
                    + (!input.invoice().invoiceKey().isEmpty()
                        ? input.invoice().invoiceKey()
                        : input.invoice().invoiceNumber())
            );
        }
        return String.join("\n", lines);
    }

    public String collectionComments(CollectionRequest input) {
        String address = formatCollectionAddress(input.deliveryAddress());
        String comments = joinNonEmpty(
            "\n",
            input.comments(),
            address.isEmpty() ? "" : "Endereço de entrega informado: " + address
        );
        return comments.substring(0, Math.min(700, comments.length()));
    }

    private static String formatCollectionAddress(CollectionAddressRequest address) {
        String streetLine = joinNonEmpty(", ", address.street(), address.number());
        String cityLine = joinNonEmpty(
            " — ",
            address.neighborhood(),
            address.city(),
            address.stateCode()
        );
        return joinNonEmpty(
            " | ",
            streetLine,
            address.complement(),
            cityLine,
            address.postalCode().isEmpty() ? "" : "CEP " + address.postalCode()
        );
    }

    private static boolean hasInvoiceReference(InvoiceReferenceRequest input) {
        return !input.invoiceKey().isEmpty() || !input.invoiceNumber().isEmpty();
    }

    private static String joinNonEmpty(String delimiter, String... values) {
        List<String> present = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isEmpty()) {
                present.add(value);
            }
        }
        return String.join(delimiter, present);
    }

}

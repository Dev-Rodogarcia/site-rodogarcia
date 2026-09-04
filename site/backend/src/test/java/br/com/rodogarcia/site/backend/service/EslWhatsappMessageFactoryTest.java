package br.com.rodogarcia.site.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.rodogarcia.site.backend.dto.request.CityRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionAddressRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionRequest;
import br.com.rodogarcia.site.backend.dto.request.InvoiceReferenceRequest;
import br.com.rodogarcia.site.backend.dto.request.PostalCityRequest;
import br.com.rodogarcia.site.backend.dto.request.QuoteRequest;
import org.junit.jupiter.api.Test;

class EslWhatsappMessageFactoryTest {

    private final EslWhatsappMessageFactory factory = new EslWhatsappMessageFactory();

    @Test
    void formatsSmallAndLargeNumbersExactlyLikeJavascriptInterpolation() {
        QuoteRequest input = new QuoteRequest(
            "01351335000117",
            "",
            "",
            new PostalCityRequest("Osasco", "SP", "06268000"),
            new PostalCityRequest("Agudos", "SP", "17123210"),
            1D,
            1D,
            1D,
            1e-7,
            1e-6,
            100_000_000D,
            1,
            "Caio Garcia",
            "14991943869",
            "caio@example.com",
            "",
            ""
        );

        assertThat(factory.closedQuote(input))
            .contains("Peso: 1e-7 kg")
            .contains("Volume: 0.000001 m³")
            .contains("Valor NF: R$ 100000000");
    }

    @Test
    void reusesTheCanonicalAddressInCollectionCommentsAndWhatsappFallback() {
        CollectionRequest input = new CollectionRequest(
            "01351335000117",
            "60960473000162",
            "",
            "",
            new CityRequest("Osasco", "SP"),
            "2026-07-24",
            "08:00",
            "12:00",
            new CollectionAddressRequest(
                "06090000",
                "Avenida dos Autonomistas",
                "1234",
                "Galpão 2",
                "Vila Yara",
                "Osasco",
                "SP"
            ),
            "",
            new InvoiceReferenceRequest("", "456", "", "", ""),
            "",
            "Observação"
        );

        String canonicalAddress = "Avenida dos Autonomistas, 1234 | Galpão 2 | "
            + "Vila Yara — Osasco — SP | CEP 06090000";
        assertThat(factory.collectionComments(input))
            .isEqualTo("Observação\nEndereço de entrega informado: " + canonicalAddress);
        assertThat(factory.collectionFallback(input))
            .contains("Endereço de entrega: " + canonicalAddress)
            .contains("NF: 456")
            .doesNotContain("60960473000243");
    }
}

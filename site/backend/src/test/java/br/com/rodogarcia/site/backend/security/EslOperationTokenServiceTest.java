package br.com.rodogarcia.site.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HexFormat;

import org.junit.jupiter.api.Test;

import br.com.rodogarcia.site.backend.exception.ApiException;

class EslOperationTokenServiceTest {

    private static final long BASE_TIME_MILLIS = 1_735_689_600_000L;
    private static final String OPERATION_SECRET = "0123456789abcdef0123456789abcdef";
    private static final String INVOICE_FINGERPRINT =
        "b149d462242899ab4493856633357a4c09efbf7fb8129740d5b4f77bad161032";
    private static final String NODE_COLLECTION_TOKEN =
        "v1.AAECAwQFBgcICQoL."
            + "OswtJM5Wzps40yRRw7ybZl0mljbGSMvF_FeG13ryPWvfi4lcNvFETsiwXy7BCL5bYdE_"
            + "XuPQnofrKzABQAupH3ZzLeiQgPK_tgBQens_PFXqxdhcD8_sz8ekmgUKS-xGUaP9HaEvI3K"
            + "lUBiAXVCjHl2VJtxFEW5sB7ShaJlB1vV2WpZnoPmZNhMdnUxdEDVY500AeeiviAqvlv_R3g"
            + "38YMVeheCTocPwg5Ljiwa6TR0Ndc_scGd0TsdTCxa_V4KR";
    private static final String NODE_INVOICE_TOKEN =
        "v1.DA0ODxAREhMUFRYX."
            + "60ACt4SUFZXwj7WxlYMJwljIZjSct6ce76JLy_97HlBrR5Z_FhkatbxjMLij3ac6uK9hU4"
            + "AygePHIJcgzxTpHmUSDxysdAkaTJvHBRgQlHTnYXGFqCzWq3-rrFRcUiWzxPu1Aq2G4pxB8"
            + "MWvlBfx5EB19Zk4FmV333hWecpUXlwNe9hJPaWo-Ri48FacryrdqDPgh2k9fGzYho6Y3Uw"
            + "y0VMOiZCdfivD17LtmW_q-4whE0gI_vfTxQ";

    @Test
    void reproducesNodeInvoiceFingerprint() {
        EslOperationTokenService service = serviceAt(BASE_TIME_MILLIS, "000102030405060708090a0b");

        String fingerprint = service.invoiceValidationFingerprint(
            new InvoiceValidationFingerprintInput(
                "35260112345678000190550010000012341000012345",
                "1234",
                "1",
                "12345678000190",
                "98765432000199"
            )
        );

        assertThat(fingerprint).isEqualTo(INVOICE_FINGERPRINT);
    }

    @Test
    void reproducesNodeFingerprintEscapeCasingForLoneSurrogates() {
        EslOperationTokenService service = serviceAt(BASE_TIME_MILLIS, "000102030405060708090a0b");

        String fingerprint = service.invoiceValidationFingerprint(
            new InvoiceValidationFingerprintInput("", "\ud800", "", "", "")
        );

        assertThat(fingerprint)
            .isEqualTo("57cdc0c0343060d5f3ac42bb335d1beee5e11b73a7a32b3cbcc68116ecdffd49");
    }

    @Test
    void emitsTheExactNodeCollectionVectorAndReadsIt() {
        EslOperationTokenService service = serviceAt(BASE_TIME_MILLIS, "000102030405060708090a0b");

        String token = service.createCollectionMaintenanceToken("1234567890");

        assertThat(token).isEqualTo(NODE_COLLECTION_TOKEN);
        service.requireCollectionMaintenanceToken(NODE_COLLECTION_TOKEN, "1234567890");
    }

    @Test
    void emitsTheExactNodeInvoiceVectorAndReadsIt() {
        EslOperationTokenService service = serviceAt(BASE_TIME_MILLIS, "0c0d0e0f1011121314151617");

        String token = service.createInvoiceValidationToken("998877", INVOICE_FINGERPRINT);

        assertThat(token).isEqualTo(NODE_INVOICE_TOKEN);
        assertThat(service.requireInvoiceValidationToken(NODE_INVOICE_TOKEN, INVOICE_FINGERPRINT))
            .isEqualTo("998877");
    }

    @Test
    void rejectsTokenAtTheExactExpirationBoundary() {
        EslOperationTokenService issuer = serviceAt(BASE_TIME_MILLIS, "0c0d0e0f1011121314151617");
        String token = issuer.createInvoiceValidationToken("998877", INVOICE_FINGERPRINT);
        EslOperationTokenService verifier = serviceAt(
            BASE_TIME_MILLIS + EslOperationTokenService.INVOICE_VALIDATION_TTL_MILLIS,
            "000102030405060708090a0b"
        );

        assertInvalidToken(() -> verifier.requireInvoiceValidationToken(token, INVOICE_FINGERPRINT));
    }

    @Test
    void bindsCollectionCapabilityToItsRemoteIdentifier() {
        EslOperationTokenService service = serviceAt(BASE_TIME_MILLIS, "000102030405060708090a0b");

        assertInvalidToken(
            () -> service.requireCollectionMaintenanceToken(NODE_COLLECTION_TOKEN, "1234567891")
        );
        assertInvalidToken(() -> service.requireCollectionMaintenanceToken(null, "1234567890"));
    }

    @Test
    void bindsInvoiceCapabilityToItsFingerprintAndScope() {
        EslOperationTokenService service = serviceAt(BASE_TIME_MILLIS, "0c0d0e0f1011121314151617");

        assertInvalidToken(
            () -> service.requireInvoiceValidationToken(
                NODE_INVOICE_TOKEN,
                "a".repeat(64)
            )
        );
        assertInvalidToken(
            () -> service.requireInvoiceValidationToken(NODE_COLLECTION_TOKEN, INVOICE_FINGERPRINT)
        );
    }

    @Test
    void rejectsTamperedWrongSecretMalformedAndOversizedTokens() {
        EslOperationTokenService service = serviceAt(BASE_TIME_MILLIS, "000102030405060708090a0b");
        EslOperationTokenService wrongSecret = new EslOperationTokenService(
            "abcdef0123456789abcdef0123456789",
            fixedClock(BASE_TIME_MILLIS),
            () -> initializationVector("000102030405060708090a0b")
        );
        String tampered = NODE_COLLECTION_TOKEN.substring(0, NODE_COLLECTION_TOKEN.length() - 1)
            + (NODE_COLLECTION_TOKEN.endsWith("A") ? "B" : "A");

        assertInvalidToken(
            () -> service.requireCollectionMaintenanceToken(tampered, "1234567890")
        );
        assertInvalidToken(
            () -> wrongSecret.requireCollectionMaintenanceToken(NODE_COLLECTION_TOKEN, "1234567890")
        );
        assertInvalidToken(
            () -> service.requireCollectionMaintenanceToken("v1.invalid.invalid", "1234567890")
        );
        assertInvalidToken(
            () -> service.requireCollectionMaintenanceToken("x".repeat(2_049), "1234567890")
        );
    }

    private static EslOperationTokenService serviceAt(long millis, String initializationVectorHex) {
        return new EslOperationTokenService(
            OPERATION_SECRET,
            fixedClock(millis),
            () -> initializationVector(initializationVectorHex)
        );
    }

    private static Clock fixedClock(long millis) {
        return Clock.fixed(Instant.ofEpochMilli(millis), ZoneOffset.UTC);
    }

    private static byte[] initializationVector(String hexadecimal) {
        return HexFormat.of().parseHex(hexadecimal);
    }

    private static void assertInvalidToken(Runnable operation) {
        assertThatThrownBy(operation::run)
            .isInstanceOf(ApiException.class)
            .satisfies(error -> {
                ApiException apiError = (ApiException) error;
                assertThat(apiError.status()).isEqualTo(403);
                assertThat(apiError.getMessage())
                    .isEqualTo("A autorização desta operação é inválida ou expirou.");
            });
    }
}

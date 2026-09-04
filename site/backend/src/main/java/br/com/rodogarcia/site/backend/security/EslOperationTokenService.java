package br.com.rodogarcia.site.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Base64;
import java.util.HexFormat;
import java.util.function.Supplier;
import java.util.regex.Pattern;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.utils.NodeCompatibleJsonBytes;
import br.com.rodogarcia.site.backend.utils.NodeUtf8;
import br.com.rodogarcia.site.backend.validation.StrictJson;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@Service
public final class EslOperationTokenService {

    static final long COLLECTION_MAINTENANCE_TTL_MILLIS = 30L * 24 * 60 * 60 * 1_000;
    static final long INVOICE_VALIDATION_TTL_MILLIS = 15L * 60 * 1_000;

    private static final String TOKEN_VERSION = "v1";
    private static final String COLLECTION_MAINTENANCE_SCOPE = "collection-maintenance";
    private static final String INVOICE_VALIDATION_SCOPE = "invoice-validation";
    private static final String INVALID_TOKEN_MESSAGE =
        "A autorização desta operação é inválida ou expirou.";
    private static final int INITIALIZATION_VECTOR_BYTES = 12;
    private static final int AUTHENTICATION_TAG_BYTES = 16;
    private static final int AUTHENTICATION_TAG_BITS = AUTHENTICATION_TAG_BYTES * Byte.SIZE;
    private static final int MAX_TOKEN_CHARACTERS = 2_048;
    private static final int MAX_ENCRYPTED_BYTES = 2_000;
    private static final double MAX_SAFE_INTEGER = 9_007_199_254_740_991D;
    private static final Pattern SUBJECT_PATTERN = Pattern.compile("[0-9]{1,40}");
    private static final Pattern FINGERPRINT_PATTERN = Pattern.compile("[a-f0-9]{64}");
    private static final Base64.Encoder BASE64_URL_ENCODER =
        Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();
    private static final HexFormat HEX_FORMAT = HexFormat.of();
    private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();

    private final byte[] encryptionKey;
    private final Clock clock;
    private final Supplier<byte[]> initializationVectorSource;

    @Autowired
    public EslOperationTokenService(ApplicationProperties properties, Clock clock) {
        this(properties.eslOperationSecret(), clock, secureInitializationVectorSource());
    }

    EslOperationTokenService(
        String operationSecret,
        Clock clock,
        Supplier<byte[]> initializationVectorSource
    ) {
        this.encryptionKey = sha256(operationSecret);
        this.clock = clock;
        this.initializationVectorSource = initializationVectorSource;
    }

    public String invoiceValidationFingerprint(InvoiceValidationFingerprintInput input) {
        ArrayNode values = JSON_MAPPER.createArrayNode();
        values.add(input.invoiceKey());
        values.add(input.invoiceNumber());
        values.add(input.invoiceSeries());
        values.add(input.senderCnpj());
        values.add(input.recipientCnpj());
        try {
            return sha256Hex(NodeCompatibleJsonBytes.normalize(JSON_MAPPER.writeValueAsBytes(values)));
        } catch (JacksonException error) {
            throw new IllegalStateException("Não foi possível serializar o fingerprint ESL.", error);
        }
    }

    public String createCollectionMaintenanceToken(String collectionId) {
        return createToken(
            COLLECTION_MAINTENANCE_SCOPE,
            collectionId,
            sha256Hex(collectionId.getBytes(StandardCharsets.UTF_8)),
            COLLECTION_MAINTENANCE_TTL_MILLIS
        );
    }

    public void requireCollectionMaintenanceToken(String token, String collectionId) {
        if (token == null || token.isEmpty()) {
            throw tokenError();
        }
        TokenPayload payload = readToken(token, COLLECTION_MAINTENANCE_SCOPE);
        String expectedFingerprint = sha256Hex(collectionId.getBytes(StandardCharsets.UTF_8));
        if (!payload.subject().equals(collectionId)
            || !payload.fingerprint().equals(expectedFingerprint)) {
            throw tokenError();
        }
    }

    public String createInvoiceValidationToken(String invoiceId, String fingerprint) {
        return createToken(
            INVOICE_VALIDATION_SCOPE,
            invoiceId,
            fingerprint,
            INVOICE_VALIDATION_TTL_MILLIS
        );
    }

    public String requireInvoiceValidationToken(String token, String fingerprint) {
        TokenPayload payload = readToken(token, INVOICE_VALIDATION_SCOPE);
        if (!payload.fingerprint().equals(fingerprint)) {
            throw tokenError();
        }
        return payload.subject();
    }

    private String createToken(String scope, String subject, String fingerprint, long ttlMillis) {
        ObjectNode payload = JSON_MAPPER.createObjectNode();
        payload.put("version", 1);
        payload.put("scope", scope);
        payload.put("subject", subject);
        payload.put("fingerprint", fingerprint);
        payload.put("expiresAt", clock.millis() + ttlMillis);

        byte[] initializationVector = initializationVectorSource.get();
        if (initializationVector == null
            || initializationVector.length != INITIALIZATION_VECTOR_BYTES) {
            throw new IllegalStateException("O gerador de IV ESL devolveu um valor inválido.");
        }

        try {
            Cipher cipher = cipher(Cipher.ENCRYPT_MODE, initializationVector);
            byte[] encrypted = cipher.doFinal(JSON_MAPPER.writeValueAsBytes(payload));
            return TOKEN_VERSION
                + "."
                + BASE64_URL_ENCODER.encodeToString(initializationVector)
                + "."
                + BASE64_URL_ENCODER.encodeToString(encrypted);
        } catch (GeneralSecurityException | JacksonException error) {
            throw new IllegalStateException("Não foi possível emitir a capability ESL.", error);
        }
    }

    private TokenPayload readToken(String token, String expectedScope) {
        if (token == null || token.length() > MAX_TOKEN_CHARACTERS) {
            throw tokenError();
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3
            || !TOKEN_VERSION.equals(parts[0])
            || parts[1].isEmpty()
            || parts[2].isEmpty()) {
            throw tokenError();
        }

        byte[] initializationVector = decode(parts[1]);
        byte[] encrypted = decode(parts[2]);
        if (initializationVector.length != INITIALIZATION_VECTOR_BYTES
            || encrypted.length <= AUTHENTICATION_TAG_BYTES
            || encrypted.length > MAX_ENCRYPTED_BYTES) {
            throw tokenError();
        }

        try {
            Cipher decipher = cipher(Cipher.DECRYPT_MODE, initializationVector);
            JsonNode parsed = StrictJson.readTree(
                JSON_MAPPER,
                NodeUtf8.decode(decipher.doFinal(encrypted))
            );
            TokenPayload payload = parsePayload(parsed);
            if (payload == null
                || !payload.scope().equals(expectedScope)
                || payload.expiresAt() <= clock.millis()) {
                throw tokenError();
            }
            return payload;
        } catch (ApiException error) {
            throw error;
        } catch (GeneralSecurityException | RuntimeException error) {
            throw tokenError();
        }
    }

    private Cipher cipher(int mode, byte[] initializationVector) throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(
            mode,
            new SecretKeySpec(encryptionKey, "AES"),
            new GCMParameterSpec(AUTHENTICATION_TAG_BITS, initializationVector)
        );
        return cipher;
    }

    private static TokenPayload parsePayload(JsonNode value) {
        if (value == null || !value.isObject()) {
            return null;
        }
        JsonNode version = value.get("version");
        JsonNode scope = value.get("scope");
        JsonNode subject = value.get("subject");
        JsonNode fingerprint = value.get("fingerprint");
        JsonNode expiresAt = value.get("expiresAt");
        if (!isNumberEqualToOne(version)
            || scope == null
            || !scope.isString()
            || (!COLLECTION_MAINTENANCE_SCOPE.equals(scope.stringValue())
                && !INVOICE_VALIDATION_SCOPE.equals(scope.stringValue()))
            || subject == null
            || !subject.isString()
            || !SUBJECT_PATTERN.matcher(subject.stringValue()).matches()
            || fingerprint == null
            || !fingerprint.isString()
            || !FINGERPRINT_PATTERN.matcher(fingerprint.stringValue()).matches()
            || !isSafeInteger(expiresAt)) {
            return null;
        }
        return new TokenPayload(
            scope.stringValue(),
            subject.stringValue(),
            fingerprint.stringValue(),
            (long) expiresAt.doubleValue()
        );
    }

    private static boolean isNumberEqualToOne(JsonNode value) {
        return value != null && value.isNumber() && value.doubleValue() == 1D;
    }

    private static boolean isSafeInteger(JsonNode value) {
        if (value == null || !value.isNumber()) {
            return false;
        }
        double number = value.doubleValue();
        return Double.isFinite(number)
            && Math.rint(number) == number
            && Math.abs(number) <= MAX_SAFE_INTEGER;
    }

    private static byte[] decode(String value) {
        try {
            return BASE64_URL_DECODER.decode(value);
        } catch (IllegalArgumentException error) {
            throw tokenError();
        }
    }

    private static byte[] sha256(String value) {
        return sha256(value.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] sha256(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 não está disponível neste runtime.", error);
        }
    }

    private static String sha256Hex(byte[] value) {
        return HEX_FORMAT.formatHex(sha256(value));
    }

    private static Supplier<byte[]> secureInitializationVectorSource() {
        SecureRandom secureRandom = new SecureRandom();
        return () -> {
            byte[] initializationVector = new byte[INITIALIZATION_VECTOR_BYTES];
            secureRandom.nextBytes(initializationVector);
            return initializationVector;
        };
    }

    private static ApiException tokenError() {
        return new ApiException(403, INVALID_TOKEN_MESSAGE);
    }

    private record TokenPayload(
        String scope,
        String subject,
        String fingerprint,
        long expiresAt
    ) {
    }
}

package br.com.rodogarcia.site.backend.service;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import br.com.rodogarcia.site.backend.dto.request.CancellationReason;
import br.com.rodogarcia.site.backend.dto.request.CollectionCancellationRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionUpdateRequest;
import br.com.rodogarcia.site.backend.dto.request.InvoiceLookupRequest;
import br.com.rodogarcia.site.backend.dto.request.InvoiceReferenceRequest;
import br.com.rodogarcia.site.backend.dto.request.PostalCityRequest;
import br.com.rodogarcia.site.backend.dto.request.QuoteRequest;
import br.com.rodogarcia.site.backend.config.JavascriptNumber;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.integration.esl.EslGraphqlClient;
import br.com.rodogarcia.site.backend.integration.esl.EslGraphqlDocuments;
import br.com.rodogarcia.site.backend.integration.esl.EslGraphqlResponseException;
import br.com.rodogarcia.site.backend.security.EslOperationTokenService;
import br.com.rodogarcia.site.backend.security.InvoiceValidationFingerprintInput;
import br.com.rodogarcia.site.backend.utils.EcmaScriptNumberFormatter;
import br.com.rodogarcia.site.backend.utils.EcmaScriptJsonNumber;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/**
 * Reproduz as regras históricas de transporte ESL sem acoplar HTTP,
 * validação de entrada ou persistência ao cliente GraphQL.
 */
@Service
public class EslTransportService {

    static final double TAXED_WEIGHT_PER_CUBIC_METER = 300D;
    static final String STANDARD_PRICE_TABLE = "PADRÃO";
    static final String THREE_METERS_PRICE_TABLE = "PADRÃO - 3 METROS";
    static final double THREE_METERS_THRESHOLD = 3D;

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter LOCAL_DATE = DateTimeFormatter.ofPattern("uuuu-MM-dd");
    private static final DateTimeFormatter LOCAL_TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter NODE_INSTANT = new DateTimeFormatterBuilder()
        .appendInstant(3)
        .toFormatter();
    private static final Pattern DIGITS_ONLY = Pattern.compile("^[0-9]+$");
    private static final Pattern CUSTOMER_ERROR = Pattern.compile(
        "cliente|customer",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern REGISTRATION_ERROR = Pattern.compile(
        "n[aã]o|not|inv[aá]lid|cadastr|encontr|cadastro",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Map<CancellationReason, String> CANCELLATION_LABELS = Map.of(
        CancellationReason.CLIENTE_SOLICITOU, "Cliente solicitou o cancelamento",
        CancellationReason.DIVERGENCIA_DE_DADOS, "Divergência nos dados da coleta",
        CancellationReason.ENDERECO_INCORRETO, "Endereço de coleta incorreto",
        CancellationReason.MERCADORIA_INDISPONIVEL, "Mercadoria indisponível para coleta",
        CancellationReason.SOLICITACAO_DUPLICADA, "Solicitação de coleta duplicada",
        CancellationReason.OUTROS, "Outros"
    );

    private final EslGraphqlClient graphqlClient;
    private final EslOperationTokenService tokenService;
    private final EslDeliveryRegionService deliveryRegionService;
    private final EslWhatsappMessageFactory whatsappMessageFactory;
    private final Clock clock;

    public EslTransportService(
        EslGraphqlClient graphqlClient,
        EslOperationTokenService tokenService,
        EslDeliveryRegionService deliveryRegionService,
        EslWhatsappMessageFactory whatsappMessageFactory,
        Clock clock
    ) {
        this.graphqlClient = graphqlClient;
        this.tokenService = tokenService;
        this.deliveryRegionService = deliveryRegionService;
        this.whatsappMessageFactory = whatsappMessageFactory;
        this.clock = clock;
    }

    public Map<String, Object> createFractionalQuote(QuoteRequest input) {
        try {
            String corporationCnpj = deliveryRegionService.resolveCorporationCnpj(input.origin());
            double weightForEsl = quoteWeightForEsl(input);
            String priceTableForEsl = quotePriceTableForEsl(input);

            LinkedHashMap<String, Object> params = new LinkedHashMap<>();
            params.put("corporation", document(corporationCnpj));
            params.put("customer", document(input.customerCnpj()));
            params.put("requestedAt", currentInstant());
            params.put("requesterName", input.requesterName());
            params.put("requesterPhone", input.requesterPhone());
            params.put("requesterEmail", input.requesterEmail());
            params.put("referenceNumber", generatedReference());
            params.put("comments", joinNonEmpty(
                " ",
                "Cotação solicitada pelo site Rodogarcia.",
                "CEP de origem: " + input.origin().postalCode() + ".",
                "CEP de destino: " + input.destination().postalCode() + ".",
                input.comments()
            ));

            LinkedHashMap<String, Object> bid = new LinkedHashMap<>();
            bid.put("cubicVolume", jsonNumber(input.cubicVolume()));
            bid.put("modal", "rodo");
            bid.put("realWeight", jsonNumber(weightForEsl));
            bid.put("payer", document(input.customerCnpj()));
            putDocumentIfPresent(bid, "sender", input.senderCnpj());
            putDocumentIfPresent(bid, "recipient", input.recipientCnpj());
            bid.put("calculationType", "price_table");
            bid.put("customerPriceTable", singleEntry("name", priceTableForEsl));
            bid.put("originCity", city(input.origin()));
            bid.put("destinationCity", city(input.destination()));
            bid.put(
                "productClassification",
                singleEntry(
                    "name",
                    input.productClassificationName().isEmpty()
                        ? "Outros"
                        : input.productClassificationName()
                )
            );
            bid.put("invoicesValue", jsonNumber(input.invoiceValue()));
            bid.put("invoicesVolumes", input.invoiceVolumes());
            params.put("quoteStretchBidsAttributes", List.of(bid));

            JsonNode data = graphqlClient.execute(
                EslGraphqlDocuments.QUOTE_CREATE,
                singleEntry("params", params)
            );
            JsonNode resource = operationResult(data, "quoteCreate");

            List<Map<String, Object>> stretches = new ArrayList<>();
            JsonNode stretchValues = resource.get("quoteStretchBids");
            if (stretchValues != null && stretchValues.isArray()) {
                for (JsonNode stretch : stretchValues) {
                    if (stretch != null && stretch.isObject()) {
                        stretches.add(singleEntry("total", jsonNumber(asNumber(stretch.get("total")))));
                    }
                }
            }

            Object total = null;
            if (!stretches.isEmpty()) {
                double sum = 0D;
                for (Map<String, Object> stretch : stretches) {
                    sum += ((Number) stretch.get("total")).doubleValue();
                }
                total = jsonNumber(sum);
            }

            LinkedHashMap<String, Object> price = new LinkedHashMap<>();
            price.put("stretches", stretches);
            price.put("total", total);

            LinkedHashMap<String, Object> result = new LinkedHashMap<>();
            result.put("id", asText(resource.get("id"), 40));
            result.put("sequenceCode", asText(resource.get("sequenceCode"), 40));
            result.put("referenceNumber", asText(resource.get("referenceNumber"), 100));
            result.put("requestedAt", asText(resource.get("requestedAt"), 40));
            result.put("price", price);
            return result;
        } catch (RuntimeException error) {
            throw clientError(
                error,
                "Não foi possível calcular a cotação. Confira os dados e tente novamente."
            );
        }
    }

    public Map<String, Object> prepareClosedQuoteWhatsapp(QuoteRequest input) {
        deliveryRegionService.resolveCorporationCnpj(input.origin());
        return singleEntry("whatsappMessage", whatsappMessageFactory.closedQuote(input));
    }

    public Map<String, Object> validateCollectionInvoice(InvoiceLookupRequest input) {
        ValidatedInvoice invoice = resolveInvoice(input);
        String fingerprint = tokenService.invoiceValidationFingerprint(fingerprintInput(input));
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put("validated", true);
        result.put(
            "validationToken",
            tokenService.createInvoiceValidationToken(invoice.id(), fingerprint)
        );
        return result;
    }

    public Map<String, Object> createCollection(CollectionRequest input) {
        String corporationCnpj = deliveryRegionService.resolveCorporationCnpj(input.origin());
        ValidatedInvoice invoice = resolveCollectionInvoice(input);

        try {
            LinkedHashMap<String, Object> params = new LinkedHashMap<>();
            params.put("corporation", document(corporationCnpj));
            params.put("requestDate", currentSaoPauloDate());
            params.put("requestHour", currentSaoPauloTime());
            params.put("customer", document(input.customerCnpj()));
            params.put("referenceNumber", collectionReference(input.referenceNumber()));
            params.put("pickupLocation", document(input.pickupLocationCnpj()));
            params.put("serviceDate", input.serviceDate());
            params.put("serviceStartHour", input.serviceStartHour());
            params.put("serviceEndHour", input.serviceEndHour());
            String comments = whatsappMessageFactory.collectionComments(input);
            if (!comments.isEmpty()) {
                params.put("comments", comments);
            }

            LinkedHashMap<String, Object> item = new LinkedHashMap<>();
            item.put("modal", "rodo");
            item.put("payer", document(input.customerCnpj()));
            putDocumentIfPresent(item, "recipient", input.recipientCnpj());
            putDocumentIfPresent(item, "sender", input.senderCnpj());
            if (invoice != null) {
                item.put("invoicesValue", jsonNumber(invoice.value()));
                item.put("invoicesVolumes", jsonNumber(invoice.volume()));
                item.put("invoicesRealWeight", jsonNumber(invoice.weight()));
                item.put(
                    "pickItemInvoicesAttributes",
                    List.of(singleEntry("invoiceId", javascriptNumber(invoice.id())))
                );
            }
            params.put("pickItemsAttributes", List.of(item));

            JsonNode data = graphqlClient.execute(
                EslGraphqlDocuments.PICK_CREATE,
                singleEntry("params", params)
            );
            JsonNode resource = operationResult(data, "pickCreate");
            String collectionId = asText(resource.get("id"), 40);
            if (!DIGITS_ONLY.matcher(collectionId).matches()) {
                throw new ApiException(502, "O ESL não retornou o identificador da coleta.");
            }

            LinkedHashMap<String, Object> collection = new LinkedHashMap<>();
            collection.put("id", collectionId);
            collection.put("sequenceCode", asText(resource.get("sequenceCode"), 40));
            collection.put("status", asText(resource.get("status"), 40));
            collection.put(
                "maintenanceToken",
                tokenService.createCollectionMaintenanceToken(collectionId)
            );

            LinkedHashMap<String, Object> result = new LinkedHashMap<>();
            result.put("requiresWhatsApp", false);
            result.put("collection", collection);
            return result;
        } catch (RuntimeException error) {
            if (customerIsNotRegistered(error)) {
                LinkedHashMap<String, Object> result = new LinkedHashMap<>();
                result.put("requiresWhatsApp", true);
                result.put(
                    "whatsappMessage",
                    whatsappMessageFactory.collectionFallback(input)
                );
                return result;
            }
            throw clientError(
                error,
                "Não foi possível agendar a coleta. Confira os dados e tente novamente."
            );
        }
    }

    public Map<String, Object> updateCollection(String id, CollectionUpdateRequest input) {
        try {
            LinkedHashMap<String, Object> params = new LinkedHashMap<>();
            putIfPresent(params, "serviceDate", input.serviceDate());
            putIfPresent(params, "serviceStartHour", input.serviceStartHour());
            putIfPresent(params, "serviceEndHour", input.serviceEndHour());
            putIfPresent(params, "comments", input.comments());

            LinkedHashMap<String, Object> variables = new LinkedHashMap<>();
            variables.put("id", id);
            variables.put("params", params);
            JsonNode data = graphqlClient.execute(EslGraphqlDocuments.PICK_UPDATE, variables);
            JsonNode resource = operationResult(data, "pickUpdate");

            LinkedHashMap<String, Object> result = new LinkedHashMap<>();
            result.put("id", asText(resource.get("id"), 40));
            result.put("sequenceCode", asText(resource.get("sequenceCode"), 40));
            result.put("status", asText(resource.get("status"), 40));
            return result;
        } catch (RuntimeException error) {
            throw clientError(
                error,
                "Não foi possível atualizar a coleta. Confira os dados e tente novamente."
            );
        }
    }

    public Map<String, Object> cancelCollection(
        String id,
        CollectionCancellationRequest input
    ) {
        String reason = input.reason() == CancellationReason.OUTROS
            ? CANCELLATION_LABELS.get(input.reason()) + ": " + input.otherReason()
            : CANCELLATION_LABELS.get(input.reason());

        try {
            LinkedHashMap<String, Object> params = new LinkedHashMap<>();
            params.put("cancellationReason", reason);
            params.put("cancellationDatetime", currentInstant());
            LinkedHashMap<String, Object> variables = new LinkedHashMap<>();
            variables.put("id", id);
            variables.put("params", params);

            JsonNode data = graphqlClient.execute(EslGraphqlDocuments.PICK_CANCELLATION, variables);
            JsonNode resource = operationResult(data, "pickCancellation");

            LinkedHashMap<String, Object> result = new LinkedHashMap<>();
            result.put("id", asText(resource.get("id"), 40));
            result.put("sequenceCode", asText(resource.get("sequenceCode"), 40));
            result.put("status", asText(resource.get("status"), 40));
            result.put("cancellationReason", asText(resource.get("cancellationReason"), 360));
            return result;
        } catch (RuntimeException error) {
            throw clientError(
                error,
                "Não foi possível cancelar a coleta. Tente novamente mais tarde."
            );
        }
    }

    public static double quoteWeightForEsl(QuoteRequest input) {
        return Math.max(input.realWeight(), input.cubicVolume() * TAXED_WEIGHT_PER_CUBIC_METER);
    }

    public static String quotePriceTableForEsl(QuoteRequest input) {
        return input.height() >= THREE_METERS_THRESHOLD
            || input.width() >= THREE_METERS_THRESHOLD
            || input.length() >= THREE_METERS_THRESHOLD
                ? THREE_METERS_PRICE_TABLE
                : STANDARD_PRICE_TABLE;
    }

    private ValidatedInvoice resolveInvoice(InvoiceLookupRequest input) {
        try {
            return resolveInvoiceFields(
                input.invoiceKey(),
                input.invoiceNumber(),
                input.invoiceSeries(),
                input.senderCnpj(),
                input.recipientCnpj()
            );
        } catch (RuntimeException error) {
            throw clientError(error, "Não foi possível validar a nota fiscal informada.");
        }
    }

    private ValidatedInvoice resolveInvoice(InvoiceReferenceRequest input) {
        try {
            return resolveInvoiceFields(
                input.invoiceKey(),
                input.invoiceNumber(),
                input.invoiceSeries(),
                input.senderCnpj(),
                input.recipientCnpj()
            );
        } catch (RuntimeException error) {
            throw clientError(error, "Não foi possível validar a nota fiscal informada.");
        }
    }

    private ValidatedInvoice resolveInvoiceFields(
        String invoiceKey,
        String invoiceNumber,
        String invoiceSeries,
        String senderCnpj,
        String recipientCnpj
    ) {
        LinkedHashMap<String, Object> params = new LinkedHashMap<>();
        if (!invoiceKey.isEmpty()) {
            params.put("key", invoiceKey);
        } else {
            params.put("number", invoiceNumber);
        }
        putIfPresent(params, "series", invoiceSeries);
        if (!senderCnpj.isEmpty()) {
            params.put("issuer", document(senderCnpj));
        }
        if (!recipientCnpj.isEmpty()) {
            params.put("recipient", document(recipientCnpj));
        }

        LinkedHashMap<String, Object> variables = new LinkedHashMap<>();
        variables.put("params", params);
        variables.put("first", 2);
        JsonNode data = graphqlClient.execute(EslGraphqlDocuments.INVOICE, variables);
        return invoiceFromQuery(data);
    }

    private ValidatedInvoice resolveCollectionInvoice(CollectionRequest input) {
        if (input.invoiceValidationToken().isEmpty()) {
            return null;
        }
        String fingerprint = tokenService.invoiceValidationFingerprint(
            fingerprintInput(input.invoice())
        );
        String authorizedInvoiceId = tokenService.requireInvoiceValidationToken(
            input.invoiceValidationToken(),
            fingerprint
        );
        ValidatedInvoice invoice = resolveInvoice(input.invoice());
        if (!invoice.id().equals(authorizedInvoiceId)) {
            throw new ApiException(
                422,
                "A nota fiscal validada não corresponde aos dados informados."
            );
        }
        return invoice;
    }

    private ValidatedInvoice invoiceFromQuery(JsonNode data) {
        JsonNode invoice = objectProperty(data, "invoice");
        JsonNode edges = invoice == null ? null : invoice.get("edges");
        List<JsonNode> nodes = new ArrayList<>();
        if (edges != null && edges.isArray()) {
            for (JsonNode edge : edges) {
                JsonNode node = objectProperty(edge, "node");
                if (node != null) {
                    nodes.add(node);
                }
            }
        }
        if (nodes.size() != 1) {
            throw new ApiException(
                422,
                "Não foi possível confirmar uma única nota fiscal no ESL."
            );
        }

        JsonNode node = nodes.getFirst();
        String id = asText(node.get("id"), 40);
        if (!DIGITS_ONLY.matcher(id).matches()) {
            throw new ApiException(
                422,
                "A nota fiscal localizada não pode ser usada para agendar a coleta."
            );
        }
        return new ValidatedInvoice(
            id,
            asText(node.get("key"), 60),
            asText(node.get("number"), 40),
            asText(node.get("series"), 20),
            asText(node.get("issueDate"), 20),
            asNumber(node.get("value")),
            asNumber(node.get("volume")),
            asNumber(node.get("weight")),
            asText(node.get("status"), 40)
        );
    }

    private static JsonNode operationResult(JsonNode data, String operationName) {
        JsonNode result = objectProperty(data, operationName);
        if (result == null) {
            throw new ApiException(502, "O ESL retornou uma resposta incompleta.");
        }

        List<String> errors = new ArrayList<>();
        JsonNode rawErrors = result.get("errors");
        if (rawErrors != null && rawErrors.isArray()) {
            for (JsonNode value : rawErrors) {
                String error = asText(value, 300);
                if (!error.isEmpty()) {
                    errors.add(error);
                }
            }
        }

        JsonNode success = result.get("success");
        if (success == null || !success.isBoolean() || !success.booleanValue() || !errors.isEmpty()) {
            throw new EslGraphqlResponseException(
                errors.isEmpty() ? List.of("Operação não concluída.") : errors
            );
        }

        JsonNode resource = objectProperty(result, "resource");
        if (resource == null) {
            throw new ApiException(502, "O ESL não retornou o registro solicitado.");
        }
        return resource;
    }

    private static boolean customerIsNotRegistered(RuntimeException error) {
        if (!(error instanceof EslGraphqlResponseException graphqlError)) {
            return false;
        }
        for (String message : graphqlError.errors()) {
            if (CUSTOMER_ERROR.matcher(message).find()
                && REGISTRATION_ERROR.matcher(message).find()) {
                return true;
            }
        }
        return false;
    }

    private static RuntimeException clientError(RuntimeException error, String message) {
        if (error instanceof ApiException) {
            return error;
        }
        if (error instanceof EslGraphqlResponseException) {
            return new ApiException(422, message);
        }
        return error;
    }

    private String currentInstant() {
        return NODE_INSTANT.format(Instant.ofEpochMilli(clock.millis()));
    }

    private String currentSaoPauloDate() {
        return LOCAL_DATE.format(Instant.ofEpochMilli(clock.millis()).atZone(SAO_PAULO));
    }

    private String currentSaoPauloTime() {
        return LOCAL_TIME.format(Instant.ofEpochMilli(clock.millis()).atZone(SAO_PAULO));
    }

    private static String generatedReference() {
        return "SITE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }

    private static String collectionReference(String value) {
        return value.isEmpty() ? generatedReference() : value;
    }

    private static JsonNode objectProperty(JsonNode value, String name) {
        if (value == null || !value.isObject()) {
            return null;
        }
        JsonNode property = value.get(name);
        return property != null && property.isObject() ? property : null;
    }

    private static String asText(JsonNode value, int maxLength) {
        if (value == null || !(value.isString() || value.isNumber())) {
            return "";
        }
        String text = value.isString()
            ? value.stringValue()
            : EcmaScriptNumberFormatter.format(value.doubleValue());
        text = NodeStringCompatibility.trim(text);
        return text.substring(0, Math.min(maxLength, text.length()));
    }

    private static double asNumber(JsonNode value) {
        if (value == null || value.isNull()) {
            return 0D;
        }
        if (value.isNumber()) {
            double parsed = value.doubleValue();
            return Double.isFinite(parsed) ? parsed : 0D;
        }
        if (value.isBoolean()) {
            return value.booleanValue() ? 1D : 0D;
        }
        if (value.isString()) {
            return finiteOrZero(JavascriptNumber.parse(value.stringValue()));
        }
        if (value.isArray()) {
            return finiteOrZero(JavascriptNumber.parse(javascriptArrayString(value)));
        }
        return 0D;
    }

    private static double finiteOrZero(double value) {
        return Double.isFinite(value) ? value : 0D;
    }

    private static String javascriptArrayString(JsonNode value) {
        List<String> items = new ArrayList<>();
        for (JsonNode item : value) {
            items.add(javascriptArrayItemString(item));
        }
        return String.join(",", items);
    }

    private static String javascriptArrayItemString(JsonNode value) {
        if (value == null || value.isNull() || value.isMissingNode()) {
            return "";
        }
        if (value.isString()) {
            return value.stringValue();
        }
        if (value.isNumber()) {
            return EcmaScriptNumberFormatter.format(value.doubleValue());
        }
        if (value.isBoolean()) {
            return Boolean.toString(value.booleanValue());
        }
        if (value.isArray()) {
            return javascriptArrayString(value);
        }
        return "[object Object]";
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

    private static Map<String, Object> document(String value) {
        return singleEntry("document", value);
    }

    private static Map<String, Object> city(PostalCityRequest value) {
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put("name", value.name());
        result.put("stateCode", value.stateCode());
        return result;
    }

    private static void putDocumentIfPresent(
        Map<String, Object> target,
        String key,
        String document
    ) {
        if (!document.isEmpty()) {
            target.put(key, document(document));
        }
    }

    private static void putIfPresent(Map<String, Object> target, String key, String value) {
        if (!value.isEmpty()) {
            target.put(key, value);
        }
    }

    private static LinkedHashMap<String, Object> singleEntry(String key, Object value) {
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put(key, value);
        return result;
    }

    private static Number jsonNumber(double value) {
        if (!Double.isFinite(value)) {
            return null;
        }
        return EcmaScriptJsonNumber.of(value);
    }

    private static Number javascriptNumber(String value) {
        return jsonNumber(JavascriptNumber.parse(value));
    }

    private static InvoiceValidationFingerprintInput fingerprintInput(
        InvoiceLookupRequest input
    ) {
        return new InvoiceValidationFingerprintInput(
            input.invoiceKey(),
            input.invoiceNumber(),
            input.invoiceSeries(),
            input.senderCnpj(),
            input.recipientCnpj()
        );
    }

    private static InvoiceValidationFingerprintInput fingerprintInput(
        InvoiceReferenceRequest input
    ) {
        return new InvoiceValidationFingerprintInput(
            input.invoiceKey(),
            input.invoiceNumber(),
            input.invoiceSeries(),
            input.senderCnpj(),
            input.recipientCnpj()
        );
    }

    private record ValidatedInvoice(
        String id,
        String key,
        String number,
        String series,
        String issueDate,
        double value,
        double volume,
        double weight,
        String status
    ) {
    }
}

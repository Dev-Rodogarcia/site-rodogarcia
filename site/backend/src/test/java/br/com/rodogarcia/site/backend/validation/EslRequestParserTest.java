package br.com.rodogarcia.site.backend.validation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import br.com.rodogarcia.site.backend.dto.request.CancellationReason;
import br.com.rodogarcia.site.backend.dto.request.CollectionCancellationRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionUpdateRequest;
import br.com.rodogarcia.site.backend.dto.request.InvoiceLookupRequest;
import br.com.rodogarcia.site.backend.dto.request.QuoteRequest;
import br.com.rodogarcia.site.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;
import tools.jackson.databind.node.StringNode;

class EslRequestParserTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final EslRequestParser parser = new EslRequestParser();

    @Test
    void parsesAndAllowlistsTheQuoteContract() throws Exception {
        QuoteRequest result = parser.parseQuote(validQuote());

        assertEquals("12345678000190", result.customerCnpj());
        assertEquals("", result.senderCnpj());
        assertEquals("São Paulo", result.origin().name());
        assertEquals("SP", result.origin().stateCode());
        assertEquals("01001000", result.origin().postalCode());
        assertEquals("11999999999", result.requesterPhone());
        assertEquals("solicitante@example.com", result.requesterEmail());
        assertEquals("", result.productClassificationName());
        assertEquals("", result.comments());

        JsonNode serialized = jsonMapper.valueToTree(result);
        assertFalse(serialized.has("ignored"));
        assertFalse(serialized.get("origin").has("ignoredNested"));
    }

    @Test
    void preservesJavascriptNumberCoercionsUsedByZod() throws Exception {
        ObjectNode input = validQuote();
        input.put("height", true);
        input.set("width", jsonMapper.readTree("[5]"));
        input.put("length", "0x10");

        QuoteRequest result = parser.parseQuote(input);
        assertEquals(1.0d, result.height());
        assertEquals(5.0d, result.width());
        assertEquals(16.0d, result.length());
    }

    @Test
    void reportsTheFirstQuoteIssueWithTheNodeMessage() throws Exception {
        assertInvalid(parser::parseQuote, jsonMapper.readTree("null"), "Invalid input: expected object, received null");
        assertInvalid(parser::parseQuote, jsonMapper.readTree("[]"), "Invalid input: expected object, received array");
        assertInvalid(parser::parseQuote, jsonMapper.readTree("{}"), "Informe um CNPJ válido.");

        ObjectNode input = validQuote();
        input.put("height", "not-a-number");
        assertInvalid(parser::parseQuote, input, "Altura deve ser numérico.");

        input = validQuote();
        input.put("height", "1e999");
        assertInvalid(parser::parseQuote, input, "Altura deve ser finito.");

        input = validQuote();
        input.put("invoiceVolumes", "1e999");
        assertInvalid(parser::parseQuote, input, "Quantidade de volumes deve ser inteira.");

        input = validQuote();
        input.put("height", 1_001);
        assertInvalid(parser::parseQuote, input, "Altura excede o limite permitido.");

        input = validQuote();
        input.put("invoiceVolumes", 1.5d);
        assertInvalid(parser::parseQuote, input, "Quantidade de volumes deve ser inteira.");

        input = validQuote();
        input.put("invoiceVolumes", 1_000_001);
        assertInvalid(parser::parseQuote, input, "Quantidade de volumes excede o limite permitido.");
    }

    @Test
    void parsesInvoiceLookupAndPreservesSuperRefineOrder() throws Exception {
        ObjectNode input = jsonMapper.createObjectNode();
        input.put("invoiceNumber", " NF 123 ");
        input.put("invoiceSeries", 7);
        input.put("senderCnpj", "12.345.678/0001-90");
        input.put("ignored", "discarded");

        InvoiceLookupRequest result = parser.parseInvoiceLookup(input);
        assertEquals("NF 123", result.invoiceNumber());
        assertEquals("7", result.invoiceSeries());
        assertEquals("12345678000190", result.senderCnpj());
        assertFalse(jsonMapper.valueToTree(result).has("ignored"));

        assertInvalid(
            parser::parseInvoiceLookup,
            jsonMapper.readTree("{}"),
            "Informe a chave ou o número da NF."
        );
        assertInvalid(
            parser::parseInvoiceLookup,
            jsonMapper.readTree("{\"invoiceNumber\":\"1\"}"),
            "Informe o CNPJ do remetente ou do destinatário para validar a NF."
        );
    }

    @Test
    void parsesCollectionWithDefaultAddressAndDateParseRollover() throws Exception {
        ObjectNode input = validCollection();
        input.put("serviceDate", "2026-02-30");
        input.put("ignored", "discarded");
        ((ObjectNode) input.get("invoice")).put("ignoredNested", "discarded");

        CollectionRequest result = parser.parseCollectionCreate(input);
        assertEquals("2026-02-30", result.serviceDate());
        assertEquals("", result.deliveryAddress().postalCode());
        assertEquals("", result.deliveryAddress().street());
        assertEquals("", result.invoice().invoiceKey());
        assertFalse(jsonMapper.valueToTree(result).has("ignored"));
        assertFalse(jsonMapper.valueToTree(result.invoice()).has("ignoredNested"));

        input = validCollection();
        input.put("serviceDate", "2026-02-32");
        assertInvalid(
            parser::parseCollectionCreate,
            input,
            "Informe uma data válida no formato AAAA-MM-DD."
        );
    }

    @Test
    void normalizesExplicitCollectionAddress() throws Exception {
        ObjectNode input = validCollection();
        ObjectNode address = input.putObject("deliveryAddress");
        address.put("postalCode", "01.001-00099");
        address.put("street", " Rua\u00A0Um ");
        address.put("stateCode", "sp");
        address.put("ignored", "discarded");

        CollectionRequest result = parser.parseCollectionCreate(input);
        assertEquals("01001000", result.deliveryAddress().postalCode());
        assertEquals("Rua Um", result.deliveryAddress().street());
        assertEquals("SP", result.deliveryAddress().stateCode());
        assertFalse(jsonMapper.valueToTree(result.deliveryAddress()).has("ignored"));

        input = validCollection();
        input.putNull("deliveryAddress");
        assertInvalid(
            parser::parseCollectionCreate,
            input,
            "Invalid input: expected object, received null"
        );
    }

    @Test
    void enforcesInvoiceCapabilityCrossFieldsInNodeOrder() throws Exception {
        ObjectNode input = validCollection();
        input.put("invoiceValidationToken", "v1.abcdefghijkl.abcdefghijklmnopqrstuvwxyz");
        assertInvalid(
            parser::parseCollectionCreate,
            input,
            "A autorização da NF exige a mesma chave ou número validado."
        );

        input = validCollection();
        input.put("invoiceValidationToken", "v1.abcdefghijkl.abcdefghijklmnopqrstuvwxyz");
        ((ObjectNode) input.get("invoice")).put("invoiceNumber", "123");
        assertInvalid(
            parser::parseCollectionCreate,
            input,
            "A autorização da NF exige o CNPJ do remetente ou do destinatário validado."
        );

        input = validCollection();
        input.put("senderCnpj", "12345678000190");
        input.put("invoiceValidationToken", "v1.abcdefghijkl.abcdefghijklmnopqrstuvwxyz");
        ObjectNode invoice = (ObjectNode) input.get("invoice");
        invoice.put("invoiceNumber", "123");
        invoice.put("senderCnpj", "98765432000190");
        assertInvalid(
            parser::parseCollectionCreate,
            input,
            "Os CNPJs da NF devem corresponder aos CNPJs informados para a coleta."
        );
    }

    @Test
    void parsesAndValidatesCollectionUpdate() throws Exception {
        ObjectNode input = jsonMapper.createObjectNode();
        input.put("serviceDate", "2026-04-31");
        input.put("comments", "  Nova\tobservação  ");
        input.put("ignored", "discarded");

        CollectionUpdateRequest result = parser.parseCollectionUpdate(input);
        assertEquals("2026-04-31", result.serviceDate());
        assertEquals("Nova observação", result.comments());
        assertFalse(jsonMapper.valueToTree(result).has("ignored"));

        assertInvalid(
            parser::parseCollectionUpdate,
            jsonMapper.readTree("{\"serviceDate\":null,\"comments\":false}"),
            "Informe ao menos um dado para atualizar a coleta."
        );
        assertInvalid(
            parser::parseCollectionUpdate,
            jsonMapper.readTree("{\"serviceStartHour\":\"10:00\",\"serviceEndHour\":\"09:00\"}"),
            "O horário final deve ser posterior ao horário inicial."
        );
    }

    @Test
    void parsesAndValidatesCollectionCancellation() throws Exception {
        ObjectNode input = jsonMapper.createObjectNode();
        input.put("reason", " outros ");
        input.put("otherReason", "  Dado\tincorreto  ");
        input.put("ignored", "discarded");

        CollectionCancellationRequest result = parser.parseCollectionCancellation(input);
        assertEquals(CancellationReason.OUTROS, result.reason());
        assertEquals("Dado incorreto", result.otherReason());
        assertFalse(jsonMapper.valueToTree(result).has("ignored"));

        assertInvalid(
            parser::parseCollectionCancellation,
            jsonMapper.readTree("{}"),
            "Motivo de cancelamento inválido."
        );
        assertInvalid(
            parser::parseCollectionCancellation,
            jsonMapper.readTree("{\"reason\":\"OUTROS\"}"),
            "Descreva o motivo do cancelamento."
        );
    }

    @Test
    void validatesRemoteCollectionIdWithTheSameSanitizer() throws Exception {
        assertEquals("12345", parser.parseRemoteCollectionId(StringNode.valueOf(" 12345 ")));
        assertEquals("12345", parser.parseRemoteCollectionId(jsonMapper.readTree("12345")));
        assertInvalid(
            parser::parseRemoteCollectionId,
            StringNode.valueOf("collection_123"),
            "Identificador remoto inválido."
        );
    }

    private ObjectNode validQuote() throws Exception {
        return (ObjectNode) jsonMapper.readTree("""
            {
              "customerCnpj": "12.345.678/0001-90",
              "origin": {
                "name": " São\u00a0Paulo ",
                "stateCode": "sp",
                "postalCode": "01001-000",
                "ignoredNested": "discarded"
              },
              "destination": {
                "name": "Rio de Janeiro",
                "stateCode": "rj",
                "postalCode": "20040-002"
              },
              "height": 1,
              "width": 2,
              "length": 3,
              "realWeight": 4,
              "cubicVolume": 5,
              "invoiceValue": 6,
              "invoiceVolumes": 7,
              "requesterName": " Solicitante ",
              "requesterPhone": "(11) 99999-9999",
              "requesterEmail": " SOLICITANTE@EXAMPLE.COM ",
              "ignored": "discarded"
            }
            """);
    }

    private ObjectNode validCollection() throws Exception {
        return (ObjectNode) jsonMapper.readTree("""
            {
              "customerCnpj": "12345678000190",
              "pickupLocationCnpj": "12345678000190",
              "origin": { "name": "São Paulo", "stateCode": "sp" },
              "serviceDate": "2026-09-10",
              "serviceStartHour": "08:00",
              "serviceEndHour": "10:00",
              "invoice": {}
            }
            """);
    }

    private void assertInvalid(ParserCall call, JsonNode value, String message) {
        ApiException error = assertThrows(ApiException.class, () -> call.parse(value));
        assertEquals(422, error.status());
        assertEquals(message, error.getMessage());
    }

    @FunctionalInterface
    private interface ParserCall {
        Object parse(JsonNode value);
    }
}

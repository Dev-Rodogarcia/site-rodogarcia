package br.com.rodogarcia.site.backend.integration.esl;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EslGraphqlDocumentsTest {

    @Test
    void preservesTheTemplateLiteralLeadingAndTrailingNewlines() {
        assertThat(EslGraphqlDocuments.QUOTE_CREATE)
            .startsWith("\n  mutation quoteCreate")
            .endsWith("  }\n");
        assertThat(EslGraphqlDocuments.INVOICE)
            .startsWith("\n  query invoice")
            .endsWith("  }\n");
        assertThat(EslGraphqlDocuments.DELIVERY_REGION)
            .startsWith("\n  query deliveryRegion")
            .endsWith("  }\n");
        assertThat(EslGraphqlDocuments.PICK_CREATE).isEqualTo("""

              mutation pickCreate($params: PickMutationInput!) {
                pickCreate(params: $params) {
                  errors
                  resource {\s
              id
              sequenceCode
              status
              cancellationReason
              comments
              requestDate
              requestHour
              serviceDate
              serviceStartHour
              serviceEndHour
              invoicesValue
              invoicesVolumes
              invoicesWeight
             }
                  success
                }
              }
            """);
    }
}

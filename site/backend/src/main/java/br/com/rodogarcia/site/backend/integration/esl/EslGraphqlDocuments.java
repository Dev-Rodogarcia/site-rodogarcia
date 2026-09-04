package br.com.rodogarcia.site.backend.integration.esl;

public final class EslGraphqlDocuments {

    public static final String QUOTE_CREATE = "\n" + """
          mutation quoteCreate($params: QuoteCreateInput!) {
            quoteCreate(params: $params) {
              errors
              resource {
                id
                sequenceCode
                referenceNumber
                requestedAt
                effectiveUntil
                requesterName
                requesterPhone
                requesterEmail
                bidsApprovedCount
                bidsDisapprovedCount
                bidsPendingCount
                quoteStretchBids { total }
              }
              success
            }
          }
        """;

    public static final String INVOICE = "\n" + """
          query invoice($params: InvoiceQueryInput, $first: Int) {
            invoice(params: $params, first: $first) {
              edges {
                node {
                  id
                  key
                  number
                  series
                  issueDate
                  value
                  volume
                  weight
                  status
                }
              }
            }
          }
        """;

    public static final String DELIVERY_REGION = "\n" + """
          query deliveryRegion($params: DeliveryRegionQueryInput, $after: String, $first: Int) {
            deliveryRegion(params: $params, after: $after, first: $first) {
              nodes {
                id
                deliveryCities {
                  city {
                    name
                    state { code }
                  }
                }
                ediDefaultCorporation {
                  id
                  person { cnpj }
                }
                deliveryRegionCorporations {
                  corporation {
                    id
                    person { cnpj }
                  }
                }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        """;

    private static final String PICK_RESOURCE_FIELDS = "\n" + """
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
        """;

    public static final String PICK_CREATE = "\n" + """
          mutation pickCreate($params: PickMutationInput!) {
            pickCreate(params: $params) {
              errors
              resource { %s }
              success
            }
          }
        """.formatted(PICK_RESOURCE_FIELDS);

    public static final String PICK_UPDATE = "\n" + """
          mutation pickUpdate($id: ID!, $params: PickMutationInput!) {
            pickUpdate(id: $id, params: $params) {
              errors
              resource { %s }
              success
            }
          }
        """.formatted(PICK_RESOURCE_FIELDS);

    public static final String PICK_CANCELLATION = "\n" + """
          mutation pickCancellation($id: ID!, $params: PickCancellationInput!) {
            pickCancellation(id: $id, params: $params) {
              errors
              resource { %s }
              success
            }
          }
        """.formatted(PICK_RESOURCE_FIELDS);

    private EslGraphqlDocuments() {
    }
}

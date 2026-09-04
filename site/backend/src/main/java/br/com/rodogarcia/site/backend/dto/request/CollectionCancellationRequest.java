package br.com.rodogarcia.site.backend.dto.request;

public record CollectionCancellationRequest(
    CancellationReason reason,
    String otherReason
) {
}

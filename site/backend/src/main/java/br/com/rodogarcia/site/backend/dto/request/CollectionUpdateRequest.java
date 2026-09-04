package br.com.rodogarcia.site.backend.dto.request;

public record CollectionUpdateRequest(
    String serviceDate,
    String serviceStartHour,
    String serviceEndHour,
    String comments
) {
}

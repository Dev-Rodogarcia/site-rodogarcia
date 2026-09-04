package br.com.rodogarcia.site.backend.model;

import java.time.Duration;

public record RateLimitPolicy(String namespace, Duration window, int maximum, String message) {

    public static final RateLimitPolicy ESL_QUOTE = new RateLimitPolicy(
        "esl-quote",
        Duration.ofHours(1),
        30,
        "Limite de cotações atingido. Tente novamente mais tarde."
    );
    public static final RateLimitPolicy ESL_INVOICE_VALIDATION = new RateLimitPolicy(
        "esl-invoice-validation",
        Duration.ofHours(1),
        30,
        "Limite de consultas de NF atingido. Tente novamente mais tarde."
    );
    public static final RateLimitPolicy ESL_COLLECTION_CREATE = new RateLimitPolicy(
        "esl-collection-create",
        Duration.ofHours(1),
        20,
        "Limite de solicitações de coleta atingido. Tente novamente mais tarde."
    );
    public static final RateLimitPolicy ESL_COLLECTION_MAINTENANCE = new RateLimitPolicy(
        "esl-collection-maintenance",
        Duration.ofHours(1),
        10,
        "Limite de alterações de coleta atingido. Tente novamente mais tarde."
    );
    public static final RateLimitPolicy PUBLIC_POSTAL_CODE = new RateLimitPolicy(
        "public-postal-code",
        Duration.ofHours(1),
        60,
        "Limite de consultas de CEP atingido. Tente novamente mais tarde."
    );
    public static final RateLimitPolicy PUBLIC_COMPANY_LOOKUP = new RateLimitPolicy(
        "public-company-lookup",
        Duration.ofHours(1),
        30,
        "Muitas tentativas. Tente novamente mais tarde."
    );
}

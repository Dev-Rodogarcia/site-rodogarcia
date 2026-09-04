package br.com.rodogarcia.site.backend.model;

public record RateLimitState(boolean allowed, int count, long resetAt, int remaining) {
}

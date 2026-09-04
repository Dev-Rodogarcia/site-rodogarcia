package br.com.rodogarcia.cms.backend.model.improvement;

public record ImprovementInput(
    String profile,
    String name,
    String email,
    String phone,
    String category,
    String message,
    String page,
    String branch,
    String area,
    String expectedResult,
    String applicationPlace
) {
}

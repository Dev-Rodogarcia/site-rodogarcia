package br.com.rodogarcia.site.backend.integration.esl;

import java.util.List;

public class EslGraphqlResponseException extends RuntimeException {

    private final List<String> errors;

    public EslGraphqlResponseException(List<String> errors) {
        super("A API ESL rejeitou a solicitação.");
        this.errors = List.copyOf(errors);
    }

    public List<String> errors() {
        return errors;
    }
}

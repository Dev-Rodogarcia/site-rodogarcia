package br.com.rodogarcia.site.backend.integration;

public record ProviderHttpResponse(int status, byte[] body) {

    public ProviderHttpResponse {
        body = body == null ? new byte[0] : body.clone();
    }

    @Override
    public byte[] body() {
        return body.clone();
    }
}

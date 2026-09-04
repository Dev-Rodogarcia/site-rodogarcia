package br.com.rodogarcia.site.backend.integration.viacep;

import java.io.IOException;

import br.com.rodogarcia.site.backend.integration.ProviderAccessException;
import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;
import br.com.rodogarcia.site.backend.integration.RestClientFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class RestClientViaCepClient implements ViaCepClient {

    static final String BASE_URL = "https://viacep.com.br";

    private final RestClient restClient;

    public RestClientViaCepClient() {
        this(RestClientFactory.create(BASE_URL));
    }

    RestClientViaCepClient(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public ProviderHttpResponse lookup(String postalCode) {
        try {
            return restClient.get()
                .uri("/ws/{postalCode}/json/", postalCode)
                .exchange((request, response) -> {
                    int status = response.getStatusCode().value();
                    if (status < 200 || status >= 300) {
                        return new ProviderHttpResponse(status, new byte[0]);
                    }
                    try {
                        return new ProviderHttpResponse(status, response.getBody().readAllBytes());
                    } catch (IOException ignored) {
                        return new ProviderHttpResponse(status, new byte[0]);
                    }
                });
        } catch (RestClientException error) {
            throw new ProviderAccessException(error);
        }
    }
}

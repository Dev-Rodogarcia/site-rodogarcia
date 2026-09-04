package br.com.rodogarcia.site.backend.integration.brasilapi;

import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;

public interface BrasilApiClient {

    ProviderHttpResponse lookupCompany(String cnpj);
}

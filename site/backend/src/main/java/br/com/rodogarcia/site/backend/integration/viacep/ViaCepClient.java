package br.com.rodogarcia.site.backend.integration.viacep;

import br.com.rodogarcia.site.backend.integration.ProviderHttpResponse;

public interface ViaCepClient {

    ProviderHttpResponse lookup(String postalCode);
}

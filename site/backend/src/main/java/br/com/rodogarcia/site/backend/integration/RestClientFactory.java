package br.com.rodogarcia.site.backend.integration;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

public final class RestClientFactory {

    public static final Duration PROVIDER_TIMEOUT = Duration.ofSeconds(5);
    private static final String REDIRECT_RETRY_LIMIT_PROPERTY =
        "jdk.httpclient.redirects.retrylimit";
    private static final String NODE_FETCH_ATTEMPT_LIMIT = "21";

    static {
        configureNodeFetchRedirectLimit();
    }

    private RestClientFactory() {
    }

    public static RestClient create(String baseUrl) {
        HttpClient httpClient = nodeCompatibleHttpClientBuilder(PROVIDER_TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(PROVIDER_TIMEOUT);
        return RestClient.builder()
            .baseUrl(baseUrl)
            .requestFactory(requestFactory)
            .build();
    }

    public static HttpClient.Builder nodeCompatibleHttpClientBuilder(Duration timeout) {
        configureNodeFetchRedirectLimit();
        return HttpClient.newBuilder()
            .connectTimeout(timeout);
    }

    public static synchronized void configureNodeFetchRedirectLimit() {
        System.setProperty(REDIRECT_RETRY_LIMIT_PROPERTY, NODE_FETCH_ATTEMPT_LIMIT);
    }
}

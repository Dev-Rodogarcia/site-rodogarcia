package br.com.rodogarcia.site.backend.config;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;

import org.springframework.boot.jackson.autoconfigure.JsonFactoryBuilderCustomizer;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import tools.jackson.core.StreamReadConstraints;

@Configuration(proxyBeanMethods = false)
public class ApplicationRuntimeConfig {

    @Bean
    ApplicationProperties applicationProperties() {
        return ApplicationProperties.load();
    }

    @Bean
    WebServerFactoryCustomizer<ConfigurableWebServerFactory> webServerFactoryCustomizer(
        ApplicationProperties properties
    ) {
        return factory -> {
            factory.setPort(properties.port());
            try {
                factory.setAddress(InetAddress.getByName(properties.host()));
            } catch (UnknownHostException error) {
                throw new IllegalStateException("HOST inválido.", error);
            }
        };
    }

    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatWireCompatibilityCustomizer() {
        return factory -> {
            factory.addConnectorCustomizers(TomcatWireCompatibility::customizeConnector);
            factory.addContextValves(TomcatWireCompatibility.contextValve());
        };
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    ServletContextInitializer disableServletSessionTracking() {
        // O Express não interpreta ;jsessionid no path e esta API não possui
        // sessão. Desativar todos os tracking modes preserva o request-target.
        return servletContext -> servletContext.setSessionTrackingModes(java.util.Set.of());
    }

    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    JsonFactoryBuilderCustomizer nodeCompatibleJsonReadConstraints() {
        StreamReadConstraints constraints = StreamReadConstraints.builder()
            .maxNestingDepth(Integer.MAX_VALUE)
            .maxNumberLength(Integer.MAX_VALUE)
            .maxStringLength(Integer.MAX_VALUE)
            .maxNameLength(Integer.MAX_VALUE)
            .build();
        return builder -> builder.streamReadConstraints(constraints);
    }
}

package br.com.rodogarcia.cms.backend.config;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;

import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration(proxyBeanMethods = false)
public class ApplicationRuntimeConfig {

    @Bean
    @ConditionalOnMissingBean(CmsProperties.class)
    CmsProperties cmsProperties() {
        return CmsProperties.load();
    }

    @Bean
    StoragePaths storagePaths(CmsProperties properties) {
        return properties.storagePaths();
    }

    @Bean
    WebServerFactoryCustomizer<ConfigurableWebServerFactory> webServerFactoryCustomizer(
        CmsProperties properties
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
    @ConditionalOnMissingBean(Clock.class)
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    ServletContextInitializer disableServletSessionTracking() {
        return servletContext -> servletContext.setSessionTrackingModes(java.util.Set.of());
    }

    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}

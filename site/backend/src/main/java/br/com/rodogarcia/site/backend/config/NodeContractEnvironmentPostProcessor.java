package br.com.rodogarcia.site.backend.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.CommandLinePropertySource;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.StandardEnvironment;

/**
 * Impede que nomes exclusivos do Spring alterem o contrato herdado do Node.
 * As variáveis permitidas são lidas diretamente por {@link ApplicationProperties}.
 */
public final class NodeContractEnvironmentPostProcessor
    implements EnvironmentPostProcessor, Ordered {

    private static final String SPRING_APPLICATION_JSON = "spring.application.json";

    @Override
    public void postProcessEnvironment(
        ConfigurableEnvironment environment,
        SpringApplication application
    ) {
        var sources = environment.getPropertySources();
        sources.remove(CommandLinePropertySource.COMMAND_LINE_PROPERTY_SOURCE_NAME);
        sources.remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        sources.remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
        sources.remove(SPRING_APPLICATION_JSON);
    }

    @Override
    public int getOrder() {
        // Depois de SpringApplicationJson (+5), antes de ConfigData (+10).
        return ConfigDataEnvironmentPostProcessor.ORDER - 1;
    }
}

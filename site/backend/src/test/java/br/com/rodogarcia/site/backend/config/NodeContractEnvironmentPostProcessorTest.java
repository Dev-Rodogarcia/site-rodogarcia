package br.com.rodogarcia.site.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.support.SpringApplicationJsonEnvironmentPostProcessor;
import org.springframework.core.env.CommandLinePropertySource;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

class NodeContractEnvironmentPostProcessorTest {

    @Test
    void runsAfterApplicationJsonAndBeforeConfigData() {
        int order = new NodeContractEnvironmentPostProcessor().getOrder();

        assertThat(order).isGreaterThan(
            SpringApplicationJsonEnvironmentPostProcessor.DEFAULT_ORDER
        );
        assertThat(order).isLessThan(ConfigDataEnvironmentPostProcessor.ORDER);
    }

    @Test
    void removesEveryGenericSpringOverrideSourceBeforeConfigDataLoads() {
        MockEnvironment environment = new MockEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource(
            CommandLinePropertySource.COMMAND_LINE_PROPERTY_SOURCE_NAME,
            Map.of("server.servlet.context-path", "/from-args")
        ));
        environment.getPropertySources().addFirst(new MapPropertySource(
            StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
            Map.of("SERVER_SERVLET_CONTEXT_PATH", "/from-env", "DEBUG", "release")
        ));
        environment.getPropertySources().addFirst(new MapPropertySource(
            StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME,
            Map.of("server.compression.enabled", "true")
        ));
        environment.getPropertySources().addFirst(new MapPropertySource(
            "spring.application.json",
            Map.of("spring.servlet.multipart.enabled", "true")
        ));
        environment.getPropertySources().addLast(new MapPropertySource(
            "contract-test",
            Map.of("preserved", "yes")
        ));

        new NodeContractEnvironmentPostProcessor().postProcessEnvironment(
            environment,
            new SpringApplication(Object.class)
        );

        assertThat(environment.getPropertySources().contains(
            CommandLinePropertySource.COMMAND_LINE_PROPERTY_SOURCE_NAME
        )).isFalse();
        assertThat(environment.getPropertySources().contains(
            StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME
        )).isFalse();
        assertThat(environment.getPropertySources().contains(
            StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME
        )).isFalse();
        assertThat(environment.getPropertySources().contains("spring.application.json"))
            .isFalse();
        assertThat(environment.getProperty("preserved")).isEqualTo("yes");
    }
}

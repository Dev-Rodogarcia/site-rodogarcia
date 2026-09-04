package br.com.rodogarcia.landingbuilder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.webmvc.autoconfigure.error.ErrorMvcAutoConfiguration;

@SpringBootApplication(exclude = ErrorMvcAutoConfiguration.class)
public class LandingBuilderApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(LandingBuilderApplication.class);
        application.setAddCommandLineProperties(false);
        application.run(args);
    }
}

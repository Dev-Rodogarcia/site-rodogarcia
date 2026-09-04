package br.com.rodogarcia.site.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.webmvc.autoconfigure.error.ErrorMvcAutoConfiguration;

@SpringBootApplication(exclude = ErrorMvcAutoConfiguration.class)
public class SiteBackendApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(
            SiteBackendApplication.class
        );
        application.setAddCommandLineProperties(false);
        application.run(args);
    }
}

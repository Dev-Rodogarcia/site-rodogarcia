package br.com.rodogarcia.cms.backend.config;

import br.com.rodogarcia.cms.backend.security.CorsCompatibilityFilter;
import br.com.rodogarcia.cms.backend.security.SecurityHeadersFilter;
import br.com.rodogarcia.cms.backend.security.TrailingSlashCompatibilityFilter;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import br.com.rodogarcia.cms.backend.validation.JsonBodyCompatibilityFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

@Configuration(proxyBeanMethods = false)
public class HttpFilterConfig {

    @Bean
    FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilter() {
        var registration = new FilterRegistrationBean<>(new SecurityHeadersFilter());
        registration.setName("securityHeadersFilter");
        registration.setOrder(0);
        return registration;
    }

    @Bean
    FilterRegistrationBean<CorsCompatibilityFilter> corsCompatibilityFilter(RequestPolicy policy) {
        var registration = new FilterRegistrationBean<>(new CorsCompatibilityFilter(policy));
        registration.setName("corsCompatibilityFilter");
        registration.setOrder(10);
        return registration;
    }

    @Bean
    FilterRegistrationBean<ExpressJsonResponseFilter> expressJsonResponseFilter() {
        var registration = new FilterRegistrationBean<>(new ExpressJsonResponseFilter());
        registration.setName("expressJsonResponseFilter");
        registration.setOrder(5);
        return registration;
    }

    @Bean
    FilterRegistrationBean<TrailingSlashCompatibilityFilter> trailingSlashCompatibilityFilter() {
        var registration = new FilterRegistrationBean<>(new TrailingSlashCompatibilityFilter());
        registration.setName("trailingSlashCompatibilityFilter");
        registration.setOrder(15);
        return registration;
    }

    @Bean
    FilterRegistrationBean<JsonBodyCompatibilityFilter> jsonBodyCompatibilityFilter(JsonMapper mapper) {
        var registration = new FilterRegistrationBean<>(new JsonBodyCompatibilityFilter(mapper));
        registration.setName("jsonBodyCompatibilityFilter");
        registration.setOrder(20);
        return registration;
    }
}

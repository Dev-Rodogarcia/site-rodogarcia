package br.com.rodogarcia.site.backend.config;

import br.com.rodogarcia.site.backend.security.AllowedOriginService;
import br.com.rodogarcia.site.backend.security.CorsCompatibilityFilter;
import br.com.rodogarcia.site.backend.security.ExpressOptionsCompatibilityFilter;
import br.com.rodogarcia.site.backend.security.InvalidPathDecodingCompatibilityFilter;
import br.com.rodogarcia.site.backend.security.SecurityHeadersFilter;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import br.com.rodogarcia.site.backend.validation.JsonBodyCompatibilityFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

@Configuration(proxyBeanMethods = false)
public class HttpFilterConfig {

    @Bean
    FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilter() {
        FilterRegistrationBean<SecurityHeadersFilter> registration =
            new FilterRegistrationBean<>(new SecurityHeadersFilter());
        registration.setOrder(0);
        registration.setName("securityHeadersFilter");
        return registration;
    }

    @Bean
    FilterRegistrationBean<CorsCompatibilityFilter> corsCompatibilityFilter(
        AllowedOriginService allowedOriginService
    ) {
        FilterRegistrationBean<CorsCompatibilityFilter> registration =
            new FilterRegistrationBean<>(new CorsCompatibilityFilter(allowedOriginService));
        registration.setOrder(10);
        registration.setName("corsCompatibilityFilter");
        return registration;
    }

    @Bean
    FilterRegistrationBean<JsonBodyCompatibilityFilter> jsonBodyCompatibilityFilter(
        JsonMapper jsonMapper,
        ExpressJsonResponse jsonResponse
    ) {
        FilterRegistrationBean<JsonBodyCompatibilityFilter> registration =
            new FilterRegistrationBean<>(new JsonBodyCompatibilityFilter(jsonMapper, jsonResponse));
        registration.setOrder(20);
        registration.setName("jsonBodyCompatibilityFilter");
        return registration;
    }

    @Bean
    FilterRegistrationBean<InvalidPathDecodingCompatibilityFilter>
        invalidPathDecodingCompatibilityFilter(ExpressJsonResponse expressJsonResponse) {
        FilterRegistrationBean<InvalidPathDecodingCompatibilityFilter> registration =
            new FilterRegistrationBean<>(
                new InvalidPathDecodingCompatibilityFilter(expressJsonResponse)
            );
        registration.setOrder(25);
        registration.setName("invalidPathDecodingCompatibilityFilter");
        return registration;
    }

    @Bean
    FilterRegistrationBean<ExpressOptionsCompatibilityFilter> expressOptionsCompatibilityFilter(
        AllowedOriginService allowedOriginService,
        ExpressJsonResponse expressJsonResponse
    ) {
        FilterRegistrationBean<ExpressOptionsCompatibilityFilter> registration =
            new FilterRegistrationBean<>(new ExpressOptionsCompatibilityFilter(
                allowedOriginService,
                expressJsonResponse
            ));
        registration.setOrder(30);
        registration.setName("expressOptionsCompatibilityFilter");
        return registration;
    }
}

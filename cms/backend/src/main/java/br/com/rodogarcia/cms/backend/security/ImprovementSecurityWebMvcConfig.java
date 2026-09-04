package br.com.rodogarcia.cms.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class ImprovementSecurityWebMvcConfig implements WebMvcConfigurer {
    private final ImprovementRequestInterceptor interceptor;

    public ImprovementSecurityWebMvcConfig(ImprovementRequestInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor)
            .addPathPatterns(
                "/api/improvements",
                "/api/improvements/",
                "/api/admin/improvements",
                "/api/admin/improvements/"
            )
            .order(100);
    }
}

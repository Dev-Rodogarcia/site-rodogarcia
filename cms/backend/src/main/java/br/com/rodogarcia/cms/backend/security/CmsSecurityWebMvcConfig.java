package br.com.rodogarcia.cms.backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.PathContainer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.util.pattern.PathPatternParser;

@Configuration(proxyBeanMethods = false)
public class CmsSecurityWebMvcConfig implements WebMvcConfigurer {

    private final CmsSecurityInterceptor interceptor;

    public CmsSecurityWebMvcConfig(CmsSecurityInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor).addPathPatterns("/api/**");
    }

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        PathPatternParser parser = new PathPatternParser();
        parser.setCaseSensitive(false);
        parser.setPathOptions(PathContainer.Options.create('/', false));
        configurer.setPatternParser(parser);
    }
}

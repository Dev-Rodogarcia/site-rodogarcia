package br.com.rodogarcia.cms.backend.controller;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.security.AdminRouteContract;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.SortedSet;
import java.util.TreeSet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.http.server.PathContainer;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.WebApplicationContextUtils;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@RestController
public class FallbackController implements ApplicationContextAware {

    private ApplicationContext applicationContext;

    @RequestMapping(
        value = {"/health", "/ready", "/uploads", "/uploads/**"},
        method = {
            RequestMethod.POST,
            RequestMethod.PUT,
            RequestMethod.PATCH,
            RequestMethod.DELETE,
            RequestMethod.OPTIONS,
            RequestMethod.TRACE
        }
    )
    public void nonApiMethodFallback() {
        throw new ApiException(404, "Recurso não encontrado.");
    }

    @RequestMapping(
        value = {"/api/admin", "/api/admin/**", "/api/auth", "/api/auth/**", "/api/**"},
        method = RequestMethod.OPTIONS
    )
    public void apiOptionsFallback(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        SortedSet<String> methods = supportedMethods(request);
        if (methods.isEmpty()) throw new ApiException(404, "Recurso não encontrado.");
        sendOptions(response, String.join(", ", methods));
    }

    @RequestMapping({"/api/admin", "/api/admin/**", "/api/auth", "/api/auth/**", "/api/**"})
    public void apiFallback(HttpServletRequest request) {
        String path = pathWithinApplication(request);
        if (isAdminPath(path)) {
            String relative = path.substring("/api/admin".length());
            if (AdminRouteContract.matchesGenericEntityRoute(relative, request.getMethod())) {
                throw new ApiException(404, "Recurso administrativo não encontrado.");
            }
        }
        throw new ApiException(404, "Recurso não encontrado.");
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    private SortedSet<String> supportedMethods(HttpServletRequest request) {
        SortedSet<String> methods = new TreeSet<>();
        ApplicationContext context = applicationContext != null
            ? applicationContext
            : WebApplicationContextUtils.getWebApplicationContext(request.getServletContext());
        if (context == null) return methods;
        RequestMappingHandlerMapping mappings = context.getBean(
            "requestMappingHandlerMapping", RequestMappingHandlerMapping.class);
        String path = pathWithinApplication(request);
        PathContainer candidate = PathContainer.parsePath(
            path,
            PathContainer.Options.create('/', false)
        );
        mappings.getHandlerMethods().forEach((mapping, handler) -> {
            if (handler.getBeanType().equals(FallbackController.class)) return;
            var patterns = mapping.getPathPatternsCondition();
            if (patterns == null || patterns.getPatterns().stream().noneMatch(
                pattern -> pattern.matches(candidate))) return;
            mapping.getMethodsCondition().getMethods().forEach(method -> {
                if (method != RequestMethod.OPTIONS) methods.add(method.name());
            });
        });
        if (methods.contains("GET")) methods.add("HEAD");
        if (isAdminPath(path)) {
            String relative = path.substring("/api/admin".length());
            methods.addAll(AdminRouteContract.genericEntityMethods(relative));
        }
        return methods;
    }

    private static String pathWithinApplication(HttpServletRequest request) {
        return request.getRequestURI().substring(request.getContextPath().length());
    }

    private static boolean isAdminPath(String path) {
        return path.equalsIgnoreCase("/api/admin")
            || path.regionMatches(true, 0, "/api/admin/", 0, "/api/admin/".length());
    }

    private static void sendOptions(HttpServletResponse response, String methods) throws IOException {
        byte[] body = methods.getBytes(StandardCharsets.UTF_8);
        response.setStatus(HttpServletResponse.SC_OK);
        response.setHeader("Allow", methods);
        response.setContentType("text/plain");
        response.setContentLength(body.length);
        response.getOutputStream().write(body);
    }
}

package br.com.rodogarcia.cms.backend.controller;

import java.util.Map;

import br.com.rodogarcia.cms.backend.security.SecurityContext;
import br.com.rodogarcia.cms.backend.service.AnalyticsService;
import br.com.rodogarcia.cms.backend.service.AuditService;
import br.com.rodogarcia.cms.backend.service.AuthService;
import br.com.rodogarcia.cms.backend.validation.JsonBodyCompatibilityFilter;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analytics;
    private final AuthService auth;
    private final RequestPolicy policy;

    public AnalyticsController(AnalyticsService analytics, AuthService auth, RequestPolicy policy) {
        this.analytics = analytics;
        this.auth = auth;
        this.policy = policy;
    }

    @PostMapping("/event")
    public ResponseEntity<Map<String, String>> event(HttpServletRequest request) {
        policy.requireAllowedOrigin(request);
        policy.requireJson(request);
        JsonNode body = JsonBodyCompatibilityFilter.parsedBody(request);
        analytics.createEvent(body, request);
        return ResponseEntity.status(201).body(Map.of("message", "Evento registrado."));
    }

    @GetMapping("/public-config")
    public Map<String, Object> publicConfig() {
        return Map.of("config", analytics.readPublicConfig());
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(HttpServletRequest request) {
        String days = AuditService.queryParameter(request, "days", "30");
        return analytics.stats(AuditService.jsNumber(days));
    }

    @GetMapping("/config")
    public Map<String, Object> config(HttpServletRequest request) {
        var authenticated = SecurityContext.require(request);
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("user", auth.publicUser(authenticated.user()));
        response.put("csrfToken", authenticated.session().getCsrfToken());
        response.put("config", analytics.readConfig());
        return response;
    }

    @PostMapping("/config")
    public Map<String, Object> update(HttpServletRequest request) {
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("message", "Configuracao de analytics atualizada com sucesso.");
        response.put("config", analytics.updateConfig(
            JsonBodyCompatibilityFilter.parsedBody(request)));
        return response;
    }
}

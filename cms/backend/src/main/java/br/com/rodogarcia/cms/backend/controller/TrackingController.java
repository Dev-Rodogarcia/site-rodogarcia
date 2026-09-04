package br.com.rodogarcia.cms.backend.controller;

import java.util.Map;

import br.com.rodogarcia.cms.backend.service.AuditService;
import br.com.rodogarcia.cms.backend.service.TrackingService;
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
@RequestMapping("/api")
public class TrackingController {

    private final TrackingService tracking;
    private final AuditService audit;
    private final RequestPolicy policy;

    public TrackingController(TrackingService tracking, AuditService audit, RequestPolicy policy) {
        this.tracking = tracking;
        this.audit = audit;
        this.policy = policy;
    }

    @PostMapping("/tracking/event")
    public ResponseEntity<Map<String, String>> event(HttpServletRequest request) {
        policy.requireAllowedOrigin(request);
        policy.requireJson(request);
        JsonNode body = JsonBodyCompatibilityFilter.parsedBody(request);
        tracking.createPublic(body, request);
        return ResponseEntity.status(201).body(Map.of("message", "Evento registrado."));
    }

    @GetMapping("/admin/tracking-events")
    public Map<String, Object> events(HttpServletRequest request) {
        Map<String, String> filters = AuditService.queryParameters(request);
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("events", tracking.list(filters));
        response.put("summary", tracking.summary(filters));
        return response;
    }

    @GetMapping("/admin/audit-log")
    public Map<String, Object> audit(HttpServletRequest request) {
        return Map.of("events", audit.list(AuditService.queryParameters(request)));
    }
}

package br.com.rodogarcia.cms.backend.controller;

import java.util.Map;

import br.com.rodogarcia.cms.backend.service.CmsReadinessService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final CmsReadinessService readiness;

    public HealthController(CmsReadinessService readiness) {
        this.readiness = readiness;
    }

    @GetMapping("/health")
    public Map<String, Boolean> health() {
        return Map.of("ok", true);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Boolean>> ready() {
        boolean ready = readiness.isReady();
        return ResponseEntity.status(ready ? 200 : 503).body(Map.of("ok", ready));
    }
}

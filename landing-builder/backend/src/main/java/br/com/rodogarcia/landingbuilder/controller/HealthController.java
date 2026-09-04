package br.com.rodogarcia.landingbuilder.controller;

import br.com.rodogarcia.landingbuilder.dto.response.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse(true);
    }
}

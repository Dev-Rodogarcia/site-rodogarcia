package br.com.rodogarcia.landingbuilder.controller;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public final class FallbackController {

    @RequestMapping("/**")
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> missing() {
        return Map.of("error", "Rota não encontrada.");
    }
}

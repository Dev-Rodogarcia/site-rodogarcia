package br.com.rodogarcia.site.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.dto.response.HealthResponse;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class HealthController {

    private final Path storageRoot;
    private final ExpressJsonResponse jsonResponse;

    public HealthController(ApplicationProperties properties, ExpressJsonResponse jsonResponse) {
        this.storageRoot = properties.storageRoot();
        this.jsonResponse = jsonResponse;
    }

    @RequestMapping(
        path = { "/health", "/health/" },
        method = { RequestMethod.GET, RequestMethod.HEAD }
    )
    public void health(HttpServletRequest request, HttpServletResponse response) throws IOException {
        jsonResponse.write(request, response, HttpServletResponse.SC_OK, new HealthResponse(true));
    }

    @RequestMapping(
        path = { "/ready", "/ready/" },
        method = { RequestMethod.GET, RequestMethod.HEAD }
    )
    public void ready(HttpServletRequest request, HttpServletResponse response) throws IOException {
        boolean ready = Files.isReadable(storageRoot) && Files.isWritable(storageRoot);
        jsonResponse.write(
            request,
            response,
            ready ? HttpServletResponse.SC_OK : HttpServletResponse.SC_SERVICE_UNAVAILABLE,
            new HealthResponse(ready)
        );
    }
}

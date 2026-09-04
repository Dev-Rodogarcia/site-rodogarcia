package br.com.rodogarcia.cms.backend.controller;

import br.com.rodogarcia.cms.backend.service.content.SeoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.NullNode;
import tools.jackson.databind.node.ObjectNode;

@RestController
public class SeoController {
    private final JsonMapper mapper;
    private final SeoService seo;

    public SeoController(JsonMapper mapper, SeoService seo) {
        this.mapper = mapper;
        this.seo = seo;
    }

    @GetMapping("/api/public/seo")
    public ObjectNode publicSeo(HttpServletRequest request) {
        String[] values = request.getParameterValues("path");
        String path = values != null && values.length == 1 ? values[0] : "/";
        ObjectNode response = mapper.createObjectNode();
        ObjectNode page = seo.publicPage(mapper.valueToTree(path));
        response.set("seo", page == null ? NullNode.getInstance() : page);
        return response;
    }

    @GetMapping("/api/admin/seo-settings")
    public ObjectNode settings() {
        return seo.readSettings();
    }

    @PostMapping(value = "/api/admin/seo-settings", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode update(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        ObjectNode settings = seo.update(request, body);
        ObjectNode response = mapper.createObjectNode();
        response.put("message", "SEO atualizado com sucesso.");
        settings.properties().forEach(entry -> response.set(entry.getKey(), entry.getValue().deepCopy()));
        return response;
    }
}

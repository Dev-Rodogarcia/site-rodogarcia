package br.com.rodogarcia.cms.backend.controller;

import br.com.rodogarcia.cms.backend.service.content.PublicContentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.node.ObjectNode;

@RestController
public class PublicContentController {
    private final PublicContentService content;

    public PublicContentController(PublicContentService content) {
        this.content = content;
    }

    @GetMapping("/api/public/content")
    public ObjectNode content() {
        return content.publicContent();
    }

    @GetMapping("/api/public/media-slots")
    public ObjectNode mediaSlots() {
        return content.publicMediaSlots();
    }
}

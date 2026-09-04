package br.com.rodogarcia.landingbuilder.controller;

import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import br.com.rodogarcia.landingbuilder.service.CampaignService;
import java.util.Map;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public final class PublicLandingsController {

    private final CampaignService campaigns;

    public PublicLandingsController(CampaignService campaigns) {
        this.campaigns = campaigns;
    }

    @RequestMapping(value = "/api/public/landings", method = {RequestMethod.GET, RequestMethod.HEAD})
    public Map<String, ArrayNode> list() {
        return Map.of("landings", campaigns.listPublishedIndex());
    }

    @RequestMapping(value = "/api/public/landings/{slug}", method = {RequestMethod.GET, RequestMethod.HEAD})
    public Map<String, ObjectNode> published(@PathVariable String slug) {
        return Map.of("landing", campaigns.getPublished(slug));
    }

    @RequestMapping(value = "/api/public/previews/{token}", method = {RequestMethod.GET, RequestMethod.HEAD})
    public Map<String, ObjectNode> preview(@PathVariable String token, HttpServletResponse response) {
        ObjectNode landing = campaigns.getPreview(token);
        response.setHeader("Cache-Control", "private, no-store");
        response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        return Map.of("landing", landing);
    }
}

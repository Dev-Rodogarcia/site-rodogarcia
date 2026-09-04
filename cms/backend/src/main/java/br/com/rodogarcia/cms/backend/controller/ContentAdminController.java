package br.com.rodogarcia.cms.backend.controller;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.security.AuthenticatedUser;
import br.com.rodogarcia.cms.backend.security.SecurityContext;
import br.com.rodogarcia.cms.backend.service.AuthService;
import br.com.rodogarcia.cms.backend.service.content.CmsContentService;
import br.com.rodogarcia.cms.backend.service.content.ContentAuditTrail;
import br.com.rodogarcia.cms.backend.service.content.UnitContentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@RestController
public class ContentAdminController {
    private final JsonMapper mapper;
    private final AuthService auth;
    private final CmsContentService content;
    private final UnitContentService units;
    private final ContentAuditTrail audit;

    public ContentAdminController(
        JsonMapper mapper,
        AuthService auth,
        CmsContentService content,
        UnitContentService units,
        ContentAuditTrail audit
    ) {
        this.mapper = mapper;
        this.auth = auth;
        this.content = content;
        this.units = units;
        this.audit = audit;
    }

    @GetMapping("/api/admin/content")
    public Map<String, Object> content(HttpServletRequest request) {
        return authenticatedEnvelope(request, "content", content.content());
    }

    @GetMapping("/api/admin/home")
    public Map<String, Object> home(HttpServletRequest request) {
        return authenticatedEnvelope(request, "homePage", content.home());
    }

    @PutMapping(value = "/api/admin/home/{section}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode updateHome(
        @PathVariable String section,
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        String key = switch (section.toLowerCase(Locale.ROOT)) {
            case "hero" -> "hero";
            case "section-1" -> "section1";
            case "section-2" -> "section2";
            case "section-3" -> "section3";
            case "regional-presence" -> "regionalPresence";
            case "tracking-cta" -> "trackingCta";
            case "social-proof" -> "socialProof";
            case "quick-actions" -> "quickActions";
            default -> throw new ApiException(404, "Recurso administrativo não encontrado.");
        };
        ObjectNode homePage = content.updateHome(key, body);
        audit.record(request, "content.home_update", "home:" + key, Map.of());
        return response("Home atualizada com sucesso.", "homePage", homePage);
    }

    @GetMapping("/api/admin/services-page")
    public Map<String, Object> services(HttpServletRequest request) {
        return authenticatedEnvelope(request, "servicesPage", content.services());
    }

    @PutMapping(value = "/api/admin/services-page/{section}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode updateServices(
        @PathVariable String section,
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        String key = switch (section.toLowerCase(Locale.ROOT)) {
            case "modules" -> "modules";
            case "final-cta" -> "finalCta";
            case "faq" -> "faq";
            default -> throw new ApiException(404, "Recurso administrativo não encontrado.");
        };
        ObjectNode servicesPage = content.updateServices(key, body);
        audit.record(request, "content.services_update", "services:" + key, Map.of());
        return response("Página Serviços atualizada com sucesso.", "servicesPage", servicesPage);
    }

    @GetMapping("/api/admin/pages/{pageKey}")
    public Map<String, Object> page(
        @PathVariable String pageKey,
        HttpServletRequest request
    ) {
        LinkedHashMap<String, Object> response = authenticatedEnvelope(request, "pageKey", pageKey);
        response.put("page", content.page(pageKey));
        return response;
    }

    @PutMapping(value = "/api/admin/pages/{pageKey}/{sectionKey}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode updatePage(
        @PathVariable String pageKey,
        @PathVariable String sectionKey,
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        ObjectNode page = content.updatePage(pageKey, sectionKey, body);
        audit.record(request, "content.page_update", pageKey + ":" + sectionKey, Map.of());
        ObjectNode response = mapper.createObjectNode();
        response.put("message", "Pagina atualizada com sucesso.");
        response.put("pageKey", pageKey);
        response.set("page", page);
        return response;
    }

    @GetMapping("/api/admin/footer-links")
    public Map<String, Object> footer(HttpServletRequest request) {
        return authenticatedEnvelope(request, "footerLinks", content.footer());
    }

    @PutMapping(value = "/api/admin/footer-links/{sectionKey}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode updateFooter(
        @PathVariable String sectionKey,
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        ObjectNode footerLinks = content.updateFooter(sectionKey, body);
        audit.record(request, "content.footer_links_update", "footer-links:" + sectionKey, Map.of());
        return response("FOOTER LINKS atualizado com sucesso.", "footerLinks", footerLinks);
    }

    @GetMapping("/api/admin/header-navigation")
    public Map<String, Object> navigation(HttpServletRequest request) {
        return authenticatedEnvelope(request, "headerNavigation", content.navigation());
    }

    @PutMapping(value = "/api/admin/header-navigation", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode updateNavigation(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        ObjectNode navigation = content.updateNavigation(body);
        audit.record(request, "content.header_navigation_update", "header-navigation", Map.of());
        return response("Navegação atualizada com sucesso.", "headerNavigation", navigation);
    }

    @GetMapping("/api/admin/site-texts")
    public Map<String, Object> siteTexts(HttpServletRequest request) {
        return authenticatedEnvelope(request, "siteTexts", content.siteTexts());
    }

    @PostMapping(value = "/api/admin/site-texts", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode updateSiteTexts(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        ObjectNode siteTexts = content.updateSiteTexts(body);
        String keys = body != null && body.isObject()
            ? String.join(", ", body.propertyNames()) : "";
        audit.record(request, "content.site_texts_update", "site-texts", Map.of("keys", keys));
        return response("Textos atualizados com sucesso.", "siteTexts", siteTexts);
    }

    @GetMapping("/api/admin/units")
    public ObjectNode units() {
        return arrayResponse("items", units.list());
    }

    @PostMapping(value = "/api/admin/units", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ObjectNode> createUnit(
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        UnitContentService.MutationResult result = units.create(body);
        audit.record(request, "content.create", "units", Map.of());
        ObjectNode response = response("Item criado com sucesso.", "item", result.item());
        response.set("items", result.items());
        return ResponseEntity.status(201).body(response);
    }

    @PostMapping(value = "/api/admin/units/reorder", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode reorderUnits(@RequestBody(required = false) JsonNode body) {
        JsonNode orderedIds = body != null && body.isObject() ? body.get("orderedIds") : null;
        return response("Ordem atualizada.", "items", units.reorder(orderedIds));
    }

    @PutMapping(value = "/api/admin/units/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode updateUnit(
        @PathVariable String id,
        @RequestBody(required = false) JsonNode body,
        HttpServletRequest request
    ) {
        UnitContentService.MutationResult result = units.update(id, body);
        audit.record(request, "content.update", "units:" + id, Map.of());
        ObjectNode response = response("Item atualizado com sucesso.", "item", result.item());
        response.set("items", result.items());
        return response;
    }

    @DeleteMapping("/api/admin/units/{id}")
    public ObjectNode deleteUnit(@PathVariable String id, HttpServletRequest request) {
        ArrayNode items = units.delete(id);
        audit.record(request, "content.delete", "units:" + id, Map.of());
        return response("Item removido com sucesso.", "items", items);
    }

    private LinkedHashMap<String, Object> authenticatedEnvelope(
        HttpServletRequest request,
        String key,
        Object value
    ) {
        AuthenticatedUser authenticated = SecurityContext.require(request);
        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("user", auth.publicUser(authenticated.user()));
        response.put("csrfToken", authenticated.session().getCsrfToken());
        response.put(key, value);
        return response;
    }

    private ObjectNode response(String message, String key, JsonNode value) {
        ObjectNode response = mapper.createObjectNode();
        response.put("message", message);
        response.set(key, value);
        return response;
    }

    private ObjectNode arrayResponse(String key, ArrayNode value) {
        ObjectNode response = mapper.createObjectNode();
        response.set(key, value);
        return response;
    }
}

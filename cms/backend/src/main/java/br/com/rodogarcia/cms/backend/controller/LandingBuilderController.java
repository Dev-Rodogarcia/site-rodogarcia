package br.com.rodogarcia.cms.backend.controller;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.service.AuditService;
import br.com.rodogarcia.cms.backend.service.LandingBuilderService;
import br.com.rodogarcia.cms.backend.validation.JsonBodyCompatibilityFilter;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Part;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/admin")
public class LandingBuilderController {

    private static final long MAX_MEDIA_REQUEST = 70L * 1024L * 1024L;
    private static final long MAX_MEDIA_FILE = 70L * 1024L * 1024L;
    private static final int MAX_MEDIA_FIELDS = 2;
    private static final int MAX_MEDIA_FIELD_BYTES = 1_000;
    private static final int MAX_MEDIA_PARTS = 3;
    private final LandingBuilderService builder;
    private final AuditService audit;
    private final RequestPolicy policy;

    public LandingBuilderController(
        LandingBuilderService builder,
        AuditService audit,
        RequestPolicy policy
    ) {
        this.builder = builder;
        this.audit = audit;
        this.policy = policy;
    }

    @GetMapping("/landings")
    public JsonNode list() {
        return builder.listPages();
    }

    @PostMapping("/landings")
    public ResponseEntity<JsonNode> create(
        HttpServletRequest request
    ) {
        JsonNode body = JsonBodyCompatibilityFilter.parsedBody(request);
        JsonNode result = builder.createPage(body);
        audit.record(request, "landing-builder.create", "landing", Map.of());
        return ResponseEntity.status(201).body(result);
    }

    @PutMapping("/landings/{id}")
    public JsonNode update(
        @PathVariable String id,
        HttpServletRequest request
    ) {
        JsonNode body = JsonBodyCompatibilityFilter.parsedBody(request);
        JsonNode result = builder.updatePage(id, body);
        audit.record(request, "landing-builder.update", id, Map.of());
        return result;
    }

    @PostMapping("/landings/{id}/publish")
    public JsonNode publish(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.publishPage(id, true);
        audit.record(request, "landing-builder.publish", id, Map.of());
        return result;
    }

    @PostMapping("/landings/{id}/unpublish")
    public JsonNode unpublish(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.publishPage(id, false);
        audit.record(request, "landing-builder.unpublish", id, Map.of());
        return result;
    }

    @GetMapping("/landings/{id}/preview")
    public JsonNode preview(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.preview(id);
        audit.record(request, "landing-builder.preview", id, Map.of());
        return result;
    }

    @PostMapping("/landings/{id}/duplicate")
    public ResponseEntity<JsonNode> duplicate(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.duplicatePage(id);
        audit.record(request, "landing-builder.duplicate", id, Map.of());
        return ResponseEntity.status(201).body(result);
    }

    @PostMapping("/landings/{id}/archive")
    public JsonNode archive(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.archivePage(id);
        audit.record(request, "landing-builder.archive", id, Map.of());
        return result;
    }

    @DeleteMapping("/landings/{id}")
    public JsonNode deleteLanding(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.deletePage(id);
        audit.record(request, "landing-builder.delete", id, Map.of());
        return result;
    }

    @PostMapping("/landings/{id}/schedule")
    public JsonNode schedule(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.schedulePage(id, JsonBodyCompatibilityFilter.parsedBody(request));
        audit.record(request, "landing-builder.schedule", id, Map.of());
        return result;
    }

    @GetMapping("/landings/{id}/revisions")
    public JsonNode revisions(@PathVariable String id) {
        return builder.revisions(id);
    }

    @PostMapping("/landings/{id}/revisions/{revisionId}/rollback")
    public JsonNode rollback(
        @PathVariable String id,
        @PathVariable String revisionId,
        HttpServletRequest request
    ) {
        JsonNode result = builder.rollback(id, revisionId);
        audit.record(request, "landing-builder.rollback", id, Map.of("revision", revisionId));
        return result;
    }

    @GetMapping("/landing-media")
    public JsonNode media() {
        return builder.listMedia();
    }

    @PostMapping("/landing-media")
    public ResponseEntity<JsonNode> upload(HttpServletRequest request) {
        policy.requireContentLength(request, MAX_MEDIA_REQUEST);
        LandingMediaUpload upload = landingMedia(request);
        MultipartFile file = upload.file();
        if (file == null) {
            throw new ApiException(422, "Selecione um arquivo de mídia.");
        }
        JsonNode result = builder.uploadMedia(file, upload.alt());
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        audit.record(request, "landing-builder.media_upload",
            name.substring(0, Math.min(name.length(), 120)), Map.of());
        return ResponseEntity.status(201).body(result);
    }

    @DeleteMapping("/landing-media/{id}")
    public JsonNode delete(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.deleteMedia(id);
        audit.record(request, "landing-builder.media_delete", id, Map.of());
        return result;
    }

    @PutMapping("/landing-media/{id}")
    public JsonNode updateMedia(@PathVariable String id, HttpServletRequest request) {
        JsonNode result = builder.updateMedia(id, JsonBodyCompatibilityFilter.parsedBody(request));
        audit.record(request, "landing-builder.media_update", id, Map.of());
        return result;
    }

    private static LandingMediaUpload landingMedia(HttpServletRequest request) {
        if (!(request instanceof MultipartHttpServletRequest multipart)) {
            return new LandingMediaUpload(null, "");
        }
        try {
            int fields = 0;
            int files = 0;
            MultipartFile selected = null;
            Collection<Part> parts = request.getParts();
            for (Part part : parts) {
                if (part.getSubmittedFileName() == null) {
                    fields++;
                    if (fields > MAX_MEDIA_FIELDS) {
                        throw new ApiException(422, "Too many fields");
                    }
                    if (part.getSize() >= MAX_MEDIA_FIELD_BYTES) {
                        throw new ApiException(422, "Field value too long");
                    }
                } else {
                    files++;
                    if (files > 1) throw new ApiException(422, "Too many files");
                    if (!part.getName().equals("file")) {
                        throw new ApiException(422, "Unexpected field");
                    }
                    if (part.getSize() >= MAX_MEDIA_FILE) {
                        throw new ApiException(413,
                            "Arquivo ou payload excede o limite permitido.");
                    }
                    selected = multipart.getFile("file");
                }
                if (fields + files >= MAX_MEDIA_PARTS) {
                    throw new ApiException(422, "Too many parts");
                }
            }
            String[] altValues = multipart.getParameterValues("alt");
            String alt = altValues != null && altValues.length == 1 ? altValues[0] : "";
            return new LandingMediaUpload(selected, alt);
        } catch (MaxUploadSizeExceededException error) {
            throw new ApiException(413, "Arquivo ou payload excede o limite permitido.");
        } catch (MultipartException | IOException | ServletException error) {
            throw new ApiException(500, "Erro interno no servidor.");
        }
    }

    private record LandingMediaUpload(MultipartFile file, String alt) { }
}

package br.com.rodogarcia.cms.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Path;
import java.util.Map;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.exception.GlobalExceptionHandler;
import br.com.rodogarcia.cms.backend.security.CorsCompatibilityFilter;
import br.com.rodogarcia.cms.backend.security.TrailingSlashCompatibilityFilter;
import br.com.rodogarcia.cms.backend.validation.RequestPolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.server.PathContainer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.StandaloneMockMvcBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.pattern.PathPatternParser;

class FallbackControllerTest {

    @TempDir
    Path root;

    private final MockMvc mvc = mvc(new FallbackController());

    @Test
    void returnsTheExpressAutomaticOptionsResponseForKnownPublicRoutes() throws Exception {
        MockMvc concreteMvc = mvc(new FallbackController(), new ConcreteRoutesController());

        concreteMvc.perform(options("/api/contact"))
            .andExpect(status().isOk())
            .andExpect(header().string("Allow", "GET, HEAD, POST"))
            .andExpect(header().string("Content-Type", "text/plain"))
            .andExpect(header().longValue("Content-Length", 15))
            .andExpect(content().string("GET, HEAD, POST"));

        concreteMvc.perform(options("/api/tracking/event"))
            .andExpect(status().isOk())
            .andExpect(header().string("Allow", "POST"))
            .andExpect(content().string("POST"));
    }

    @Test
    void keepsUnknownApiOptionsOnTheJsonNotFoundFallback() throws Exception {
        mvc.perform(options("/api/unknown"))
            .andExpect(status().isNotFound())
            .andExpect(content().json("{\"error\":\"Recurso não encontrado.\"}"));
    }

    @Test
    void doesNotShadowSpringAutomaticOptionsForOtherConcreteRoutes() throws Exception {
        MockMvc concreteMvc = mvc(new FallbackController(), new ConcreteGetController());

        concreteMvc.perform(options("/api/concrete"))
            .andExpect(status().isOk())
            .andExpect(header().string("Allow", "GET, HEAD"));
    }

    @Test
    void includesTheGenericEntityRoutesInAdminAutomaticOptions() throws Exception {
        MockMvc concreteMvc = mvc(new FallbackController(), new AdminConcreteRoutesController());

        concreteMvc.perform(options("/api/admin/content"))
            .andExpect(status().isOk())
            .andExpect(header().string("Allow", "GET, HEAD, POST"))
            .andExpect(content().string("GET, HEAD, POST"));

        concreteMvc.perform(options("/api/admin/home/hero"))
            .andExpect(status().isOk())
            .andExpect(header().string("Allow", "DELETE, PUT"))
            .andExpect(content().string("DELETE, PUT"));

        concreteMvc.perform(options("/api/admin/home/reorder"))
            .andExpect(status().isOk())
            .andExpect(header().string("Allow", "DELETE, POST, PUT"))
            .andExpect(content().string("DELETE, POST, PUT"));
    }

    @Test
    void distinguishesGenericEntityFallbackFromAnUnsupportedMethod() throws Exception {
        mvc.perform(post("/api/admin/content"))
            .andExpect(status().isNotFound())
            .andExpect(content().json("{\"error\":\"Recurso administrativo não encontrado.\"}"));

        mvc.perform(patch("/api/admin/content"))
            .andExpect(status().isNotFound())
            .andExpect(content().json("{\"error\":\"Recurso não encontrado.\"}"));
    }

    @Test
    void returnsJsonNotFoundForForbiddenOriginOptionsAndWrongMethodsOutsideApi() throws Exception {
        mvc.perform(options("/health"))
            .andExpect(status().isNotFound())
            .andExpect(content().json("{\"error\":\"Recurso não encontrado.\"}"));
        mvc.perform(options("/ready"))
            .andExpect(status().isNotFound());
        mvc.perform(options("/uploads/missing.webp"))
            .andExpect(status().isNotFound());
        mvc.perform(post("/health"))
            .andExpect(status().isNotFound());
    }

    @Test
    void preservesTheExactCorsOptionsMatrixBeforeMvcFallbacks() throws Exception {
        String allowedOrigin = "http://127.0.0.1:35180";
        RequestPolicy policy = new RequestPolicy(CmsProperties.from(Map.of(
            "FRONTEND_ORIGIN", allowedOrigin
        ), root.resolve("repo/cms/backend")));
        MockMvc corsMvc = builder(new FallbackController(), new ConcreteRoutesController())
            .addFilters(new CorsCompatibilityFilter(policy))
            .build();

        for (String path : new String[]{"/health", "/ready", "/uploads/missing.webp"}) {
            corsMvc.perform(options(path))
                .andExpect(status().isNoContent())
                .andExpect(content().bytes(new byte[0]));
            corsMvc.perform(options(path).header("Origin", allowedOrigin))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Access-Control-Allow-Origin", allowedOrigin));
            corsMvc.perform(options(path).header("Origin", "https://forbidden.example"))
                .andExpect(status().isNotFound())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        }

        corsMvc.perform(options("/api/public/content"))
            .andExpect(status().isNoContent());
        corsMvc.perform(options("/api/public/content").header("Origin", allowedOrigin))
            .andExpect(status().isNoContent());
        corsMvc.perform(options("/api/public/content")
                .header("Origin", "https://forbidden.example"))
            .andExpect(status().isOk())
            .andExpect(header().string("Allow", "GET, HEAD"))
            .andExpect(content().string("GET, HEAD"));
    }

    @Test
    void matchesRoutesIgnoringCaseButDoesNotStripSemicolonParameters() throws Exception {
        MockMvc concreteMvc = mvc(new FallbackController(), new SemicolonRoutesController());

        concreteMvc.perform(get("/API/CONTACT"))
            .andExpect(status().isOk());
        concreteMvc.perform(get("/api/contact;ignored=true"))
            .andExpect(status().isNotFound());
        concreteMvc.perform(get("/api/items/value;ignored=true"))
            .andExpect(status().isOk())
            .andExpect(content().string("value;ignored=true"));
    }

    private static MockMvc mvc(Object... controllers) {
        return builder(controllers).build();
    }

    private static StandaloneMockMvcBuilder builder(Object... controllers) {
        PathPatternParser parser = new PathPatternParser();
        parser.setCaseSensitive(false);
        parser.setPathOptions(PathContainer.Options.create('/', false));
        return MockMvcBuilders.standaloneSetup(controllers)
            .setControllerAdvice(new GlobalExceptionHandler())
            .addFilters(new TrailingSlashCompatibilityFilter())
            .setPatternParser(parser);
    }

    @RestController
    static class ConcreteGetController {
        @GetMapping("/api/concrete")
        void get() {
        }
    }

    @RestController
    static class ConcreteRoutesController {
        @GetMapping("/api/contact")
        void getContact() {
        }

        @PostMapping("/api/contact")
        void postContact() {
        }

        @PostMapping("/api/tracking/event")
        void track() {
        }

        @GetMapping("/api/public/content")
        void publicContent() {
        }
    }

    @RestController
    static class AdminConcreteRoutesController {
        @GetMapping("/api/admin/content")
        void content() {
        }

        @PutMapping("/api/admin/home/{section}")
        void home(@PathVariable String section) {
        }
    }

    @RestController
    static class SemicolonRoutesController {
        @GetMapping("/api/contact")
        void contact() {
        }

        @GetMapping("/api/items/{id}")
        String item(@PathVariable String id) {
            return id;
        }
    }
}

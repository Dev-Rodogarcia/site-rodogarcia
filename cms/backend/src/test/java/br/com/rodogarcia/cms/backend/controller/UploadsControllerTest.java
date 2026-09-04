package br.com.rodogarcia.cms.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.util.pattern.PathPatternParser;

class UploadsControllerTest {
    @TempDir
    Path root;

    private MockMvc mvc;
    private byte[] bytes;

    @BeforeEach
    void setUp() throws Exception {
        Map<String, String> environment = new LinkedHashMap<>();
        environment.put("NODE_ENV", "development");
        environment.put("CMS_STORAGE_ROOT", root.resolve("storage").toString());
        environment.put("CMS_UPLOADS_DIR", root.resolve("uploads").toString());
        CmsProperties properties = CmsProperties.from(
            environment, root.resolve("repo/cms/backend")
        );
        Files.createDirectories(properties.uploadsDir());
        bytes = "RIFFxxxxWEBPpayload".getBytes(StandardCharsets.US_ASCII);
        Files.write(properties.uploadsDir().resolve("hero.webp"), bytes);
        Files.createDirectories(properties.uploadsDir().resolve("gallery"));
        Files.writeString(
            properties.uploadsDir().resolve("gallery/index.html"),
            "<h1>Galeria</h1>",
            StandardCharsets.UTF_8
        );
        PathPatternParser parser = new PathPatternParser();
        parser.setCaseSensitive(false);
        mvc = MockMvcBuilders.standaloneSetup(new UploadsController(properties))
            .setControllerAdvice(new GlobalExceptionHandler())
            .setPatternParser(parser)
            .build();
    }

    @Test
    void servesImmutableMediaWithConditionalAndRangeHeaders() throws Exception {
        String etag = mvc.perform(get("/uploads/hero.webp"))
            .andExpect(status().isOk())
            .andExpect(content().bytes(bytes))
            .andExpect(content().contentType("image/webp"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(header().string("Cache-Control", "public, max-age=31536000, immutable"))
            .andExpect(header().string("Accept-Ranges", "bytes"))
            .andExpect(header().exists("ETag"))
            .andExpect(header().exists("Last-Modified"))
            .andReturn().getResponse().getHeader("ETag");

        mvc.perform(get("/uploads/hero.webp").header("If-None-Match", etag))
            .andExpect(status().isNotModified())
            .andExpect(content().bytes(new byte[0]));
        mvc.perform(get("/uploads/hero.webp")
                .header("If-Modified-Since", "Wed, 31 Dec 2099 23:59:59 GMT"))
            .andExpect(status().isNotModified())
            .andExpect(content().bytes(new byte[0]));
        mvc.perform(get("/uploads/hero.webp").header("Range", "bytes=0-3"))
            .andExpect(status().isPartialContent())
            .andExpect(header().string("Content-Range", "bytes 0-3/" + bytes.length))
            .andExpect(content().bytes("RIFF".getBytes(StandardCharsets.US_ASCII)));
        mvc.perform(head("/uploads/hero.webp"))
            .andExpect(status().isOk())
            .andExpect(header().longValue("Content-Length", bytes.length))
            .andExpect(content().bytes(new byte[0]));
    }

    @Test
    void preservesExpressDirectoryIndexAndTrailingSlashBehavior() throws Exception {
        String redirect = "<!DOCTYPE html>\n"
            + "<html lang=\"en\">\n"
            + "<head>\n"
            + "<meta charset=\"utf-8\">\n"
            + "<title>Redirecting</title>\n"
            + "</head>\n"
            + "<body>\n"
            + "<pre>Redirecting to /uploads/gallery/?view=all&amp;sort=name</pre>\n"
            + "</body>\n"
            + "</html>\n";
        mvc.perform(get("/uploads/gallery").queryParam("view", "all").queryParam("sort", "name"))
            .andExpect(status().isMovedPermanently())
            .andExpect(header().string("Location", "/uploads/gallery/?view=all&sort=name"))
            .andExpect(header().string("Content-Security-Policy", "default-src 'none'"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(content().contentType("text/html;charset=UTF-8"))
            .andExpect(content().string(redirect));
        mvc.perform(get("/uploads/gallery/"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("text/html;charset=utf-8"))
            .andExpect(content().string("<h1>Galeria</h1>"));
        mvc.perform(get("/uploads/hero.webp/"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("Recurso não encontrado."));
        mvc.perform(get("/uploads//hero.webp"))
            .andExpect(status().isOk())
            .andExpect(content().bytes(bytes));
        mvc.perform(get("/UPLOADS/hero.webp"))
            .andExpect(status().isOk())
            .andExpect(content().bytes(bytes));
    }

    @Test
    void preservesStaticPreconditionAndUnsatisfiableRangeQuirks() throws Exception {
        mvc.perform(get("/uploads/hero.webp").header("If-Match", "\"different\""))
            .andExpect(status().isInternalServerError())
            .andExpect(content().contentType("image/webp"))
            .andExpect(content().json("{\"error\":\"Erro interno no servidor.\"}"));
        mvc.perform(get("/uploads/hero.webp")
                .header("If-Unmodified-Since", "Thu, 01 Jan 1970 00:00:00 GMT"))
            .andExpect(status().isInternalServerError())
            .andExpect(content().json("{\"error\":\"Erro interno no servidor.\"}"));
        mvc.perform(get("/uploads/hero.webp").header("Range", "bytes=999999-"))
            .andExpect(status().isInternalServerError())
            .andExpect(header().string("Content-Range", "bytes */" + bytes.length))
            .andExpect(header().string("Cache-Control", "public, max-age=31536000, immutable"))
            .andExpect(content().json("{\"error\":\"Erro interno no servidor.\"}"));
    }

    @Test
    void missingOrPrivatePathsFallThroughToJson404() throws Exception {
        mvc.perform(get("/uploads/missing.webp"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("Recurso não encontrado."));
        mvc.perform(get("/uploads/.private.json"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("Recurso não encontrado."));
    }
}

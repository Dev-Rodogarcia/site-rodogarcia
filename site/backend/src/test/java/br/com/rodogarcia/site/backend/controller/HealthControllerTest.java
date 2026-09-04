package br.com.rodogarcia.site.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Path;
import java.util.Map;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.json.JsonMapper;

class HealthControllerTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void healthIsAlwaysOkAndHeadKeepsTheGetContentLength() throws Exception {
        MockMvc mockMvc = controllerFor(temporaryDirectory);

        mockMvc.perform(get("/health"))
            .andExpect(status().isOk())
            .andExpect(content().string("{\"ok\":true}"));
        mockMvc.perform(head("/health"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Length", "11"))
            .andExpect(content().string(""));
    }

    @Test
    void readyChecksReadAndWriteAccessWithoutCreatingStorage() throws Exception {
        Path missingStorage = temporaryDirectory.resolve("missing-storage");
        MockMvc mockMvc = controllerFor(missingStorage);

        mockMvc.perform(get("/ready"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(content().string("{\"ok\":false}"));
    }

    @Test
    void readySucceedsForAnAccessibleStorageRootAndAcceptsTrailingSlash() throws Exception {
        MockMvc mockMvc = controllerFor(temporaryDirectory);

        mockMvc.perform(get("/ready/"))
            .andExpect(status().isOk())
            .andExpect(content().string("{\"ok\":true}"));
    }

    private MockMvc controllerFor(Path storageRoot) {
        Path backendRoot = temporaryDirectory.resolve("site").resolve("backend");
        ApplicationProperties properties = ApplicationProperties.from(
            Map.of("STORAGE_ROOT", storageRoot.toAbsolutePath().toString()),
            backendRoot
        );
        ExpressJsonResponse jsonResponse = new ExpressJsonResponse(JsonMapper.builder().build());
        return MockMvcBuilders.standaloneSetup(new HealthController(properties, jsonResponse)).build();
    }
}

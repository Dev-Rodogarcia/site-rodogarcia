package br.com.rodogarcia.cms.backend.service.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.node.StringNode;

class FilesystemContentMediaValidatorTest {

    @TempDir
    Path root;

    @Test
    void resolvesPublicMediaAgainstTheExplicitAbsoluteHardeningFixture() throws Exception {
        Path publicFixture = root.resolve("public-fixture").toAbsolutePath().normalize();
        Path uploadsFixture = root.resolve("uploads-fixture").toAbsolutePath().normalize();
        Files.createDirectories(publicFixture);
        Files.createDirectories(uploadsFixture);
        Files.write(publicFixture.resolve("hero.webp"), new byte[] {1});

        CmsProperties properties = CmsProperties.from(
            Map.of(
                "FRONTEND_PUBLIC_DIR", publicFixture.toString(),
                "CMS_UPLOADS_DIR", uploadsFixture.toString()
            ),
            root.resolve("repo/cms/backend")
        );
        FilesystemContentMediaValidator validator = new FilesystemContentMediaValidator(properties);

        assertThat(validator.media(StringNode.valueOf("/hero.webp"), "Mídia do conteúdo"))
            .isEqualTo("/hero.webp");
        assertThat(properties.frontendPublicDir()).isEqualTo(publicFixture);
    }
}

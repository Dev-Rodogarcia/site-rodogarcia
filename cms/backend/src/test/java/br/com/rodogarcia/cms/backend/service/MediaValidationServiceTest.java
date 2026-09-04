package br.com.rodogarcia.cms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;

import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.support.MediaTestContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MediaValidationServiceTest {
    @TempDir
    Path root;

    @Test
    void acceptsOnlyExistingInternalMediaOfTheExpectedKind() throws Exception {
        MediaTestContext context = new MediaTestContext(root, Clock.systemUTC());
        Path uploads = context.properties.uploadsDir();
        Files.createDirectories(uploads);
        Files.writeString(uploads.resolve("hero.webp"), "webp");
        Files.writeString(uploads.resolve("movie.mp4"), "video");

        assertThat(context.validation.assertInternal(
            "/uploads/hero.webp", MediaValidationService.Kind.IMAGE, true, "Imagem"
        )).isEqualTo("/uploads/hero.webp");
        assertThatThrownBy(() -> context.validation.assertInternal(
            "https://cdn.example.com/hero.webp", MediaValidationService.Kind.IMAGE, true, "Imagem"
        )).isInstanceOf(ApiException.class).hasMessageContaining("arquivos internos");
        assertThatThrownBy(() -> context.validation.assertInternal(
            "data:image/png;base64,AAAA", MediaValidationService.Kind.IMAGE, true, "Imagem"
        )).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> context.validation.assertInternal(
            "/uploads/movie.mp4", MediaValidationService.Kind.IMAGE, true, "Imagem"
        )).isInstanceOf(ApiException.class).hasMessageContaining("tipo de arquivo incompatível");
        assertThatThrownBy(() -> context.validation.assertInternal(
            "/uploads/../private/users.json", MediaValidationService.Kind.IMAGE, true, "Imagem"
        )).isInstanceOf(ApiException.class);
    }

    @Test
    void keepsPublicAliasCompatibility() throws Exception {
        MediaTestContext context = new MediaTestContext(root, Clock.systemUTC());
        Files.createDirectories(context.properties.frontendPublicDir().resolve("brand"));
        Files.writeString(context.properties.frontendPublicDir().resolve("brand/logo.webp"), "webp");
        assertThat(context.validation.assertInternal(
            "/public/brand/logo.webp", MediaValidationService.Kind.IMAGE, true, "Imagem"
        )).isEqualTo("/brand/logo.webp");
    }
}

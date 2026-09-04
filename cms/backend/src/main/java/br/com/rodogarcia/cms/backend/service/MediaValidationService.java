package br.com.rodogarcia.cms.backend.service;

import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.exception.ApiException;
import br.com.rodogarcia.cms.backend.model.content.ContentJson;
import br.com.rodogarcia.cms.backend.utils.Sanitizers;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.StringNode;

@Service
public final class MediaValidationService {
    public enum Kind { IMAGE, VIDEO, ALL }

    public static final Set<String> IMAGE_EXTENSIONS = Set.of(
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"
    );
    public static final Set<String> VIDEO_EXTENSIONS = Set.of(".mp4", ".webm", ".ogg");
    public static final Set<String> MEDIA_EXTENSIONS = Set.of(
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif",
        ".mp4", ".webm", ".ogg"
    );

    private final Path uploadsRoot;
    private final Path publicRoot;

    public MediaValidationService(CmsProperties properties) {
        this.uploadsRoot = properties.uploadsDir().toAbsolutePath().normalize();
        this.publicRoot = properties.frontendPublicDir().toAbsolutePath().normalize();
    }

    public String assertInternal(JsonNode value, Kind kind, boolean required, String label) {
        String raw = Sanitizers.text(value, 600);
        String url = normalize(value);
        if (url.isEmpty()) {
            if (!raw.isEmpty()) {
                throw new ApiException(422, label + ": use somente arquivos internos da biblioteca de mídia.");
            }
            if (required) {
                throw new ApiException(422, label + ": selecione uma mídia da biblioteca.");
            }
            return "";
        }
        if (!matches(url, kind)) {
            throw new ApiException(422, label + ": tipo de arquivo incompatível com o campo.");
        }
        if (!isKnown(url, kind)) {
            throw new ApiException(422, label + ": use somente arquivos internos da biblioteca de mídia.");
        }
        return url;
    }

    public String assertInternal(String value, Kind kind, boolean required, String label) {
        return assertInternal(StringNode.valueOf(value == null ? "" : value), kind, required, label);
    }

    public String normalize(JsonNode value) {
        String raw = Sanitizers.text(value, 600);
        if (raw.isEmpty() || ContentJson.hasScheme(raw)) return "";
        String candidate = raw.startsWith("/public/")
            ? raw.substring("/public".length())
            : raw;
        return Sanitizers.path(StringNode.valueOf(candidate));
    }

    public String normalize(String value) {
        return normalize(StringNode.valueOf(value == null ? "" : value));
    }

    public boolean isKnown(String raw, Kind kind) {
        String url = normalize(raw);
        if (url.isEmpty() || !matches(url, kind)) return false;
        try {
            Path root = url.startsWith("/uploads/") ? uploadsRoot : publicRoot;
            String relative = url.startsWith("/uploads/")
                ? url.substring("/uploads/".length())
                : url.substring(1);
            Path resolved = root.resolve(relative).toAbsolutePath().normalize();
            return !resolved.equals(root) && resolved.startsWith(root) && Files.isRegularFile(resolved);
        } catch (InvalidPathException | SecurityException ignored) {
            return false;
        }
    }

    public static boolean matches(String url, Kind kind) {
        String extension = extension(url);
        return switch (kind) {
            case IMAGE -> IMAGE_EXTENSIONS.contains(extension);
            case VIDEO -> VIDEO_EXTENSIONS.contains(extension);
            case ALL -> MEDIA_EXTENSIONS.contains(extension);
        };
    }

    public static String extension(String value) {
        int slash = value.lastIndexOf('/');
        int dot = value.lastIndexOf('.');
        return dot > slash ? value.substring(dot).toLowerCase(Locale.ROOT) : "";
    }
}

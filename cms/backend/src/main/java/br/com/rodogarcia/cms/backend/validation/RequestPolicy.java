package br.com.rodogarcia.cms.backend.validation;

import java.net.URI;
import java.util.regex.Pattern;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import br.com.rodogarcia.cms.backend.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class RequestPolicy {

    private static final Pattern DEV_TUNNEL = Pattern.compile(
        "^[a-z0-9-]+-\\d+\\.[a-z0-9-]+\\.devtunnels\\.ms$",
        Pattern.CASE_INSENSITIVE
    );

    private final CmsProperties properties;

    public RequestPolicy(CmsProperties properties) {
        this.properties = properties;
    }

    public void requireAllowedOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (!isAllowedOrigin(origin)) throw new ApiException(403, "Origem não autorizada.");
    }

    public boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isBlank()) return false;
        if (properties.allowedOrigins().contains(origin)) return true;
        if (properties.production()) return false;
        try {
            URI parsed = URI.create(origin);
            return "https".equalsIgnoreCase(parsed.getScheme())
                && parsed.getHost() != null
                && DEV_TUNNEL.matcher(parsed.getHost()).matches();
        } catch (IllegalArgumentException ignored) {
            return false;
        }
    }

    public void requireJson(HttpServletRequest request) {
        String contentType = request.getContentType();
        String mediaType = contentType == null ? "" : contentType.split(";", 2)[0].trim();
        if (!mediaType.equalsIgnoreCase("application/json")) {
            throw new ApiException(415, "Content-Type deve ser application/json.");
        }
    }

    public void requireContentLength(HttpServletRequest request, long maxBytes) {
        String raw = request.getHeader("Content-Length");
        if (raw == null || raw.isBlank()) return;
        try {
            long value = Long.parseLong(raw);
            if (value < 0) throw new NumberFormatException();
            if (value > maxBytes) {
                throw new ApiException(413, "Arquivo ou payload excede o limite permitido.");
            }
        } catch (NumberFormatException ignored) {
            throw new ApiException(400, "Content-Length inválido.");
        }
    }
}

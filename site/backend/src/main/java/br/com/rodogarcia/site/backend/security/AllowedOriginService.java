package br.com.rodogarcia.site.backend.security;

import java.util.regex.Pattern;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.config.WhatwgUrlCompatibility;
import org.springframework.stereotype.Service;

@Service
public class AllowedOriginService {

    private static final Pattern DEV_TUNNEL = Pattern.compile(
        "^[a-z0-9-]+-\\d+\\.[a-z0-9-]+\\.devtunnels\\.ms$",
        Pattern.CASE_INSENSITIVE
    );

    private final ApplicationProperties properties;

    public AllowedOriginService(ApplicationProperties properties) {
        this.properties = properties;
    }

    public boolean isAllowed(String origin) {
        return origin != null
            && !origin.isEmpty()
            && (properties.allowedOrigins().contains(origin) || isDevelopmentDevTunnel(origin));
    }

    private boolean isDevelopmentDevTunnel(String origin) {
        if (properties.production()) {
            return false;
        }
        try {
            WhatwgUrlCompatibility.ParsedUrl url = WhatwgUrlCompatibility.parse(origin);
            return url.protocol().equals("https:")
                && DEV_TUNNEL.matcher(url.hostname()).matches();
        } catch (IllegalArgumentException ignored) {
            return false;
        }
    }
}

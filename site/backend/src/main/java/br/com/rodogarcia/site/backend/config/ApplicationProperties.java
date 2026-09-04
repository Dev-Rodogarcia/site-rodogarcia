package br.com.rodogarcia.site.backend.config;

import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public record ApplicationProperties(
    String nodeEnv,
    String host,
    int port,
    Path projectRoot,
    Path backendRoot,
    Path repoRoot,
    Path storageRoot,
    Path rateLimitsStorePath,
    String frontendOrigin,
    Set<String> allowedOrigins,
    TrustProxySetting trustProxy,
    String eslTenant,
    String eslGraphqlUrl,
    String eslGraphqlApiKey,
    String eslOperationSecret,
    boolean production
) {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static ApplicationProperties load() {
        Path projectRoot = detectProjectRoot();
        Path repoRoot = projectRoot.resolve("..").resolve("..").normalize().toAbsolutePath();
        Map<String, String> processEnvironment = System.getenv();
        Path envFile = repoRoot.resolve(".env");

        Map<String, String> merged = new LinkedHashMap<>(EnvironmentFileLoader.read(envFile));
        merged.putAll(processEnvironment);
        return from(merged, projectRoot);
    }

    public static ApplicationProperties from(Map<String, String> environment, Path projectRoot) {
        Path absoluteProjectRoot = projectRoot.toAbsolutePath().normalize();
        Path backendRoot = absoluteProjectRoot;
        Path repoRoot = absoluteProjectRoot.resolve("..").resolve("..").normalize();
        String nodeEnv = valueOrDefault(environment.get("NODE_ENV"), "development");
        boolean production = nodeEnv.equals("production");
        String host = valueOrDefault(environment.get("HOST"), "127.0.0.1");
        int port = portEnvironment(environment.get("PORT"), 31012);
        String frontendOrigin = environment.containsKey("FRONTEND_ORIGIN")
            ? environment.get("FRONTEND_ORIGIN")
            : "http://127.0.0.1:35180";
        String alternateFrontendOrigin = frontendOrigin.contains("127.0.0.1")
            ? frontendOrigin.replace("127.0.0.1", "localhost")
            : frontendOrigin.replace("localhost", "127.0.0.1");
        List<String> extraOrigins = commaSeparated(environment.get("CORS_ORIGINS"));
        String eslTenant = normalizeEslTenant(environment.get("ESL_TENANT"));
        String rawOperationSecret = trimToEmpty(environment.get("ESL_OPERATION_SECRET"));
        String operationSecret = rawOperationSecret.isEmpty() ? randomSecret() : rawOperationSecret;

        if (production) {
            List<String> errors = new ArrayList<>();
            validateHttpsOrigin("FRONTEND_ORIGIN", frontendOrigin, errors);
            for (int index = 0; index < extraOrigins.size(); index++) {
                validateHttpsOrigin("CORS_ORIGINS[" + index + "]", extraOrigins.get(index), errors);
            }
            if (isWeakSecret(rawOperationSecret)) {
                errors.add("ESL_OPERATION_SECRET deve ter pelo menos 32 caracteres fortes.");
            }
            if (!errors.isEmpty()) {
                throw new IllegalStateException(
                    "Configuração de produção insegura: " + String.join(" ", errors)
                );
            }
        }

        LinkedHashSet<String> allowedOrigins = new LinkedHashSet<>();
        allowedOrigins.add(frontendOrigin);
        if (!production) {
            allowedOrigins.add(alternateFrontendOrigin);
            allowedOrigins.add("http://" + host + ":" + port);
        }
        allowedOrigins.addAll(extraOrigins);

        String storageOverride = environment.get("STORAGE_ROOT");
        Path storageRoot = storageOverride == null
            ? backendRoot.resolve("storage")
            : resolveAgainst(backendRoot, storageOverride);
        String rateLimitOverride = environment.get("RATE_LIMITS_STORE_PATH");
        Path rateLimitsStorePath = rateLimitOverride == null || rateLimitOverride.isEmpty()
            ? storageRoot.resolve("private").resolve("rate-limits.json")
            : resolveAgainst(backendRoot, rateLimitOverride);

        return new ApplicationProperties(
            nodeEnv,
            host,
            port,
            absoluteProjectRoot,
            backendRoot,
            repoRoot,
            storageRoot.normalize(),
            rateLimitsStorePath.normalize(),
            frontendOrigin,
            Set.copyOf(allowedOrigins),
            TrustProxySetting.parse(environment.get("TRUST_PROXY")),
            eslTenant,
            resolveEslGraphqlUrl(eslTenant, environment.get("ESL_GRAPHQL_URL")),
            trimToEmpty(environment.get("GRAPHQL_API_KEY")),
            operationSecret,
            production
        );
    }

    private static Path detectProjectRoot() {
        try {
            Path location = Path.of(ApplicationProperties.class.getProtectionDomain()
                .getCodeSource().getLocation().toURI()).toAbsolutePath().normalize();
            Path target = java.nio.file.Files.isDirectory(location) ? location.getParent() : location.getParent();
            if (target != null && target.getFileName() != null
                && (target.getFileName().toString().equals("target")
                    || target.getFileName().toString().startsWith("dist"))) {
                return target.getParent().toAbsolutePath().normalize();
            }
        } catch (Exception ignored) {
            // O cwd continua sendo o contrato de fallback dos scripts e do PM2.
        }
        return Path.of("").toAbsolutePath().normalize();
    }

    private static Path resolveAgainst(Path base, String value) {
        Path path = Path.of(value);
        return (path.isAbsolute() ? path : base.resolve(path)).toAbsolutePath().normalize();
    }

    private static String valueOrDefault(String value, String fallback) {
        return value == null ? fallback : value;
    }

    private static int portEnvironment(String value, int fallback) {
        if (value == null) {
            return fallback;
        }
        double parsed = JavascriptNumber.parse(value);
        if (!Double.isFinite(parsed)) {
            return fallback;
        }
        if (parsed < 0 || parsed > 65_535 || parsed != Math.rint(parsed)) {
            throw new IllegalArgumentException("PORT precisa ser um inteiro entre 0 e 65535.");
        }
        return (int) parsed;
    }

    private static List<String> commaSeparated(String value) {
        if (value == null) {
            return List.of();
        }
        return java.util.Arrays.stream(value.split(","))
            .map(JavascriptNumber::trim)
            .filter(item -> !item.isEmpty())
            .toList();
    }

    private static String trimToEmpty(String value) {
        return value == null ? "" : JavascriptNumber.trim(value);
    }

    private static String normalizeEslTenant(String value) {
        String tenant = trimToEmpty(value).toLowerCase(Locale.ROOT);
        if (tenant.isEmpty()) {
            tenant = "rodogarcia";
        }
        return tenant.matches("[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?")
            ? tenant
            : "rodogarcia";
    }

    private static String resolveEslGraphqlUrl(String tenant, String override) {
        String value = trimToEmpty(override);
        if (value.isEmpty()) {
            return "https://" + tenant + ".eslcloud.com.br/graphql";
        }
        try {
            WhatwgUrlCompatibility.ParsedUrl url = WhatwgUrlCompatibility.parse(value);
            return url.protocol().equals("https:") ? url.serialized() : "";
        } catch (IllegalArgumentException ignored) {
            return "";
        }
    }

    private static void validateHttpsOrigin(String name, String origin, List<String> errors) {
        try {
            WhatwgUrlCompatibility.ParsedUrl url = WhatwgUrlCompatibility.parse(origin);
            if (!url.protocol().equals("https:")) {
                errors.add(name + " deve usar HTTPS em produção.");
            }
            if (Set.of("localhost", "127.0.0.1", "0.0.0.0", "::1")
                .contains(url.hostname().toLowerCase(Locale.ROOT))) {
                errors.add(name + " não pode apontar para localhost em produção.");
            }
        } catch (IllegalArgumentException ignored) {
            errors.add(name + " deve ser uma origem absoluta válida.");
        }
    }

    private static boolean isWeakSecret(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        return value.length() < 32
            || normalized.contains("altere-para")
            || normalized.contains("change-this")
            || normalized.contains("dev-only");
    }

    private static String randomSecret() {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

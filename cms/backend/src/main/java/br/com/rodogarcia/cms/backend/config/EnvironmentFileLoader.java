package br.com.rodogarcia.cms.backend.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class EnvironmentFileLoader {

    private static final Pattern LINE = Pattern.compile(
        "^\\s*(?:export\\s+)?([\\w.-]+)(?:\\s*=\\s*?|:\\s+?)"
            + "(\\s*'(?:\\\\'|[^'])*'|\\s*\"(?:\\\\\"|[^\"])*\"|"
            + "\\s*`(?:\\\\`|[^`])*`|[^#\\r\\n]+)?\\s*(?:#.*)?$",
        Pattern.MULTILINE
    );

    private EnvironmentFileLoader() {
    }

    static Map<String, String> read(Path file) {
        if (file == null || !Files.isRegularFile(file)) {
            return Map.of();
        }
        try {
            String source = Files.readString(file, StandardCharsets.UTF_8)
                .replace("\r\n", "\n")
                .replace('\r', '\n');
            if (!source.isEmpty() && source.charAt(0) == '\uFEFF') {
                source = source.substring(1);
            }
            Map<String, String> values = new LinkedHashMap<>();
            Matcher matcher = LINE.matcher(source);
            while (matcher.find()) {
                values.put(matcher.group(1), dotenvValue(matcher.group(2)));
            }
            return values;
        } catch (IOException ignored) {
            return Map.of();
        }
    }

    private static String dotenvValue(String captured) {
        String value = captured == null ? "" : captured.trim();
        char quote = value.isEmpty() ? '\0' : value.charAt(0);
        if (value.length() >= 2
            && (quote == '"' || quote == '\'' || quote == '`')
            && value.charAt(value.length() - 1) == quote) {
            value = value.substring(1, value.length() - 1);
        }
        return quote == '"'
            ? value.replace("\\n", "\n").replace("\\r", "\r")
            : value;
    }
}

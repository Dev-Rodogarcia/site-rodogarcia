package br.com.rodogarcia.site.backend.service;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;

import br.com.rodogarcia.site.backend.config.TomcatWireCompatibility;
import br.com.rodogarcia.site.backend.utils.NodeCompatibleJsonBytes;
import br.com.rodogarcia.site.backend.utils.NodeRequestHeaders;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@Component
public class ExpressJsonResponse {

    private static final String JSON_CONTENT_TYPE = "application/json; charset=utf-8";
    private static final Pattern REQUEST_NO_CACHE = Pattern.compile(
        "(?:^|,)\\s*?no-cache\\s*?(?:,|$)"
    );

    private final JsonMapper jsonMapper;

    public ExpressJsonResponse(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public void write(
        HttpServletRequest request,
        HttpServletResponse response,
        int status,
        Object payload
    ) throws IOException {
        byte[] body;
        try {
            body = NodeCompatibleJsonBytes.normalize(jsonMapper.writeValueAsBytes(payload));
        } catch (JacksonException error) {
            throw new IOException("Não foi possível serializar a resposta JSON.", error);
        }

        String etag = weakEtag(body);
        response.setStatus(status);
        TomcatWireCompatibility.setLiteralContentType(
            request,
            response,
            JSON_CONTENT_TYPE
        );
        response.setHeader("ETag", etag);
        response.setContentLengthLong(body.length);

        if (isFresh(request, status, etag)) {
            response.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
            TomcatWireCompatibility.removeContentType(request, response);
            response.setHeader("Content-Length", null);
            return;
        }

        if (!"HEAD".equalsIgnoreCase(request.getMethod())) {
            response.getOutputStream().write(body);
        }
    }

    private static boolean isFresh(HttpServletRequest request, int status, String etag) {
        if (!("GET".equalsIgnoreCase(request.getMethod()) || "HEAD".equalsIgnoreCase(request.getMethod()))) {
            return false;
        }
        if (!((status >= 200 && status < 300) || status == HttpServletResponse.SC_NOT_MODIFIED)) {
            return false;
        }
        String ifNoneMatch = NodeRequestHeaders.commaJoined(request, "If-None-Match");
        if (ifNoneMatch == null || ifNoneMatch.isBlank()) {
            return false;
        }
        String cacheControl = NodeRequestHeaders.commaJoined(request, "Cache-Control");
        if (cacheControl != null && REQUEST_NO_CACHE.matcher(cacheControl).find()) {
            return false;
        }
        if (ifNoneMatch.equals("*")) {
            return true;
        }
        for (String match : parseTokenList(ifNoneMatch)) {
            if (match.equals(etag)
                || ("W/" + match).equals(etag)
                || match.equals("W/" + etag)) {
                return true;
            }
        }
        return false;
    }

    /** Tradução literal do parser ASCII do pacote fresh 2 usado pelo Express. */
    private static List<String> parseTokenList(String value) {
        int end = 0;
        int start = 0;
        List<String> result = new ArrayList<>();
        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            if (current == ' ') {
                if (start == end) {
                    start = index + 1;
                    end = index + 1;
                }
            } else if (current == ',') {
                result.add(value.substring(start, end));
                start = index + 1;
                end = index + 1;
            } else {
                end = index + 1;
            }
        }
        result.add(value.substring(start, end));
        return result;
    }

    static String weakEtag(byte[] body) {
        try {
            String digest = Base64.getEncoder().encodeToString(
                MessageDigest.getInstance("SHA-1").digest(body)
            );
            String hash = digest.substring(0, Math.min(27, digest.length()));
            return "W/\"" + Integer.toHexString(body.length) + "-" + hash + "\"";
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-1 indisponível na JVM.", error);
        }
    }

    public byte[] serialize(Object payload) {
        try {
            return NodeCompatibleJsonBytes.normalize(
                jsonMapper.writeValueAsBytes(payload)
            );
        } catch (JacksonException error) {
            throw new IllegalStateException("Não foi possível serializar JSON.", error);
        }
    }
}

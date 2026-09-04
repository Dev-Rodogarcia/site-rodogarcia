package br.com.rodogarcia.site.backend.validation;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;
import java.util.zip.InflaterInputStream;

import br.com.rodogarcia.site.backend.dto.response.ApiErrorResponse;
import br.com.rodogarcia.site.backend.config.JavascriptNumber;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import br.com.rodogarcia.site.backend.utils.NodeRequestHeaders;
import br.com.rodogarcia.site.backend.utils.NodeTextDecoder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.brotli.dec.BrotliInputStream;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

public class JsonBodyCompatibilityFilter extends OncePerRequestFilter {

    public static final int MAX_JSON_BYTES = 2 * 1024 * 1024;
    private static final Pattern TOKEN = Pattern.compile("[!#$%&'*+.^_`|~0-9A-Za-z-]+");
    private static final Pattern MEDIA_TYPE = Pattern.compile(
        "[!#$%&'*+.^_`|~0-9A-Za-z-]+/[!#$%&'*+.^_`|~0-9A-Za-z-]+"
    );

    private final JsonMapper jsonMapper;
    private final ExpressJsonResponse jsonResponse;

    public JsonBodyCompatibilityFilter(JsonMapper jsonMapper, ExpressJsonResponse jsonResponse) {
        this.jsonMapper = jsonMapper;
        this.jsonResponse = jsonResponse;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        if (!hasBody(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (request.getContentType() == null) {
                filterChain.doFilter(request, response);
                return;
            }
            ParsedContentType contentType = parseContentType(request.getContentType());
            if (!contentType.type().equals("application/json")) {
                filterChain.doFilter(request, response);
                return;
            }
            byte[] bytes = readLimited(request);
            JsonNode body = bytes.length == 0
                ? jsonMapper.createObjectNode()
                : parseBody(bytes, contentType.charset());
            if (!body.isObject() && !body.isArray()) {
                throw new IOException("O parser JSON estrito aceita somente objeto ou array.");
            }
            request.setAttribute(ParsedJsonBody.ATTRIBUTE, body);
            filterChain.doFilter(request, response);
        } catch (Exception ignored) {
            if (!response.isCommitted()) {
                jsonResponse.write(
                    request,
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    new ApiErrorResponse("Erro interno no servidor.")
                );
            }
        }
    }

    public static boolean isJson(String contentType) {
        return contentType != null && parseContentType(contentType).type().equals("application/json");
    }

    public static boolean hasBody(HttpServletRequest request) {
        if (request.getHeader("Transfer-Encoding") != null) {
            return true;
        }
        String contentLength = request.getHeader("Content-Length");
        return contentLength != null && !Double.isNaN(JavascriptNumber.parse(contentLength));
    }

    private static byte[] readLimited(HttpServletRequest request) throws IOException {
        String contentEncoding = NodeRequestHeaders.commaJoined(request, "Content-Encoding");
        String encoding = contentEncoding == null ? "identity" : contentEncoding.toLowerCase(Locale.ROOT);
        if (encoding.equals("identity") && request.getContentLengthLong() > MAX_JSON_BYTES) {
            throw new IOException("Payload JSON excede 2 MiB.");
        }

        InputStream input = switch (encoding) {
            case "identity" -> request.getInputStream();
            case "gzip" -> new GZIPInputStream(request.getInputStream());
            case "deflate" -> new InflaterInputStream(request.getInputStream());
            case "br" -> new BrotliInputStream(request.getInputStream());
            default -> throw new IOException("Content-Encoding não suportado.");
        };

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int total = 0;
        int read;
        while ((read = input.read(buffer)) != -1) {
            total += read;
            if (total > MAX_JSON_BYTES) {
                throw new IOException("Payload JSON excede 2 MiB.");
            }
            output.write(buffer, 0, read);
        }
        return output.toByteArray();
    }

    private JsonNode parseBody(byte[] bytes, String charsetName) throws IOException {
        String normalized = charsetName.toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("utf-")) {
            throw new IOException("Charset JSON não suportado.");
        }
        try {
            String decoded = NodeTextDecoder.decode(bytes, charsetName);
            String withoutBom = !decoded.isEmpty() && decoded.charAt(0) == '\uFEFF'
                ? decoded.substring(1)
                : decoded;
            return withoutBom.isEmpty()
                ? jsonMapper.createObjectNode()
                : StrictJson.readTree(jsonMapper, withoutBom);
        } catch (RuntimeException error) {
            throw new IOException("Charset JSON não suportado.", error);
        }
    }

    private static ParsedContentType parseContentType(String header) {
        if (header == null || header.isEmpty()) {
            throw new IllegalArgumentException("Content-Type ausente.");
        }
        int separator = header.indexOf(';');
        String type = JavascriptNumber.trim(
            separator < 0 ? header : header.substring(0, separator)
        ).toLowerCase(Locale.ROOT);
        if (!MEDIA_TYPE.matcher(type).matches()) {
            throw new IllegalArgumentException("Content-Type inválido.");
        }

        Map<String, String> parameters = new HashMap<>();
        int index = separator;
        while (index >= 0 && index < header.length()) {
            if (header.charAt(index) != ';') {
                throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
            }
            index++;
            while (index < header.length() && header.charAt(index) == ' ') {
                index++;
            }
            int nameStart = index;
            while (index < header.length() && isTokenCharacter(header.charAt(index))) {
                index++;
            }
            if (index == nameStart) {
                throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
            }
            String name = header.substring(nameStart, index).toLowerCase(Locale.ROOT);
            while (index < header.length() && header.charAt(index) == ' ') {
                index++;
            }
            if (index >= header.length() || header.charAt(index) != '=') {
                throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
            }
            index++;
            while (index < header.length() && header.charAt(index) == ' ') {
                index++;
            }

            String value;
            if (index < header.length() && header.charAt(index) == '"') {
                StringBuilder quoted = new StringBuilder();
                index++;
                boolean closed = false;
                while (index < header.length()) {
                    char character = header.charAt(index++);
                    if (character == '"') {
                        closed = true;
                        break;
                    }
                    if (character == '\\') {
                        if (index >= header.length() || !isQuotedPair(header.charAt(index))) {
                            throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
                        }
                        quoted.append(header.charAt(index++));
                    } else if (isQuotedText(character)) {
                        quoted.append(character);
                    } else {
                        throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
                    }
                }
                if (!closed) {
                    throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
                }
                value = quoted.toString();
            } else {
                int valueStart = index;
                while (index < header.length() && isTokenCharacter(header.charAt(index))) {
                    index++;
                }
                if (index == valueStart) {
                    throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
                }
                value = header.substring(valueStart, index);
            }
            while (index < header.length() && header.charAt(index) == ' ') {
                index++;
            }
            if (index < header.length() && header.charAt(index) != ';') {
                throw new IllegalArgumentException("Parâmetro de Content-Type inválido.");
            }
            parameters.put(name, value);
        }
        return new ParsedContentType(
            type,
            parameters.getOrDefault("charset", StandardCharsets.UTF_8.name()).toLowerCase(Locale.ROOT)
        );
    }

    private static boolean isTokenCharacter(char character) {
        return TOKEN.matcher(Character.toString(character)).matches();
    }

    private static boolean isQuotedPair(char character) {
        return character == 0x0b || (character >= 0x20 && character <= 0xff);
    }

    private static boolean isQuotedText(char character) {
        return character == 0x0b
            || character == 0x20
            || character == 0x21
            || (character >= 0x23 && character <= 0x5b)
            || (character >= 0x5d && character <= 0x7e)
            || (character >= 0x80 && character <= 0xff);
    }

    private record ParsedContentType(String type, String charset) {
    }
}

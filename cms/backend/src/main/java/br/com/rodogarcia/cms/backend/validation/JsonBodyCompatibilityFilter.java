package br.com.rodogarcia.cms.backend.validation;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.charset.Charset;
import java.nio.charset.IllegalCharsetNameException;
import java.nio.charset.StandardCharsets;
import java.nio.charset.UnsupportedCharsetException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Locale;
import java.util.zip.GZIPInputStream;
import java.util.zip.InflaterInputStream;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.brotli.dec.BrotliInputStream;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Executa o parser JSON global antes de autenticação/Origin, como o Express. */
public final class JsonBodyCompatibilityFilter extends OncePerRequestFilter {

    public static final int MAX_JSON_BYTES = 2 * 1024 * 1024;
    public static final String BODY_ATTRIBUTE =
        JsonBodyCompatibilityFilter.class.getName() + ".parsedBody";
    private final JsonMapper mapper;

    public JsonBodyCompatibilityFilter(JsonMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        if (!hasBody(request) || !isJson(request.getContentType())) {
            chain.doFilter(request, response);
            return;
        }
        try {
            Charset charset = jsonCharset(request.getContentType());
            byte[] body = readBody(request);
            JsonNode parsed = mapper.createObjectNode();
            if (body.length > 0) {
                parsed = mapper.readTree(new String(body, charset));
                if (parsed == null || (!parsed.isObject() && !parsed.isArray())) {
                    writeError(response, 400, "JSON inválido.");
                    return;
                }
            }
            ReplayableRequest replayable = new ReplayableRequest(request, body);
            replayable.setAttribute(BODY_ATTRIBUTE, parsed);
            chain.doFilter(replayable, response);
        } catch (PayloadTooLarge ignored) {
            // O error handler Express de referência não reconhece o campo `type`
            // emitido pelo body-parser nesse caso e, hoje, responde o erro genérico.
            writeError(response, 500, "Erro interno no servidor.");
        } catch (JacksonException ignored) {
            writeError(response, 400, "JSON inválido.");
        } catch (IOException ignored) {
            writeError(response, 500, "Erro interno no servidor.");
        }
    }

    /** Retorna exatamente o valor produzido pelo parser JSON global, sem reler o stream. */
    public static JsonNode parsedBody(HttpServletRequest request) {
        Object value = request.getAttribute(BODY_ATTRIBUTE);
        return value instanceof JsonNode node ? node : null;
    }

    private static byte[] readBody(HttpServletRequest request) throws IOException {
        String encoding = request.getHeader("Content-Encoding");
        String normalizedEncoding = encoding == null ? "identity" : encoding.toLowerCase(Locale.ROOT);
        if ((normalizedEncoding.isEmpty() || normalizedEncoding.equals("identity"))
            && request.getContentLengthLong() > MAX_JSON_BYTES) {
            throw new PayloadTooLarge();
        }
        InputStream source = request.getInputStream();
        InputStream decoded = switch (normalizedEncoding) {
            case "", "identity" -> source;
            case "gzip" -> new GZIPInputStream(source);
            case "deflate" -> new InflaterInputStream(source);
            case "br" -> new BrotliInputStream(source);
            default -> throw new IOException("Content-Encoding não suportado.");
        };
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8_192];
        int total = 0;
        int read;
        while ((read = decoded.read(buffer)) >= 0) {
            total += read;
            if (total > MAX_JSON_BYTES) throw new PayloadTooLarge();
            output.write(buffer, 0, read);
        }
        return output.toByteArray();
    }

    private static boolean hasBody(HttpServletRequest request) {
        if (request.getHeader("Transfer-Encoding") != null) return true;
        return request.getContentLengthLong() > 0;
    }

    private static boolean isJson(String contentType) {
        if (contentType == null) return false;
        return contentType.split(";", 2)[0].trim().equalsIgnoreCase("application/json");
    }

    private static Charset jsonCharset(String contentType) throws IOException {
        String charset = "utf-8";
        if (contentType != null) {
            for (String parameter : contentType.split(";")) {
                int separator = parameter.indexOf('=');
                if (separator < 0 || !parameter.substring(0, separator).trim()
                    .equalsIgnoreCase("charset")) continue;
                charset = parameter.substring(separator + 1).trim();
                if (charset.length() >= 2 && charset.startsWith("\"") && charset.endsWith("\"")) {
                    charset = charset.substring(1, charset.length() - 1);
                }
                break;
            }
        }
        String normalized = charset.toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("utf-")) throw new IOException("Charset JSON não suportado.");
        try {
            return Charset.forName(normalized);
        } catch (IllegalCharsetNameException | UnsupportedCharsetException ignored) {
            throw new IOException("Charset JSON não suportado.");
        }
    }

    private static void writeError(HttpServletResponse response, int status, String message)
        throws IOException {
        if (response.isCommitted()) return;
        String escaped = message.replace("\\", "\\\\").replace("\"", "\\\"");
        byte[] body = ("{\"error\":\"" + escaped + "\"}").getBytes(StandardCharsets.UTF_8);
        response.resetBuffer();
        response.setStatus(status);
        response.setContentType("application/json; charset=utf-8");
        response.setContentLength(body.length);
        response.getOutputStream().write(body);
    }

    private static final class ReplayableRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        private ReplayableRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override public int read() { return input.read(); }
                @Override public boolean isFinished() { return input.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) { }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }

        @Override
        public int getContentLength() {
            return body.length;
        }

        @Override
        public long getContentLengthLong() {
            return body.length;
        }

        @Override
        public String getHeader(String name) {
            return name.equalsIgnoreCase("Content-Encoding") ? null : super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            return name.equalsIgnoreCase("Content-Encoding")
                ? Collections.emptyEnumeration() : super.getHeaders(name);
        }
    }

    private static final class PayloadTooLarge extends IOException {
    }
}

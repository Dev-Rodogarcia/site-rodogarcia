package br.com.rodogarcia.landingbuilder.security;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * O Express anterior decodificava JSON globalmente antes do limiter da rota.
 * Mantemos essa precedência e, ao mesmo tempo, impedimos corpos chunked acima
 * de 1 MiB de ultrapassar o limite apenas por omitirem Content-Length.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public final class JsonRequestBodyFilter extends OncePerRequestFilter {

    private static final int JSON_LIMIT = 1_024 * 1_024;
    private final ObjectMapper mapper;

    public JsonRequestBodyFilter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        if (!isJson(request.getContentType())) {
            chain.doFilter(request, response);
            return;
        }
        long contentLength = request.getContentLengthLong();
        if (contentLength > JSON_LIMIT) {
            reject(response, HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE, "Payload excede o limite permitido.");
            return;
        }
        byte[] body;
        try {
            body = readAtMost(request.getInputStream(), JSON_LIMIT);
        } catch (PayloadTooLargeException ignored) {
            reject(response, HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE, "Payload excede o limite permitido.");
            return;
        }
        if (body.length > 0) {
            try {
                mapper.readTree(body);
            } catch (RuntimeException ignored) {
                reject(response, HttpServletResponse.SC_BAD_REQUEST, "JSON inválido.");
                return;
            }
        }
        chain.doFilter(new CachedBodyHttpServletRequest(request, body), response);
    }

    private static boolean isJson(String value) {
        return value != null && value.toLowerCase().startsWith(MediaType.APPLICATION_JSON_VALUE);
    }

    private byte[] readAtMost(InputStream input, int maximum) throws IOException, PayloadTooLargeException {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream(Math.min(maximum, 8_192))) {
            byte[] buffer = new byte[8_192];
            int read;
            int total = 0;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > maximum) throw new PayloadTooLargeException();
                output.write(buffer, 0, read);
            }
            return output.toByteArray();
        }
    }

    private void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        mapper.writeValue(response.getOutputStream(), Map.of("error", message));
    }

    private static final class PayloadTooLargeException extends Exception {
    }
}

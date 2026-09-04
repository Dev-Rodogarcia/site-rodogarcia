package br.com.rodogarcia.landingbuilder.security;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
public final class PayloadLimitFilter extends OncePerRequestFilter {

    private static final long JSON_LIMIT = 1_024L * 1_024L;
    private static final long MULTIPART_LIMIT = 70L * 1_024L * 1_024L + 65_536L;
    private final ObjectMapper mapper;

    public PayloadLimitFilter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        long contentLength = request.getContentLengthLong();
        String type = request.getContentType();
        long maximum = type != null && type.toLowerCase().startsWith(MediaType.MULTIPART_FORM_DATA_VALUE)
            ? MULTIPART_LIMIT : type != null && type.toLowerCase().startsWith(MediaType.APPLICATION_JSON_VALUE)
                ? JSON_LIMIT : Long.MAX_VALUE;
        if (contentLength > maximum) {
            response.setStatus(413);
            response.setContentType("application/json;charset=UTF-8");
            mapper.writeValue(response.getOutputStream(), Map.of("error", "Arquivo ou payload excede o limite permitido."));
            return;
        }
        chain.doFilter(request, response);
    }
}

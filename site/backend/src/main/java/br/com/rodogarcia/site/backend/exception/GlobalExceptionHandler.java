package br.com.rodogarcia.site.backend.exception;

import java.io.IOException;

import br.com.rodogarcia.site.backend.dto.response.ApiErrorResponse;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final ExpressJsonResponse jsonResponse;

    public GlobalExceptionHandler(ExpressJsonResponse jsonResponse) {
        this.jsonResponse = jsonResponse;
    }

    @ExceptionHandler(ApiException.class)
    public void handleApiException(
        ApiException error,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        jsonResponse.write(request, response, error.status(), new ApiErrorResponse(error.getMessage()));
    }

    @ExceptionHandler({
        NoHandlerFoundException.class,
        NoResourceFoundException.class,
        HttpRequestMethodNotSupportedException.class
    })
    public void handleNotFound(
        Exception ignored,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        jsonResponse.write(
            request,
            response,
            HttpServletResponse.SC_NOT_FOUND,
            new ApiErrorResponse("Recurso não encontrado.")
        );
    }

    @ExceptionHandler(Exception.class)
    public void handleUnexpected(
        Exception ignored,
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        jsonResponse.write(
            request,
            response,
            HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
            new ApiErrorResponse("Erro interno no servidor.")
        );
    }
}

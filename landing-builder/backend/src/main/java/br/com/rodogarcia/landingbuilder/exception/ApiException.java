package br.com.rodogarcia.landingbuilder.exception;

public final class ApiException extends RuntimeException {

    private final int statusCode;

    public ApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int statusCode() { return statusCode; }
}

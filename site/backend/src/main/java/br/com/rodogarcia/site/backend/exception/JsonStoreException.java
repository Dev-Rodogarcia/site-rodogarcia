package br.com.rodogarcia.site.backend.exception;

import java.nio.file.Path;

public class JsonStoreException extends RuntimeException {

    public JsonStoreException(Path path, Throwable cause) {
        super("Não foi possível ler ou gravar o armazenamento JSON: " + path, cause);
    }
}

package br.com.rodogarcia.site.backend.utils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

/** Reproduz a junção padrão de campos HTTP repetidos feita pelo Node.js. */
public final class NodeRequestHeaders {

    private NodeRequestHeaders() {
    }

    public static String commaJoined(HttpServletRequest request, String name) {
        List<String> values = Collections.list(request.getHeaders(name));
        if (values.isEmpty()) {
            return null;
        }
        List<String> presentValues = new ArrayList<>(values.size());
        for (String value : values) {
            if (value != null) {
                presentValues.add(value);
            }
        }
        return presentValues.isEmpty() ? null : String.join(", ", presentValues);
    }
}

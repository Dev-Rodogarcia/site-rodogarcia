package br.com.rodogarcia.site.backend.service;

import br.com.rodogarcia.site.backend.config.JavascriptNumber;

final class NodeStringCompatibility {

    private NodeStringCompatibility() {
    }

    static String trim(String value) {
        return JavascriptNumber.trim(value);
    }
}

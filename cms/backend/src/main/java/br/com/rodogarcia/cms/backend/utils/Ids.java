package br.com.rodogarcia.cms.backend.utils;

import java.util.UUID;

public final class Ids {

    private Ids() {
    }

    public static String generate(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "");
    }
}

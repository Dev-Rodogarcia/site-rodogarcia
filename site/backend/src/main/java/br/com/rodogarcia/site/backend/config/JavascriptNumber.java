package br.com.rodogarcia.site.backend.config;

import java.math.BigInteger;
import java.util.regex.Pattern;

public final class JavascriptNumber {

    private static final Pattern ECMASCRIPT_TRIM = Pattern.compile(
        "^[\\u0009-\\u000d\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029" +
            "\\u202f\\u205f\\u3000\\ufeff]+|" +
            "[\\u0009-\\u000d\\u0020\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029" +
            "\\u202f\\u205f\\u3000\\ufeff]+$"
    );
    private static final Pattern DECIMAL = Pattern.compile(
        "[+-]?(?:(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?|Infinity)"
    );

    private JavascriptNumber() {
    }

    public static String trim(String input) {
        return ECMASCRIPT_TRIM.matcher(input).replaceAll("");
    }

    public static double parse(String input) {
        String value = trim(input);
        if (value.isEmpty()) {
            return 0D;
        }
        try {
            if (value.matches("0[xX][0-9a-fA-F]+")) {
                return new BigInteger(value.substring(2), 16).doubleValue();
            }
            if (value.matches("0[bB][01]+")) {
                return new BigInteger(value.substring(2), 2).doubleValue();
            }
            if (value.matches("0[oO][0-7]+")) {
                return new BigInteger(value.substring(2), 8).doubleValue();
            }
            if (!DECIMAL.matcher(value).matches()) {
                return Double.NaN;
            }
            return Double.parseDouble(value);
        } catch (NumberFormatException ignored) {
            return Double.NaN;
        }
    }
}

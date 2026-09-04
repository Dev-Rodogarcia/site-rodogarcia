package br.com.rodogarcia.site.backend.config;

public record TrustProxySetting(Mode mode, int hops, String expression) {

    public enum Mode {
        DISABLED,
        ENABLED,
        HOPS,
        EXPRESSION
    }

    public static TrustProxySetting parse(String value) {
        String trimmed = value == null ? "" : JavascriptNumber.trim(value);
        String normalized = trimmed.toLowerCase();
        if (normalized.isEmpty() || normalized.equals("false") || normalized.equals("0")) {
            return new TrustProxySetting(Mode.DISABLED, 0, "");
        }
        if (normalized.equals("true")) {
            return new TrustProxySetting(Mode.ENABLED, 0, "");
        }
        double parsed = JavascriptNumber.parse(normalized);
        if (Double.isFinite(parsed) && parsed >= 0 && parsed == Math.rint(parsed)) {
            int hops = parsed >= Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) parsed;
            return new TrustProxySetting(Mode.HOPS, hops, "");
        }
        return new TrustProxySetting(Mode.EXPRESSION, 0, trimmed);
    }
}

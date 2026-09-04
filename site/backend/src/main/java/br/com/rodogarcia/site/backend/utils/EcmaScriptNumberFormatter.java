package br.com.rodogarcia.site.backend.utils;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Formata um binary64 como {@code String(Number)} do ECMAScript. A busca testa
 * as duas bordas decimais em ordem crescente de precisão e escolhe a menor
 * representação que volta ao mesmo conjunto de bits IEEE-754. Depois aplica os
 * limiares de notação fixa do JavaScript: 1e-6 inclusivo e 1e21 exclusivo.
 */
public final class EcmaScriptNumberFormatter {

    private static final int MAX_BINARY64_DECIMAL_DIGITS = 17;
    private static final RoundingMode[] CANDIDATE_ROUNDING_MODES = {
        RoundingMode.DOWN,
        RoundingMode.UP,
        RoundingMode.HALF_EVEN
    };

    private EcmaScriptNumberFormatter() {
    }

    public static String format(double value) {
        if (Double.isNaN(value)) {
            return "NaN";
        }
        if (value == Double.POSITIVE_INFINITY) {
            return "Infinity";
        }
        if (value == Double.NEGATIVE_INFINITY) {
            return "-Infinity";
        }
        if (value == 0D) {
            return "0";
        }

        boolean negative = value < 0D;
        long expectedBits = Double.doubleToRawLongBits(value);
        BigDecimal exact = new BigDecimal(Math.abs(value));

        for (int precision = 1; precision <= MAX_BINARY64_DECIMAL_DIGITS; precision++) {
            BigDecimal best = null;
            BigDecimal bestDistance = null;
            for (RoundingMode roundingMode : CANDIDATE_ROUNDING_MODES) {
                BigDecimal candidate = exact
                    .round(new MathContext(precision, roundingMode))
                    .stripTrailingZeros();
                String formatted = formatCandidate(candidate, negative);
                if (Double.doubleToRawLongBits(Double.parseDouble(formatted)) != expectedBits) {
                    continue;
                }

                BigDecimal distance = candidate.subtract(exact).abs();
                if (best == null
                    || distance.compareTo(bestDistance) < 0
                    || (distance.compareTo(bestDistance) == 0
                        && isOdd(best)
                        && !isOdd(candidate))) {
                    best = candidate;
                    bestDistance = distance;
                }
            }
            if (best != null) {
                return formatCandidate(best, negative);
            }
        }

        throw new IllegalStateException("Não foi possível serializar o número binary64.");
    }

    private static String formatCandidate(BigDecimal value, boolean negative) {
        int exponent = value.precision() - value.scale() - 1;
        String unsigned;
        if (exponent >= -6 && exponent < 21) {
            unsigned = value.toPlainString();
        } else {
            String digits = value.unscaledValue().abs().toString();
            String coefficient = digits.length() == 1
                ? digits
                : digits.charAt(0) + "." + digits.substring(1);
            unsigned = coefficient + "e" + (exponent >= 0 ? "+" : "") + exponent;
        }
        return negative ? "-" + unsigned : unsigned;
    }

    private static boolean isOdd(BigDecimal value) {
        return value.unscaledValue().abs().testBit(0);
    }
}

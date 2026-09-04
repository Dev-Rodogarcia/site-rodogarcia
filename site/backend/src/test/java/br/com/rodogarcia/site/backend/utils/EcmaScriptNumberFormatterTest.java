package br.com.rodogarcia.site.backend.utils;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EcmaScriptNumberFormatterTest {

    @Test
    void matchesJavascriptFixedAndScientificThresholds() {
        assertThat(EcmaScriptNumberFormatter.format(1e-7)).isEqualTo("1e-7");
        assertThat(EcmaScriptNumberFormatter.format(1e-6)).isEqualTo("0.000001");
        assertThat(EcmaScriptNumberFormatter.format(10_000_000D)).isEqualTo("10000000");
        assertThat(EcmaScriptNumberFormatter.format(1e20))
            .isEqualTo("100000000000000000000");
        assertThat(EcmaScriptNumberFormatter.format(1e21)).isEqualTo("1e+21");
    }

    @Test
    void usesTheShortestRoundTripForSmallAndLargeBinary64Vectors() {
        assertThat(EcmaScriptNumberFormatter.format(Double.MIN_VALUE)).isEqualTo("5e-324");
        assertThat(EcmaScriptNumberFormatter.format(Double.MIN_VALUE * 2)).isEqualTo("1e-323");
        assertThat(EcmaScriptNumberFormatter.format(1_000_000_000_000_000_100D))
            .isEqualTo("1000000000000000100");
        assertThat(EcmaScriptNumberFormatter.format(Double.MAX_VALUE))
            .isEqualTo("1.7976931348623157e+308");
    }

    @Test
    void matchesJavascriptSpecialValuesAndNegativeZero() {
        assertThat(EcmaScriptNumberFormatter.format(-0D)).isEqualTo("0");
        assertThat(EcmaScriptNumberFormatter.format(Double.NaN)).isEqualTo("NaN");
        assertThat(EcmaScriptNumberFormatter.format(Double.POSITIVE_INFINITY))
            .isEqualTo("Infinity");
        assertThat(EcmaScriptNumberFormatter.format(Double.NEGATIVE_INFINITY))
            .isEqualTo("-Infinity");
    }
}

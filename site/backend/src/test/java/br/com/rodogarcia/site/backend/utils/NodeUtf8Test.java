package br.com.rodogarcia.site.backend.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

class NodeUtf8Test {

    @Test
    void followsWhatwgReplacementAndValidCodePointRules() {
        assertThat(NodeUtf8.decode(new byte[] { (byte) 0xC3 })).isEqualTo("\uFFFD");
        assertThat(NodeUtf8.decode(new byte[] {
            (byte) 0xED,
            (byte) 0xA0,
            (byte) 0x80
        })).isEqualTo("\uFFFD\uFFFD\uFFFD");
        assertThat(NodeUtf8.decode(new byte[] {
            (byte) 0xE2,
            0x28,
            (byte) 0xA1
        })).isEqualTo("\uFFFD(\uFFFD");
        assertThat(NodeUtf8.decode("Osasco 😀".getBytes(StandardCharsets.UTF_8)))
            .isEqualTo("Osasco 😀");
    }
}

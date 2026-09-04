package br.com.rodogarcia.site.backend.utils;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class NodeTextDecoderTest {

    @Test
    void mirrorsIconvUtf16OddByteAndSurrogateHandling() {
        assertThat(NodeTextDecoder.decode(
            new byte[] { 0x7B, 0, 0x7D, 0, 0x78 },
            "utf-16le"
        )).isEqualTo("{}");
        assertThat(NodeTextDecoder.decode(
            new byte[] { 0x00, 0x7B, 0x00, 0x7D, 0x78 },
            "utf-16be"
        )).isEqualTo("{}");
        assertThat(NodeTextDecoder.decode(
            new byte[] { 0x00, (byte) 0xD8 },
            "utf-16le"
        )).isEqualTo("\uD800");
    }

    @Test
    void decodesUtf7AndModifiedUtf7LikeIconvLite() {
        assertThat(NodeTextDecoder.decode(
            "{\"value\":\"+AOk-\"}".getBytes(java.nio.charset.StandardCharsets.US_ASCII),
            "utf-7"
        )).isEqualTo("{\"value\":\"é\"}");
        assertThat(NodeTextDecoder.decode(
            "{\"value\":\"&AOk-\"}".getBytes(java.nio.charset.StandardCharsets.US_ASCII),
            "utf-7-imap"
        )).isEqualTo("{\"value\":\"é\"}");
    }
}

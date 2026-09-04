package br.com.rodogarcia.site.backend.utils;

/** Decoder UTF-8 de substituição compatível com Buffer.toString/TextDecoder do Node. */
public final class NodeUtf8 {

    private static final char REPLACEMENT = '\uFFFD';

    private NodeUtf8() {
    }

    public static String decode(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length);
        int codePoint = 0;
        int bytesSeen = 0;
        int bytesNeeded = 0;
        int lowerBoundary = 0x80;
        int upperBoundary = 0xBF;
        int index = 0;

        while (index < bytes.length) {
            int current = bytes[index] & 0xFF;
            if (bytesNeeded == 0) {
                index += 1;
                if (current <= 0x7F) {
                    result.append((char) current);
                } else if (current >= 0xC2 && current <= 0xDF) {
                    bytesNeeded = 1;
                    codePoint = current & 0x1F;
                } else if (current >= 0xE0 && current <= 0xEF) {
                    if (current == 0xE0) {
                        lowerBoundary = 0xA0;
                    } else if (current == 0xED) {
                        upperBoundary = 0x9F;
                    }
                    bytesNeeded = 2;
                    codePoint = current & 0x0F;
                } else if (current >= 0xF0 && current <= 0xF4) {
                    if (current == 0xF0) {
                        lowerBoundary = 0x90;
                    } else if (current == 0xF4) {
                        upperBoundary = 0x8F;
                    }
                    bytesNeeded = 3;
                    codePoint = current & 0x07;
                } else {
                    result.append(REPLACEMENT);
                }
                continue;
            }

            if (current < lowerBoundary || current > upperBoundary) {
                codePoint = 0;
                bytesSeen = 0;
                bytesNeeded = 0;
                lowerBoundary = 0x80;
                upperBoundary = 0xBF;
                result.append(REPLACEMENT);
                continue;
            }

            lowerBoundary = 0x80;
            upperBoundary = 0xBF;
            codePoint = (codePoint << 6) | (current & 0x3F);
            bytesSeen += 1;
            index += 1;
            if (bytesSeen == bytesNeeded) {
                result.appendCodePoint(codePoint);
                codePoint = 0;
                bytesSeen = 0;
                bytesNeeded = 0;
            }
        }

        if (bytesNeeded != 0) {
            result.append(REPLACEMENT);
        }
        return result.toString();
    }
}

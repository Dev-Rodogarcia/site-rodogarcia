package br.com.rodogarcia.site.backend.utils;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

/** Valida os mesmos escapes percentuais e sequências UTF-8 de decodeURIComponent. */
public final class NodePathDecoder {

    private NodePathDecoder() {
    }

    public static boolean canDecodeURIComponent(String value) {
        if (value == null) {
            return false;
        }
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        return canDecodeURIComponent(bytes, 0, bytes.length);
    }

    public static boolean canDecodeURIComponent(byte[] value, int start, int length) {
        int end = start + length;
        byte[] decoded = new byte[length];
        int write = 0;
        for (int index = start; index < end; index++) {
            byte current = value[index];
            if (current != '%') {
                decoded[write++] = current;
                continue;
            }
            if (index > end - 3
                || !isHexDigit(value[index + 1])
                || !isHexDigit(value[index + 2])) {
                return false;
            }
            decoded[write++] = (byte) (
                hexValue(value[index + 1]) * 16 + hexValue(value[index + 2])
            );
            index += 2;
        }

        try {
            StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(decoded, 0, write));
            return true;
        } catch (CharacterCodingException ignored) {
            return false;
        }
    }

    public static String decodeURIComponent(String value) {
        byte[] source = value.getBytes(StandardCharsets.UTF_8);
        ByteArrayOutputStream decoded = new ByteArrayOutputStream(source.length);
        for (int index = 0; index < source.length; index++) {
            byte current = source[index];
            if (current != '%') {
                decoded.write(current);
                continue;
            }
            if (index > source.length - 3
                || !isHexDigit(source[index + 1])
                || !isHexDigit(source[index + 2])) {
                throw new IllegalArgumentException("Componente de URL inválido.");
            }
            decoded.write(hexValue(source[index + 1]) * 16 + hexValue(source[index + 2]));
            index += 2;
        }
        try {
            return StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(decoded.toByteArray()))
                .toString();
        } catch (CharacterCodingException error) {
            throw new IllegalArgumentException("Componente de URL inválido.", error);
        }
    }

    private static boolean isHexDigit(byte value) {
        return (value >= '0' && value <= '9')
            || (value >= 'A' && value <= 'F')
            || (value >= 'a' && value <= 'f');
    }

    private static int hexValue(byte value) {
        if (value >= '0' && value <= '9') {
            return value - '0';
        }
        if (value >= 'A' && value <= 'F') {
            return value - 'A' + 10;
        }
        return value - 'a' + 10;
    }
}

package br.com.rodogarcia.site.backend.utils;

import java.util.Locale;
import java.util.Base64;

/** Subconjunto UTF do iconv-lite aceito pelo express.json. */
public final class NodeTextDecoder {

    private NodeTextDecoder() {
    }

    public static String decode(byte[] bytes, String charsetName) {
        String encoding = charsetName.toLowerCase(Locale.ROOT).replaceAll("[^0-9a-z]", "");
        return switch (encoding) {
            case "utf8" -> NodeUtf8.decode(bytes);
            case "utf16le" -> decodeUtf16(bytes, true);
            case "utf16be" -> decodeUtf16(bytes, false);
            case "utf16" -> decodeUtf16(bytes, detectUtf16LittleEndian(bytes));
            case "utf32le" -> decodeUtf32(bytes, true);
            case "utf32be" -> decodeUtf32(bytes, false);
            case "utf32" -> decodeUtf32(bytes, detectUtf32LittleEndian(bytes));
            case "utf7" -> decodeUtf7(bytes, false);
            case "utf7imap" -> decodeUtf7(bytes, true);
            default -> throw new IllegalArgumentException("Charset UTF não suportado.");
        };
    }

    private static String decodeUtf7(byte[] bytes, boolean imap) {
        int shift = imap ? '&' : '+';
        StringBuilder result = new StringBuilder(bytes.length);
        int index = 0;
        while (index < bytes.length) {
            int current = bytes[index] & 0xFF;
            if (current != shift) {
                result.append((char) (current & 0x7F));
                index += 1;
                continue;
            }

            index += 1;
            if (index < bytes.length && bytes[index] == '-') {
                result.append((char) shift);
                index += 1;
                continue;
            }

            StringBuilder encoded = new StringBuilder();
            while (index < bytes.length && isUtf7Base64(bytes[index] & 0xFF, imap)) {
                char character = (char) (bytes[index] & 0x7F);
                encoded.append(character == ',' ? '/' : character);
                index += 1;
            }
            byte[] utf16 = forgivingBase64Decode(encoded.toString());
            result.append(decodeUtf16(utf16, false));
            if (index < bytes.length && bytes[index] == '-') {
                index += 1;
            }
        }
        return result.toString();
    }

    private static boolean isUtf7Base64(int value, boolean imap) {
        return (value >= 'A' && value <= 'Z')
            || (value >= 'a' && value <= 'z')
            || (value >= '0' && value <= '9')
            || value == '+'
            || (imap ? value == ',' : value == '/');
    }

    private static byte[] forgivingBase64Decode(String value) {
        if (value.length() % 4 == 1) {
            value = value.substring(0, value.length() - 1);
        }
        if (value.isEmpty()) {
            return new byte[0];
        }
        int padding = (4 - value.length() % 4) % 4;
        try {
            return Base64.getDecoder().decode(value + "=".repeat(padding));
        } catch (IllegalArgumentException ignored) {
            return new byte[0];
        }
    }

    private static String decodeUtf16(byte[] bytes, boolean littleEndian) {
        StringBuilder result = new StringBuilder(bytes.length / 2);
        for (int index = 0; index + 1 < bytes.length; index += 2) {
            int first = bytes[index] & 0xFF;
            int second = bytes[index + 1] & 0xFF;
            int codeUnit = littleEndian ? first | (second << 8) : (first << 8) | second;
            result.append((char) codeUnit);
        }
        return result.toString();
    }

    private static String decodeUtf32(byte[] bytes, boolean littleEndian) {
        StringBuilder result = new StringBuilder(bytes.length / 2);
        for (int index = 0; index + 3 < bytes.length; index += 4) {
            long value = littleEndian
                ? (bytes[index] & 0xFFL)
                    | ((bytes[index + 1] & 0xFFL) << 8)
                    | ((bytes[index + 2] & 0xFFL) << 16)
                    | ((bytes[index + 3] & 0xFFL) << 24)
                : ((bytes[index] & 0xFFL) << 24)
                    | ((bytes[index + 1] & 0xFFL) << 16)
                    | ((bytes[index + 2] & 0xFFL) << 8)
                    | (bytes[index + 3] & 0xFFL);
            if (value > 0x10FFFFL) {
                result.append('\uFFFD');
            } else if (value >= 0x10000L) {
                result.appendCodePoint((int) value);
            } else {
                result.append((char) value);
            }
        }
        return result.toString();
    }

    private static boolean detectUtf16LittleEndian(byte[] bytes) {
        if (bytes.length >= 2) {
            if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xFE) {
                return true;
            }
            if ((bytes[0] & 0xFF) == 0xFE && (bytes[1] & 0xFF) == 0xFF) {
                return false;
            }
        }
        int littleEndianAscii = 0;
        int bigEndianAscii = 0;
        int characters = Math.min(bytes.length / 2, 100);
        for (int index = 0; index < characters * 2; index += 2) {
            int first = bytes[index] & 0xFF;
            int second = bytes[index + 1] & 0xFF;
            if (first == 0 && second != 0) {
                bigEndianAscii += 1;
            }
            if (first != 0 && second == 0) {
                littleEndianAscii += 1;
            }
        }
        return littleEndianAscii >= bigEndianAscii;
    }

    private static boolean detectUtf32LittleEndian(byte[] bytes) {
        if (bytes.length >= 4) {
            if ((bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xFE
                && bytes[2] == 0
                && bytes[3] == 0) {
                return true;
            }
            if (bytes[0] == 0
                && bytes[1] == 0
                && (bytes[2] & 0xFF) == 0xFE
                && (bytes[3] & 0xFF) == 0xFF) {
                return false;
            }
        }
        int littleScore = 0;
        int bigScore = 0;
        int characters = Math.min(bytes.length / 4, 100);
        for (int index = 0; index < characters * 4; index += 4) {
            int first = bytes[index] & 0xFF;
            int second = bytes[index + 1] & 0xFF;
            int third = bytes[index + 2] & 0xFF;
            int fourth = bytes[index + 3] & 0xFF;
            int invalidBig = first != 0 || second > 0x10 ? 1 : 0;
            int invalidLittle = fourth != 0 || third > 0x10 ? 1 : 0;
            int bmpBig = first == 0 && second == 0 && (third != 0 || fourth != 0) ? 1 : 0;
            int bmpLittle = (first != 0 || second != 0) && third == 0 && fourth == 0 ? 1 : 0;
            bigScore += bmpBig - invalidBig;
            littleScore += bmpLittle - invalidLittle;
        }
        return littleScore >= bigScore;
    }
}

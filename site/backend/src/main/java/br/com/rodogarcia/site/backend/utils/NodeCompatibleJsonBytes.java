package br.com.rodogarcia.site.backend.utils;

/** Ajusta diferenças puramente lexicais entre o Jackson e JSON.stringify. */
public final class NodeCompatibleJsonBytes {

    private NodeCompatibleJsonBytes() {
    }

    public static byte[] normalize(byte[] json) {
        byte[] normalized = json.clone();
        int precedingBackslashes = 0;
        for (int index = 0; index < normalized.length; index++) {
            byte current = normalized[index];
            if (current == '\\') {
                precedingBackslashes += 1;
                continue;
            }
            if (current == 'u'
                && (precedingBackslashes & 1) == 1
                && index + 4 < normalized.length
                && isHex(normalized[index + 1])
                && isHex(normalized[index + 2])
                && isHex(normalized[index + 3])
                && isHex(normalized[index + 4])) {
                for (int offset = 1; offset <= 4; offset++) {
                    normalized[index + offset] = asciiLowercase(normalized[index + offset]);
                }
            }
            precedingBackslashes = 0;
        }
        return normalized;
    }

    private static boolean isHex(byte value) {
        return (value >= '0' && value <= '9')
            || (value >= 'a' && value <= 'f')
            || (value >= 'A' && value <= 'F');
    }

    private static byte asciiLowercase(byte value) {
        return value >= 'A' && value <= 'F' ? (byte) (value + ('a' - 'A')) : value;
    }
}

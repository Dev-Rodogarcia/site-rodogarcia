package br.com.rodogarcia.site.backend.config;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.net.IDN;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Compatibilidade focada com {@code new URL(value)} do Node para URLs HTTP(S).
 *
 * <p>O JDK {@code URI} preserva hosts numéricos alternativos e não aplica IDNA
 * nem a serialização de URLs especiais. Esses detalhes são relevantes tanto
 * para o hardening de origens quanto para o endpoint configurável da ESL.</p>
 */
public final class WhatwgUrlCompatibility {

    private static final Pattern SCHEME = Pattern.compile("^([A-Za-z][A-Za-z0-9+.-]*):");
    private static final Pattern DECIMAL_PORT = Pattern.compile("[0-9]*");
    private static final BigInteger IPV4_LIMIT = BigInteger.ONE.shiftLeft(32);
    private static final BigInteger BYTE_LIMIT = BigInteger.valueOf(256);

    private WhatwgUrlCompatibility() {
    }

    public static ParsedUrl parse(String input) {
        if (input == null) {
            throw new IllegalArgumentException("URL ausente.");
        }

        String value = removeAsciiTabAndNewline(stripC0ControlAndSpace(input));
        Matcher matcher = SCHEME.matcher(value);
        if (!matcher.find()) {
            throw new IllegalArgumentException("URL sem protocolo absoluto.");
        }

        String scheme = matcher.group(1).toLowerCase(Locale.ROOT);
        String remainder = value.substring(matcher.end());
        if (scheme.equals("http") || scheme.equals("https")) {
            return parseHttpUrl(scheme, remainder);
        }

        // O hardening Node considera esquemas absolutos não HTTP como URLs
        // válidas e registra separadamente que não usam HTTPS.
        return new ParsedUrl(scheme + ":", "", scheme + ":" + remainder);
    }

    private static ParsedUrl parseHttpUrl(String scheme, String input) {
        String remainder = input.replace('\\', '/');
        int firstNonSlash = 0;
        while (firstNonSlash < remainder.length() && remainder.charAt(firstNonSlash) == '/') {
            firstNonSlash++;
        }
        remainder = remainder.substring(firstNonSlash);

        int authorityEnd = firstIndexOf(remainder, '/', '?', '#');
        String authority = authorityEnd < 0 ? remainder : remainder.substring(0, authorityEnd);
        String suffix = authorityEnd < 0 ? "" : remainder.substring(authorityEnd);
        if (authority.isEmpty()) {
            throw new IllegalArgumentException("URL HTTP(S) sem hostname.");
        }

        String userInfo = "";
        int at = authority.lastIndexOf('@');
        if (at >= 0) {
            userInfo = authority.substring(0, at).replace("@", "%40");
            authority = authority.substring(at + 1);
        }

        HostAndPort hostAndPort = parseHostAndPort(authority, scheme);
        String hostname = normalizeHostname(hostAndPort.hostname());
        String credentials = serializeCredentials(userInfo);
        String pathQueryFragment = serializePathQueryFragment(suffix);
        String port = hostAndPort.port() < 0 ? "" : ":" + hostAndPort.port();
        String serialized = scheme + "://" + credentials + hostname + port + pathQueryFragment;

        return new ParsedUrl(scheme + ":", hostname, serialized);
    }

    private static HostAndPort parseHostAndPort(String authority, String scheme) {
        if (authority.isEmpty()) {
            throw new IllegalArgumentException("Hostname ausente.");
        }

        String hostname;
        String rawPort = "";
        if (authority.charAt(0) == '[') {
            int closingBracket = authority.indexOf(']');
            if (closingBracket < 0) {
                throw new IllegalArgumentException("IPv6 inválido.");
            }
            hostname = authority.substring(0, closingBracket + 1);
            String tail = authority.substring(closingBracket + 1);
            if (!tail.isEmpty()) {
                if (tail.charAt(0) != ':') {
                    throw new IllegalArgumentException("Hostname inválido.");
                }
                rawPort = tail.substring(1);
            }
        } else {
            int colon = authority.lastIndexOf(':');
            if (colon >= 0) {
                if (authority.indexOf(':') != colon) {
                    throw new IllegalArgumentException("IPv6 precisa usar colchetes.");
                }
                hostname = authority.substring(0, colon);
                rawPort = authority.substring(colon + 1);
            } else {
                hostname = authority;
            }
        }

        if (hostname.isEmpty() || !DECIMAL_PORT.matcher(rawPort).matches()) {
            throw new IllegalArgumentException("Hostname ou porta inválidos.");
        }

        int port = -1;
        if (!rawPort.isEmpty()) {
            try {
                port = Integer.parseInt(rawPort);
            } catch (NumberFormatException exception) {
                throw new IllegalArgumentException("Porta inválida.", exception);
            }
            if (port > 65_535) {
                throw new IllegalArgumentException("Porta inválida.");
            }
            if ((scheme.equals("https") && port == 443) || (scheme.equals("http") && port == 80)) {
                port = -1;
            }
        }
        return new HostAndPort(hostname, port);
    }

    private static String normalizeHostname(String rawHostname) {
        if (rawHostname.startsWith("[") && rawHostname.endsWith("]")) {
            String value = rawHostname.toLowerCase(Locale.ROOT);
            if (value.length() <= 2 || containsForbiddenIpv6Character(value)) {
                throw new IllegalArgumentException("IPv6 inválido.");
            }
            return value;
        }

        String decoded = percentDecodeUtf8(rawHostname);
        if (containsForbiddenHostCharacter(decoded)) {
            throw new IllegalArgumentException("Hostname inválido.");
        }

        final String ascii;
        try {
            ascii = IDN.toASCII(decoded, IDN.ALLOW_UNASSIGNED).toLowerCase(Locale.ROOT);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Hostname IDNA inválido.", exception);
        }
        if (ascii.isEmpty()) {
            throw new IllegalArgumentException("Hostname ausente.");
        }

        String ipv4 = normalizeIpv4(ascii);
        return ipv4 == null ? ascii : ipv4;
    }

    private static String normalizeIpv4(String hostname) {
        String candidate = hostname;
        if (candidate.endsWith(".")) {
            candidate = candidate.substring(0, candidate.length() - 1);
        }
        String[] pieces = candidate.split("\\.", -1);
        if (pieces.length == 0 || pieces.length > 4) {
            return null;
        }

        List<BigInteger> numbers = new ArrayList<>(pieces.length);
        for (String piece : pieces) {
            BigInteger number = parseIpv4Number(piece);
            if (number == null) {
                return null;
            }
            numbers.add(number);
        }

        for (int index = 0; index < numbers.size() - 1; index++) {
            if (numbers.get(index).compareTo(BYTE_LIMIT) >= 0) {
                throw new IllegalArgumentException("IPv4 inválido.");
            }
        }

        int remainingBytes = 5 - numbers.size();
        BigInteger lastLimit = BigInteger.ONE.shiftLeft(8 * remainingBytes);
        BigInteger last = numbers.get(numbers.size() - 1);
        if (last.compareTo(lastLimit) >= 0) {
            throw new IllegalArgumentException("IPv4 inválido.");
        }

        BigInteger address = last;
        for (int index = 0; index < numbers.size() - 1; index++) {
            int shift = 8 * (3 - index);
            address = address.add(numbers.get(index).shiftLeft(shift));
        }
        if (address.signum() < 0 || address.compareTo(IPV4_LIMIT) >= 0) {
            throw new IllegalArgumentException("IPv4 inválido.");
        }

        long value = address.longValue();
        return ((value >>> 24) & 0xff) + "."
            + ((value >>> 16) & 0xff) + "."
            + ((value >>> 8) & 0xff) + "."
            + (value & 0xff);
    }

    private static BigInteger parseIpv4Number(String input) {
        if (input.isEmpty()) {
            return null;
        }
        int radix = 10;
        String digits = input;
        if (input.length() >= 2 && input.charAt(0) == '0'
            && (input.charAt(1) == 'x' || input.charAt(1) == 'X')) {
            radix = 16;
            digits = input.substring(2);
        } else if (input.length() >= 2 && input.charAt(0) == '0') {
            radix = 8;
            digits = input.substring(1);
        }
        if (digits.isEmpty()) {
            return BigInteger.ZERO;
        }
        try {
            return new BigInteger(digits, radix);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String serializeCredentials(String userInfo) {
        if (userInfo.isEmpty()) {
            return "";
        }
        int colon = userInfo.indexOf(':');
        if (colon < 0) {
            return percentEncode(userInfo, Component.USERINFO) + "@";
        }
        return percentEncode(userInfo.substring(0, colon), Component.USERINFO)
            + ":"
            + percentEncode(userInfo.substring(colon + 1), Component.USERINFO)
            + "@";
    }

    private static String serializePathQueryFragment(String suffix) {
        int hash = suffix.indexOf('#');
        String fragment = hash < 0 ? null : suffix.substring(hash + 1);
        String beforeFragment = hash < 0 ? suffix : suffix.substring(0, hash);
        int question = beforeFragment.indexOf('?');
        String query = question < 0 ? null : beforeFragment.substring(question + 1);
        String path = question < 0 ? beforeFragment : beforeFragment.substring(0, question);
        if (path.isEmpty()) {
            path = "/";
        }
        path = normalizePath(path);

        StringBuilder result = new StringBuilder(percentEncode(path, Component.PATH));
        if (query != null) {
            result.append('?').append(percentEncode(query, Component.QUERY));
        }
        if (fragment != null) {
            result.append('#').append(percentEncode(fragment, Component.FRAGMENT));
        }
        return result.toString();
    }

    private static String normalizePath(String path) {
        String[] segments = path.split("/", -1);
        Deque<String> normalized = new ArrayDeque<>();
        boolean trailingDotSegment = false;
        for (int index = 1; index < segments.length; index++) {
            String segment = segments[index];
            if (isSingleDot(segment)) {
                trailingDotSegment = index == segments.length - 1;
                continue;
            }
            if (isDoubleDot(segment)) {
                if (!normalized.isEmpty()) {
                    normalized.removeLast();
                }
                trailingDotSegment = index == segments.length - 1;
                continue;
            }
            normalized.addLast(segment);
            trailingDotSegment = false;
        }

        String result = "/" + String.join("/", normalized);
        if ((path.endsWith("/") || trailingDotSegment) && !result.endsWith("/")) {
            result += "/";
        }
        return result;
    }

    private static boolean isSingleDot(String segment) {
        return segment.equals(".") || segment.equalsIgnoreCase("%2e");
    }

    private static boolean isDoubleDot(String segment) {
        String lower = segment.toLowerCase(Locale.ROOT);
        return lower.equals("..") || lower.equals(".%2e")
            || lower.equals("%2e.") || lower.equals("%2e%2e");
    }

    private static String percentEncode(String value, Component component) {
        StringBuilder result = new StringBuilder();
        for (int offset = 0; offset < value.length();) {
            char current = value.charAt(offset);
            if (current == '%' && offset + 2 < value.length()
                && isHex(value.charAt(offset + 1)) && isHex(value.charAt(offset + 2))) {
                result.append(value, offset, offset + 3);
                offset += 3;
                continue;
            }

            int codePoint = value.codePointAt(offset);
            offset += Character.charCount(codePoint);
            if (codePoint >= 0x21 && codePoint <= 0x7e && component.allows((char) codePoint)) {
                result.append((char) codePoint);
                continue;
            }

            String character = Character.isSurrogate((char) codePoint)
                ? "\ufffd"
                : new String(Character.toChars(codePoint));
            for (byte item : character.getBytes(StandardCharsets.UTF_8)) {
                result.append('%');
                int unsigned = Byte.toUnsignedInt(item);
                result.append(Character.toUpperCase(Character.forDigit(unsigned >>> 4, 16)));
                result.append(Character.toUpperCase(Character.forDigit(unsigned & 0x0f, 16)));
            }
        }
        return result.toString();
    }

    private static String percentDecodeUtf8(String value) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        for (int offset = 0; offset < value.length();) {
            char current = value.charAt(offset);
            if (current == '%') {
                if (offset + 2 >= value.length()
                    || !isHex(value.charAt(offset + 1)) || !isHex(value.charAt(offset + 2))) {
                    throw new IllegalArgumentException("Escape percentual inválido no hostname.");
                }
                bytes.write((hex(value.charAt(offset + 1)) << 4) | hex(value.charAt(offset + 2)));
                offset += 3;
                continue;
            }
            int codePoint = value.codePointAt(offset);
            offset += Character.charCount(codePoint);
            bytes.writeBytes(new String(Character.toChars(codePoint)).getBytes(StandardCharsets.UTF_8));
        }

        try {
            return StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes.toByteArray()))
                .toString();
        } catch (CharacterCodingException exception) {
            throw new IllegalArgumentException("Hostname não usa UTF-8 válido.", exception);
        }
    }

    private static boolean containsForbiddenHostCharacter(String value) {
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (character <= 0x20 || character == '#' || character == '/'
                || character == ':' || character == '<' || character == '>'
                || character == '?' || character == '@' || character == '['
                || character == '\\' || character == ']' || character == '^'
                || character == '|') {
                return true;
            }
        }
        return false;
    }

    private static boolean containsForbiddenIpv6Character(String value) {
        for (int index = 1; index < value.length() - 1; index++) {
            char character = value.charAt(index);
            if (!(isHex(character) || character == ':' || character == '.')) {
                return true;
            }
        }
        return false;
    }

    private static int firstIndexOf(String value, char... candidates) {
        int result = -1;
        for (char candidate : candidates) {
            int index = value.indexOf(candidate);
            if (index >= 0 && (result < 0 || index < result)) {
                result = index;
            }
        }
        return result;
    }

    private static String stripC0ControlAndSpace(String value) {
        int start = 0;
        int end = value.length();
        while (start < end && value.charAt(start) <= 0x20) {
            start++;
        }
        while (end > start && value.charAt(end - 1) <= 0x20) {
            end--;
        }
        return value.substring(start, end);
    }

    private static String removeAsciiTabAndNewline(String value) {
        return value.replace("\t", "").replace("\n", "").replace("\r", "");
    }

    private static boolean isHex(char value) {
        return (value >= '0' && value <= '9')
            || (value >= 'a' && value <= 'f')
            || (value >= 'A' && value <= 'F');
    }

    private static int hex(char value) {
        return Character.digit(value, 16);
    }

    public record ParsedUrl(String protocol, String hostname, String serialized) {
    }

    private record HostAndPort(String hostname, int port) {
    }

    private enum Component {
        PATH {
            @Override
            boolean allows(char value) {
                return value != '"' && value != '#' && value != '<' && value != '>'
                    && value != '?' && value != '^' && value != '`' && value != '{' && value != '}';
            }
        },
        QUERY {
            @Override
            boolean allows(char value) {
                return value != '"' && value != '#' && value != '<' && value != '>' && value != '\'';
            }
        },
        FRAGMENT {
            @Override
            boolean allows(char value) {
                return value != '"' && value != '<' && value != '>' && value != '`';
            }
        },
        USERINFO {
            @Override
            boolean allows(char value) {
                return Character.isLetterOrDigit(value)
                    || "!$&'()*+,-._~".indexOf(value) >= 0;
            }
        };

        abstract boolean allows(char value);
    }
}

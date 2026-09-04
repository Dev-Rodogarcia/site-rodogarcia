package br.com.rodogarcia.site.backend.security;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import br.com.rodogarcia.site.backend.config.JavascriptNumber;

/** Subconjunto literal de proxy-addr usado pelo `trust proxy` do Express. */
final class ProxyAddressMatcher {

    private static final List<String> LOOPBACK = List.of("127.0.0.1/8", "::1/128");
    private static final List<String> LINK_LOCAL = List.of("169.254.0.0/16", "fe80::/10");
    private static final List<String> UNIQUE_LOCAL = List.of(
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "fc00::/7"
    );

    private final List<Subnet> subnets;

    ProxyAddressMatcher(String expression) {
        List<String> notations = new ArrayList<>();
        for (String item : expression.split(",", -1)) {
            String notation = JavascriptNumber.trim(item);
            switch (notation) {
                case "loopback" -> notations.addAll(LOOPBACK);
                case "linklocal" -> notations.addAll(LINK_LOCAL);
                case "uniquelocal" -> notations.addAll(UNIQUE_LOCAL);
                default -> notations.add(notation);
            }
        }
        this.subnets = notations.stream().map(ProxyAddressMatcher::parseSubnet).toList();
    }

    boolean matches(String candidate) {
        byte[] address;
        try {
            address = parseLiteral(candidate);
        } catch (IllegalArgumentException ignored) {
            return false;
        }
        for (Subnet subnet : subnets) {
            byte[] comparable = convert(address, subnet.address().length);
            if (comparable != null && prefixMatches(comparable, subnet.address(), subnet.prefix())) {
                return true;
            }
        }
        return false;
    }

    private static Subnet parseSubnet(String notation) {
        int slash = notation.lastIndexOf('/');
        String literal = slash < 0 ? notation : notation.substring(0, slash);
        byte[] address = parseLiteral(literal);
        int maximum = address.length * Byte.SIZE;
        int prefix = maximum;
        if (slash >= 0) {
            String range = notation.substring(slash + 1);
            if (address.length == 4 && range.indexOf('.') >= 0) {
                prefix = netmaskPrefix(parseIpv4(range));
            } else {
                try {
                    prefix = Integer.parseInt(range);
                } catch (NumberFormatException error) {
                    throw invalid(notation, error);
                }
            }
            // proxy-addr rejeita /0 (inclusive quando veio de uma máscara
            // 0.0.0.0) antes de instalar a função de confiança do Express.
            if (prefix <= 0 || prefix > maximum) {
                throw invalid(notation, null);
            }
        }
        return new Subnet(address, prefix);
    }

    private static byte[] parseLiteral(String value) {
        if (value.matches("(?i)(?:0?\\d+|0x[0-9a-f]+)(?:\\.(?:0?\\d+|0x[0-9a-f]+)){3}")
            || value.matches("(?i)(?:0?\\d+|0x[0-9a-f]+)")) {
            return parseIpv4(value);
        }
        if (!value.contains(":")) {
            throw invalid(value, null);
        }
        try {
            return InetAddress.getByName(value).getAddress();
        } catch (UnknownHostException error) {
            throw invalid(value, error);
        }
    }

    private static byte[] parseIpv4(String value) {
        String[] parts = value.split("\\.", -1);
        if (parts.length == 1) {
            long address = parseIpv4Part(parts[0]);
            if (address < 0 || address > 0xffff_ffffL) {
                throw invalid(value, null);
            }
            return new byte[] {
                (byte) (address >>> 24),
                (byte) (address >>> 16),
                (byte) (address >>> 8),
                (byte) address
            };
        }
        if (parts.length != 4) {
            throw invalid(value, null);
        }
        byte[] result = new byte[4];
        for (int index = 0; index < parts.length; index++) {
            long part = parseIpv4Part(parts[index]);
            if (part < 0 || part > 255) {
                throw invalid(value, null);
            }
            result[index] = (byte) part;
        }
        return result;
    }

    private static long parseIpv4Part(String value) {
        try {
            if (value.regionMatches(true, 0, "0x", 0, 2)) {
                return Long.parseLong(value.substring(2), 16);
            }
            int radix = value.length() > 1 && value.charAt(0) == '0' ? 8 : 10;
            // parseInt(..., 8), usado pelo ipaddr.js, para no primeiro 8/9.
            long result = 0;
            boolean consumed = false;
            for (int index = 0; index < value.length(); index++) {
                int digit = Character.digit(value.charAt(index), radix);
                if (digit < 0) {
                    break;
                }
                consumed = true;
                result = Math.addExact(Math.multiplyExact(result, radix), digit);
            }
            return consumed ? result : -1;
        } catch (ArithmeticException | NumberFormatException error) {
            throw invalid(value, error);
        }
    }

    private static int netmaskPrefix(byte[] netmask) {
        int prefix = 0;
        boolean foundZero = false;
        for (byte item : netmask) {
            for (int bit = 7; bit >= 0; bit--) {
                boolean one = ((item >>> bit) & 1) == 1;
                if (!one) {
                    foundZero = true;
                } else if (foundZero) {
                    throw invalid(Arrays.toString(netmask), null);
                } else {
                    prefix++;
                }
            }
        }
        return prefix;
    }

    private static byte[] convert(byte[] address, int expectedLength) {
        if (address.length == expectedLength) {
            return address;
        }
        if (expectedLength == 16 && address.length == 4) {
            byte[] mapped = new byte[16];
            mapped[10] = (byte) 0xff;
            mapped[11] = (byte) 0xff;
            System.arraycopy(address, 0, mapped, 12, 4);
            return mapped;
        }
        if (expectedLength == 4 && isIpv4Mapped(address)) {
            return Arrays.copyOfRange(address, 12, 16);
        }
        return null;
    }

    private static boolean isIpv4Mapped(byte[] address) {
        if (address.length != 16 || address[10] != (byte) 0xff || address[11] != (byte) 0xff) {
            return false;
        }
        for (int index = 0; index < 10; index++) {
            if (address[index] != 0) {
                return false;
            }
        }
        return true;
    }

    private static boolean prefixMatches(byte[] candidate, byte[] subnet, int prefix) {
        int wholeBytes = prefix / Byte.SIZE;
        int remainingBits = prefix % Byte.SIZE;
        for (int index = 0; index < wholeBytes; index++) {
            if (candidate[index] != subnet[index]) {
                return false;
            }
        }
        if (remainingBits == 0) {
            return true;
        }
        int mask = 0xff << (Byte.SIZE - remainingBits);
        return (candidate[wholeBytes] & mask) == (subnet[wholeBytes] & mask);
    }

    private static IllegalArgumentException invalid(String value, Exception cause) {
        return new IllegalArgumentException("TRUST_PROXY contém endereço ou faixa inválida: " + value, cause);
    }

    private record Subnet(byte[] address, int prefix) {
    }
}

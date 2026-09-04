package br.com.rodogarcia.cms.backend.security;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import br.com.rodogarcia.cms.backend.config.CmsProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/** Reproduz a seleção de {@code req.ip} do Express/proxy-addr para TRUST_PROXY. */
@Component
public class ClientIpResolver {

    private static final Set<String> DISABLED = Set.of("", "false", "0");
    private final TrustMode mode;
    private final double trustedHops;
    private final List<Subnet> trustedSubnets;

    public ClientIpResolver(CmsProperties properties) {
        String setting = properties.trustProxy().trim();
        String normalized = setting.toLowerCase(Locale.ROOT);
        if (DISABLED.contains(normalized)) {
            mode = TrustMode.NONE;
            trustedHops = 0;
            trustedSubnets = List.of();
        } else if (normalized.equals("true")) {
            mode = TrustMode.ALL;
            trustedHops = Integer.MAX_VALUE;
            trustedSubnets = List.of();
        } else if (nonNegativeInteger(normalized) != null) {
            mode = TrustMode.HOPS;
            trustedHops = nonNegativeInteger(normalized);
            trustedSubnets = List.of();
        } else {
            mode = TrustMode.SUBNETS;
            trustedHops = 0;
            trustedSubnets = parseSubnets(setting);
        }
    }

    public String resolve(HttpServletRequest request) {
        String remote = usable(request.getRemoteAddr());
        if (mode == TrustMode.NONE) return remote;

        List<String> addresses = new ArrayList<>();
        addresses.add(remote);
        List<String> forwardedAddresses = new ArrayList<>();
        var headers = request.getHeaders("X-Forwarded-For");
        while (headers != null && headers.hasMoreElements()) {
            String header = headers.nextElement();
            if (header != null) forwardedAddresses.addAll(Arrays.asList(header.split(",")));
        }
        for (int index = forwardedAddresses.size() - 1; index >= 0; index--) {
            String candidate = forwardedAddresses.get(index).trim();
            if (!candidate.isEmpty()) addresses.add(candidate);
        }
        if (mode == TrustMode.ALL) return addresses.getLast();
        if (mode == TrustMode.HOPS) {
            int index = trustedHops >= addresses.size() - 1
                ? addresses.size() - 1 : (int) trustedHops;
            return addresses.get(index);
        }
        for (int index = 0; index < addresses.size() - 1; index++) {
            if (!isTrusted(addresses.get(index))) return addresses.get(index);
        }
        return addresses.getLast();
    }

    private boolean isTrusted(String address) {
        byte[] candidate = literalAddress(address);
        if (candidate == null) return false;
        return trustedSubnets.stream().anyMatch(subnet -> subnet.contains(candidate));
    }

    private static List<Subnet> parseSubnets(String setting) {
        List<Subnet> result = new ArrayList<>();
        for (String raw : setting.split(",")) {
            String value = raw.trim();
            switch (value) {
                case "loopback" -> addAll(result, "127.0.0.0/8", "::1/128");
                case "linklocal" -> addAll(result, "169.254.0.0/16", "fe80::/10");
                case "uniquelocal" -> addAll(
                    result, "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fc00::/7"
                );
                case "" -> throw new IllegalStateException("TRUST_PROXY contém regra vazia.");
                default -> result.add(Subnet.parse(value));
            }
        }
        return List.copyOf(result);
    }

    private static void addAll(List<Subnet> target, String... values) {
        Arrays.stream(values).map(Subnet::parse).forEach(target::add);
    }

    private static String usable(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }

    private static byte[] literalAddress(String value) {
        if (value == null || value.isEmpty()) return null;
        byte[] ipv4 = ipv4Literal(value);
        if (ipv4 != null) return ipv4;
        if (!value.contains(":")) return null;
        try {
            return InetAddress.getByName(value).getAddress();
        } catch (UnknownHostException ignored) {
            return null;
        }
    }

    private static Double nonNegativeInteger(String source) {
        try {
            double parsed;
            if (source.matches("0[xX][0-9a-fA-F]+")) {
                parsed = new BigInteger(source.substring(2), 16).doubleValue();
            } else if (source.matches("0[bB][01]+")) {
                parsed = new BigInteger(source.substring(2), 2).doubleValue();
            } else if (source.matches("0[oO][0-7]+")) {
                parsed = new BigInteger(source.substring(2), 8).doubleValue();
            } else {
                parsed = Double.parseDouble(source);
            }
            return Double.isFinite(parsed) && parsed >= 0d && parsed == Math.rint(parsed)
                ? parsed : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static byte[] ipv4Literal(String source) {
        String[] components = source.split("\\.", -1);
        try {
            if (components.length == 1) {
                BigInteger value = ipv4Number(components[0]);
                if (value == null || value.signum() < 0 || value.bitLength() > 32) return null;
                long numeric = value.longValue();
                return new byte[] {
                    (byte) (numeric >>> 24), (byte) (numeric >>> 16),
                    (byte) (numeric >>> 8), (byte) numeric
                };
            }
            if (components.length != 4) return null;
            byte[] result = new byte[4];
            for (int index = 0; index < components.length; index++) {
                BigInteger value = ipv4Number(components[index]);
                if (value == null || value.signum() < 0 || value.compareTo(BigInteger.valueOf(255)) > 0) {
                    return null;
                }
                result[index] = (byte) value.intValue();
            }
            return result;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static BigInteger ipv4Number(String source) {
        if (source.matches("0[xX][0-9a-fA-F]+")) return new BigInteger(source.substring(2), 16);
        if (source.length() > 1 && source.startsWith("0")) {
            return source.matches("0[0-7]*") ? new BigInteger(source.substring(1), 8) : null;
        }
        return source.matches("[0-9]+") ? new BigInteger(source, 10) : null;
    }

    private enum TrustMode { NONE, ALL, HOPS, SUBNETS }

    private record Subnet(byte[] network, int prefixLength) {

        static Subnet parse(String source) {
            String[] parts = source.split("/", -1);
            byte[] address = literalAddress(parts[0]);
            if (address == null || parts.length > 2) {
                throw new IllegalStateException("TRUST_PROXY contém IP ou CIDR inválido.");
            }
            int bits = address.length * Byte.SIZE;
            int prefix = bits;
            if (parts.length == 2) {
                prefix = parsePrefix(parts[1], address.length);
            }
            if (prefix <= 0 || prefix > bits) {
                throw new IllegalStateException("TRUST_PROXY contém IP ou CIDR inválido.");
            }
            byte[] masked = address.clone();
            mask(masked, prefix);
            return new Subnet(masked, prefix);
        }

        boolean contains(byte[] candidate) {
            if (candidate.length != network.length) return false;
            byte[] masked = candidate.clone();
            mask(masked, prefixLength);
            return Arrays.equals(network, masked);
        }

        private static void mask(byte[] value, int prefix) {
            int fullBytes = prefix / Byte.SIZE;
            int remainingBits = prefix % Byte.SIZE;
            if (remainingBits != 0 && fullBytes < value.length) {
                value[fullBytes] &= (byte) (0xff << (Byte.SIZE - remainingBits));
                fullBytes++;
            }
            Arrays.fill(value, fullBytes, value.length, (byte) 0);
        }

        private static int parsePrefix(String source, int addressLength) {
            if (source.matches("[0-9]+")) {
                try {
                    return Integer.parseInt(source);
                } catch (NumberFormatException error) {
                    throw new IllegalStateException("TRUST_PROXY contém IP ou CIDR inválido.", error);
                }
            }
            if (addressLength != 4) {
                throw new IllegalStateException("TRUST_PROXY contém IP ou CIDR inválido.");
            }
            byte[] netmask = ipv4Literal(source);
            if (netmask == null) {
                throw new IllegalStateException("TRUST_PROXY contém IP ou CIDR inválido.");
            }
            int prefix = 0;
            boolean sawZero = false;
            for (byte raw : netmask) {
                int value = raw & 0xff;
                for (int bit = 7; bit >= 0; bit--) {
                    boolean set = (value & (1 << bit)) != 0;
                    if (set && sawZero) {
                        throw new IllegalStateException("TRUST_PROXY contém IP ou CIDR inválido.");
                    }
                    if (set) prefix++;
                    else sawZero = true;
                }
            }
            return prefix;
        }
    }
}

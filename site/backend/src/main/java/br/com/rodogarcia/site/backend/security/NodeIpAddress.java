package br.com.rodogarcia.site.backend.security;

import java.net.InetAddress;
import java.net.UnknownHostException;

/** Formata o endereço do socket como o `net` do Node antes do rate limit. */
final class NodeIpAddress {

    private NodeIpAddress() {
    }

    static String canonicalRemote(String value) {
        if (!value.contains(":")) {
            return value;
        }
        String zone = "";
        String literal = value;
        int percent = value.indexOf('%');
        if (percent >= 0) {
            literal = value.substring(0, percent);
            zone = value.substring(percent);
        }
        try {
            InetAddress parsed = InetAddress.getByName(literal);
            byte[] address = parsed.getAddress();
            if (address.length == 4 && isMappedSyntax(literal)) {
                return "::ffff:" + ipv4(address) + zone;
            }
            if (address.length != 16) {
                return value;
            }
            return ipv6(address) + zone;
        } catch (UnknownHostException ignored) {
            return value;
        }
    }

    private static boolean isMappedSyntax(String value) {
        return value.toLowerCase(java.util.Locale.ROOT).contains("ffff:");
    }

    private static String ipv4(byte[] address) {
        return (address[0] & 0xff) + "." + (address[1] & 0xff) + "."
            + (address[2] & 0xff) + "." + (address[3] & 0xff);
    }

    private static String ipv6(byte[] address) {
        int[] words = new int[8];
        for (int index = 0; index < words.length; index++) {
            words[index] = ((address[index * 2] & 0xff) << 8) | (address[index * 2 + 1] & 0xff);
        }

        int bestStart = -1;
        int bestLength = 0;
        for (int index = 0; index < words.length;) {
            if (words[index] != 0) {
                index++;
                continue;
            }
            int end = index;
            while (end < words.length && words[end] == 0) {
                end++;
            }
            if (end - index > bestLength && end - index >= 2) {
                bestStart = index;
                bestLength = end - index;
            }
            index = end;
        }

        StringBuilder result = new StringBuilder();
        for (int index = 0; index < words.length;) {
            if (index == bestStart) {
                result.append("::");
                index += bestLength;
                continue;
            }
            if (!result.isEmpty() && result.charAt(result.length() - 1) != ':') {
                result.append(':');
            }
            result.append(Integer.toHexString(words[index]));
            index++;
        }
        return result.toString();
    }
}

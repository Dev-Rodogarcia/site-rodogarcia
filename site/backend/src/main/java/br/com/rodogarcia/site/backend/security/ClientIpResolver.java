package br.com.rodogarcia.site.backend.security;

import java.util.ArrayList;
import java.util.List;

import br.com.rodogarcia.site.backend.config.ApplicationProperties;
import br.com.rodogarcia.site.backend.config.TrustProxySetting;
import br.com.rodogarcia.site.backend.utils.NodeRequestHeaders;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class ClientIpResolver {

    private final TrustProxySetting setting;
    private final ProxyAddressMatcher expressionMatcher;

    public ClientIpResolver(ApplicationProperties properties) {
        this.setting = properties.trustProxy();
        this.expressionMatcher = setting.mode() == TrustProxySetting.Mode.EXPRESSION
            ? new ProxyAddressMatcher(setting.expression())
            : null;
    }

    public String resolve(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (remote == null || remote.isBlank()) {
            remote = "unknown";
        } else {
            remote = NodeIpAddress.canonicalRemote(remote);
        }
        List<String> chain = addressChain(
            remote,
            NodeRequestHeaders.commaJoined(request, "X-Forwarded-For")
        );
        return switch (setting.mode()) {
            case DISABLED -> remote;
            case ENABLED -> chain.get(chain.size() - 1);
            case HOPS -> chain.get(Math.min(setting.hops(), chain.size() - 1));
            case EXPRESSION -> resolveExpression(chain);
        };
    }

    private static List<String> addressChain(String remote, String forwardedFor) {
        List<String> chain = new ArrayList<>();
        chain.add(remote);
        if (forwardedFor == null || forwardedFor.isEmpty()) {
            return chain;
        }

        // Port literal de `forwarded`: só U+0020 é descartado. HTAB e outros
        // whitespaces fazem parte do endereço e não podem virar proxy confiável.
        int end = forwardedFor.length();
        int start = end;
        for (int index = forwardedFor.length() - 1; index >= 0; index--) {
            char character = forwardedFor.charAt(index);
            if (character == ' ') {
                if (start == end) {
                    start = end = index;
                }
            } else if (character == ',') {
                if (start != end) {
                    chain.add(forwardedFor.substring(start, end));
                }
                start = end = index;
            } else {
                start = index;
            }
        }
        if (start != end) {
            chain.add(forwardedFor.substring(start, end));
        }
        return chain;
    }

    private String resolveExpression(List<String> chain) {
        int index = 0;
        while (index < chain.size() - 1 && expressionMatcher.matches(chain.get(index))) {
            index += 1;
        }
        return chain.get(index);
    }
}

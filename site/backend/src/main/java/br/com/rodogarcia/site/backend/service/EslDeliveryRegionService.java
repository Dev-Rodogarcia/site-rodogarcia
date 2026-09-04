package br.com.rodogarcia.site.backend.service;

import java.text.Normalizer;
import java.time.Clock;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.regex.Pattern;

import br.com.rodogarcia.site.backend.dto.request.CityRequest;
import br.com.rodogarcia.site.backend.dto.request.PostalCityRequest;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.integration.esl.EslGraphqlClient;
import br.com.rodogarcia.site.backend.integration.esl.EslGraphqlDocuments;
import br.com.rodogarcia.site.backend.utils.EcmaScriptNumberFormatter;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** Resolve a filial ESL a partir do snapshot paginado de regiões de entrega. */
@Service
public class EslDeliveryRegionService {

    static final long CACHE_TTL_MILLIS = 5 * 60 * 1_000L;
    static final int PAGE_LIMIT = 100;
    static final int PAGE_SIZE = 100;

    private static final Locale PORTUGUESE_BRAZIL = Locale.forLanguageTag("pt-BR");
    private static final Pattern COMBINING_MARKS = Pattern.compile("[\\u0300-\\u036f]");

    private final EslGraphqlClient graphqlClient;
    private final Clock clock;
    private final Object cacheMonitor = new Object();

    private volatile DeliveryRegionCache cache;
    private CompletableFuture<List<DeliveryRegionSnapshot>> loading;

    public EslDeliveryRegionService(EslGraphqlClient graphqlClient, Clock clock) {
        this.graphqlClient = graphqlClient;
        this.clock = clock;
    }

    public String resolveCorporationCnpj(PostalCityRequest origin) {
        return resolveCorporationCnpj(origin.name(), origin.stateCode());
    }

    public String resolveCorporationCnpj(CityRequest origin) {
        return resolveCorporationCnpj(origin.name(), origin.stateCode());
    }

    private String resolveCorporationCnpj(String originName, String originStateCode) {
        String city = normalizeCity(originName);
        String stateCode = originStateCode.toUpperCase(Locale.ROOT);
        List<DeliveryRegionSnapshot> regions = getDeliveryRegions();
        List<DeliveryRegionSnapshot> matches = matchingRegions(regions, city, stateCode);

        if (matches.isEmpty()
            && ((normalizeCity("São Paulo").equals(city) && "SP".equals(stateCode))
                || (normalizeCity("Guarulhos").equals(city) && "SP".equals(stateCode)))) {
            matches = matchingRegions(regions, normalizeCity("Osasco"), "SP");
        }

        if (matches.isEmpty()) {
            throw new ApiException(
                422,
                "Ainda não atendemos a cidade de origem informada. "
                    + "Fale com nosso comercial para avaliar sua operação."
            );
        }

        Set<String> resolvedCnpjs = new LinkedHashSet<>();
        for (DeliveryRegionSnapshot region : matches) {
            String cnpj;
            if (region.corporationCnpjs().size() > 1) {
                cnpj = region.defaultCorporationCnpj();
            } else if (!region.corporationCnpjs().isEmpty()) {
                cnpj = region.corporationCnpjs().getFirst();
            } else {
                cnpj = region.defaultCorporationCnpj();
            }
            if (!cnpj.isEmpty()) {
                resolvedCnpjs.add(cnpj);
            }
        }
        if (resolvedCnpjs.size() != 1) {
            throw new ApiException(
                503,
                "Não foi possível definir a filial responsável pela operação."
            );
        }
        return resolvedCnpjs.iterator().next();
    }

    private static List<DeliveryRegionSnapshot> matchingRegions(
        List<DeliveryRegionSnapshot> regions,
        String city,
        String stateCode
    ) {
        return regions.stream()
            .filter(region -> region.cities().stream().anyMatch(item ->
                normalizeCity(item.name()).equals(city) && item.stateCode().equals(stateCode)
            ))
            .toList();
    }

    private List<DeliveryRegionSnapshot> getDeliveryRegions() {
        DeliveryRegionCache currentCache = cache;
        if (currentCache != null && currentCache.expiresAt() > clock.millis()) {
            return currentCache.regions();
        }

        CompletableFuture<List<DeliveryRegionSnapshot>> currentLoading;
        boolean owner = false;
        synchronized (cacheMonitor) {
            currentCache = cache;
            if (currentCache != null && currentCache.expiresAt() > clock.millis()) {
                return currentCache.regions();
            }
            currentLoading = loading;
            if (currentLoading == null) {
                currentLoading = new CompletableFuture<>();
                loading = currentLoading;
                owner = true;
            }
        }

        if (owner) {
            try {
                List<DeliveryRegionSnapshot> regions = List.copyOf(fetchDeliveryRegions());
                cache = new DeliveryRegionCache(clock.millis() + CACHE_TTL_MILLIS, regions);
                currentLoading.complete(regions);
            } catch (RuntimeException error) {
                currentLoading.completeExceptionally(error);
            } finally {
                synchronized (cacheMonitor) {
                    if (loading == currentLoading) {
                        loading = null;
                    }
                }
            }
        }

        try {
            return currentLoading.join();
        } catch (CompletionException error) {
            Throwable cause = error.getCause();
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            throw error;
        }
    }

    private List<DeliveryRegionSnapshot> fetchDeliveryRegions() {
        List<DeliveryRegionSnapshot> regions = new ArrayList<>();
        String after = "";

        for (int page = 0; page < PAGE_LIMIT; page++) {
            LinkedHashMap<String, Object> variables = new LinkedHashMap<>();
            variables.put("params", singleEntry("active", true));
            if (!after.isEmpty()) {
                variables.put("after", after);
            }
            variables.put("first", PAGE_SIZE);

            JsonNode data = graphqlClient.execute(EslGraphqlDocuments.DELIVERY_REGION, variables);
            JsonNode connection = objectProperty(data, "deliveryRegion");
            JsonNode nodes = connection == null ? null : connection.get("nodes");
            JsonNode pageInfo = connection == null ? null : objectProperty(connection, "pageInfo");
            if (nodes == null || !nodes.isArray() || pageInfo == null) {
                throw new ApiException(502, "O ESL não retornou as regiões de entrega.");
            }
            for (JsonNode node : nodes) {
                regions.add(deliveryRegionSnapshot(node));
            }

            JsonNode hasNextPage = pageInfo.get("hasNextPage");
            if (hasNextPage == null || !hasNextPage.isBoolean() || !hasNextPage.booleanValue()) {
                return regions;
            }
            after = asText(pageInfo.get("endCursor"), 500);
            if (after.isEmpty()) {
                throw new ApiException(
                    502,
                    "O ESL não retornou a próxima região de entrega."
                );
            }
        }

        throw new ApiException(
            502,
            "O ESL retornou mais regiões de entrega do que o esperado."
        );
    }

    private static DeliveryRegionSnapshot deliveryRegionSnapshot(JsonNode value) {
        List<DeliveryCity> cities = new ArrayList<>();
        JsonNode deliveryCities = value != null && value.isObject()
            ? value.get("deliveryCities")
            : null;
        if (deliveryCities != null && deliveryCities.isArray()) {
            for (JsonNode item : deliveryCities) {
                JsonNode city = objectProperty(item, "city");
                if (city == null) {
                    continue;
                }
                String name = asText(city.get("name"), 100);
                JsonNode state = objectProperty(city, "state");
                String stateCode = asText(state == null ? null : state.get("code"), 2)
                    .toUpperCase(Locale.ROOT);
                if (!name.isEmpty() && stateCode.matches("^[A-Z]{2}$")) {
                    cities.add(new DeliveryCity(name, stateCode));
                }
            }
        }

        Set<String> corporationCnpjs = new LinkedHashSet<>();
        JsonNode corporationLinks = value != null && value.isObject()
            ? value.get("deliveryRegionCorporations")
            : null;
        if (corporationLinks != null && corporationLinks.isArray()) {
            for (JsonNode item : corporationLinks) {
                String cnpj = corporationCnpj(objectProperty(item, "corporation"));
                if (!cnpj.isEmpty()) {
                    corporationCnpjs.add(cnpj);
                }
            }
        }

        return new DeliveryRegionSnapshot(
            List.copyOf(cities),
            corporationCnpj(value == null ? null : value.get("ediDefaultCorporation")),
            List.copyOf(corporationCnpjs)
        );
    }

    private static String corporationCnpj(JsonNode corporation) {
        JsonNode person = objectProperty(corporation, "person");
        return asCnpj(person == null ? null : person.get("cnpj"));
    }

    private static String asCnpj(JsonNode value) {
        String text = asText(value, 24).replaceAll("[^0-9]", "");
        return text.matches("^[0-9]{14}$") ? text : "";
    }

    private static JsonNode objectProperty(JsonNode value, String name) {
        if (value == null || !value.isObject()) {
            return null;
        }
        JsonNode property = value.get(name);
        return property != null && property.isObject() ? property : null;
    }

    private static String asText(JsonNode value, int maxLength) {
        if (value == null || !(value.isString() || value.isNumber())) {
            return "";
        }
        String text = value.isString()
            ? value.stringValue()
            : EcmaScriptNumberFormatter.format(value.doubleValue());
        text = NodeStringCompatibility.trim(text);
        return text.substring(0, Math.min(maxLength, text.length()));
    }

    private static String normalizeCity(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);
        return COMBINING_MARKS.matcher(normalized)
            .replaceAll("")
            .transform(NodeStringCompatibility::trim)
            .toLowerCase(PORTUGUESE_BRAZIL);
    }

    private static Map<String, Object> singleEntry(String key, Object value) {
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put(key, value);
        return result;
    }

    private record DeliveryCity(String name, String stateCode) {
    }

    private record DeliveryRegionSnapshot(
        List<DeliveryCity> cities,
        String defaultCorporationCnpj,
        List<String> corporationCnpjs
    ) {
    }

    private record DeliveryRegionCache(
        long expiresAt,
        List<DeliveryRegionSnapshot> regions
    ) {
    }
}

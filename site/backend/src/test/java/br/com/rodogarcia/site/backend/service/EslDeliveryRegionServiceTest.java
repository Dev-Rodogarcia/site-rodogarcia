package br.com.rodogarcia.site.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Map;

import br.com.rodogarcia.site.backend.dto.request.CityRequest;
import br.com.rodogarcia.site.backend.exception.ApiException;
import br.com.rodogarcia.site.backend.integration.esl.EslGraphqlClient;
import br.com.rodogarcia.site.backend.integration.esl.EslGraphqlDocuments;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class EslDeliveryRegionServiceTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private EslGraphqlClient graphqlClient;
    private MutableClock clock;
    private EslDeliveryRegionService service;

    @BeforeEach
    void setUp() {
        graphqlClient = mock(EslGraphqlClient.class);
        clock = new MutableClock(Instant.parse("2026-07-17T15:00:00Z"));
        service = new EslDeliveryRegionService(graphqlClient, clock);
    }

    @Test
    void paginatesWithCursorAndCachesTheCompleteSuccessfulSnapshot() throws Exception {
        when(graphqlClient.execute(eq(EslGraphqlDocuments.DELIVERY_REGION), anyMap()))
            .thenReturn(
                page("Agudos", "SP", "60960473001134", true, "cursor-1"),
                page("Osasco", "SP", "60960473000243", false, null)
            );

        assertThat(service.resolveCorporationCnpj(new CityRequest("Osasco", "SP")))
            .isEqualTo("60960473000243");
        assertThat(service.resolveCorporationCnpj(new CityRequest("Agudos", "SP")))
            .isEqualTo("60960473001134");

        ArgumentCaptor<Map<String, ?>> variables = mapCaptor();
        verify(graphqlClient, times(2)).execute(
            eq(EslGraphqlDocuments.DELIVERY_REGION),
            variables.capture()
        );
        assertThat(variables.getAllValues().get(0).get("first")).isEqualTo(100);
        assertThat(variables.getAllValues().get(0)).doesNotContainKey("after");
        assertThat(variables.getAllValues().get(1).get("first")).isEqualTo(100);
        assertThat(variables.getAllValues().get(1).get("after")).isEqualTo("cursor-1");
    }

    @Test
    void prefersDirectCityAndUsesOsascoOnlyAsSaoPauloFallback() throws Exception {
        when(graphqlClient.execute(eq(EslGraphqlDocuments.DELIVERY_REGION), anyMap()))
            .thenReturn(json("""
                {
                  "deliveryRegion": {
                    "nodes": [
                      {
                        "deliveryCities": [{"city":{"name":"Guarulhos","state":{"code":"SP"}}}],
                        "deliveryRegionCorporations": [{"corporation":{"person":{"cnpj":"60960473001134"}}}]
                      },
                      {
                        "deliveryCities": [{"city":{"name":"Osasco","state":{"code":"SP"}}}],
                        "deliveryRegionCorporations": [{"corporation":{"person":{"cnpj":"60960473000243"}}}]
                      }
                    ],
                    "pageInfo": {"endCursor":null,"hasNextPage":false}
                  }
                }
                """));

        assertThat(service.resolveCorporationCnpj(new CityRequest("Guarulhos", "SP")))
            .isEqualTo("60960473001134");
        assertThat(service.resolveCorporationCnpj(new CityRequest("São Paulo", "SP")))
            .isEqualTo("60960473000243");
    }

    @Test
    void trimsEcmaScriptWhitespaceInUpstreamCityFields() throws Exception {
        when(graphqlClient.execute(eq(EslGraphqlDocuments.DELIVERY_REGION), anyMap()))
            .thenReturn(page("\u00a0Osasco\ufeff", "\u3000SP\u2028", "60960473000243", false, null));

        assertThat(service.resolveCorporationCnpj(new CityRequest("Osasco", "SP")))
            .isEqualTo("60960473000243");
    }

    @Test
    void usesDefaultCorporationWhenRegionHasMoreThanOneAndRefreshesAtTtlBoundary()
        throws Exception {
        when(graphqlClient.execute(eq(EslGraphqlDocuments.DELIVERY_REGION), anyMap()))
            .thenReturn(
                multiCorporationPage("60960473000839"),
                multiCorporationPage("60960473000243")
            );

        CityRequest origin = new CityRequest("Toritama", "PE");
        assertThat(service.resolveCorporationCnpj(origin)).isEqualTo("60960473000839");
        clock.advanceMillis(EslDeliveryRegionService.CACHE_TTL_MILLIS);
        assertThat(service.resolveCorporationCnpj(origin)).isEqualTo("60960473000243");
        verify(graphqlClient, times(2)).execute(
            eq(EslGraphqlDocuments.DELIVERY_REGION),
            anyMap()
        );
    }

    @Test
    void rejectsPaginationThatClaimsAnotherPageWithoutCursor() throws Exception {
        when(graphqlClient.execute(eq(EslGraphqlDocuments.DELIVERY_REGION), anyMap()))
            .thenReturn(page("Osasco", "SP", "60960473000243", true, null));

        assertThatThrownBy(
            () -> service.resolveCorporationCnpj(new CityRequest("Osasco", "SP"))
        )
            .isInstanceOf(ApiException.class)
            .satisfies(error -> {
                ApiException apiError = (ApiException) error;
                assertThat(apiError.status()).isEqualTo(502);
                assertThat(apiError.getMessage())
                    .isEqualTo("O ESL não retornou a próxima região de entrega.");
            });
    }

    private JsonNode page(
        String city,
        String state,
        String cnpj,
        boolean hasNextPage,
        String endCursor
    ) throws Exception {
        String cursor = endCursor == null ? "null" : "\"" + endCursor + "\"";
        return json("""
            {
              "deliveryRegion": {
                "nodes": [{
                  "deliveryCities": [{"city":{"name":"%s","state":{"code":"%s"}}}],
                  "deliveryRegionCorporations": [{"corporation":{"person":{"cnpj":"%s"}}}]
                }],
                "pageInfo": {"endCursor":%s,"hasNextPage":%s}
              }
            }
            """.formatted(city, state, cnpj, cursor, hasNextPage));
    }

    private JsonNode multiCorporationPage(String defaultCnpj) throws Exception {
        return json("""
            {
              "deliveryRegion": {
                "nodes": [{
                  "deliveryCities": [{"city":{"name":"Toritama","state":{"code":"PE"}}}],
                  "ediDefaultCorporation": {"person":{"cnpj":"%s"}},
                  "deliveryRegionCorporations": [
                    {"corporation":{"person":{"cnpj":"60960473001134"}}},
                    {"corporation":{"person":{"cnpj":"60960473000839"}}}
                  ]
                }],
                "pageInfo": {"endCursor":null,"hasNextPage":false}
              }
            }
            """.formatted(defaultCnpj));
    }

    private JsonNode json(String value) throws Exception {
        return jsonMapper.readTree(value);
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    private static ArgumentCaptor<Map<String, ?>> mapCaptor() {
        return (ArgumentCaptor) ArgumentCaptor.forClass(Map.class);
    }

    private static final class MutableClock extends Clock {

        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        void advanceMillis(long milliseconds) {
            instant = instant.plusMillis(milliseconds);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}

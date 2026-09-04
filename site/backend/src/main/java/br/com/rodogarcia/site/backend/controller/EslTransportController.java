package br.com.rodogarcia.site.backend.controller;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.rodogarcia.site.backend.dto.request.CollectionCancellationRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionRequest;
import br.com.rodogarcia.site.backend.dto.request.CollectionUpdateRequest;
import br.com.rodogarcia.site.backend.dto.request.InvoiceLookupRequest;
import br.com.rodogarcia.site.backend.dto.request.QuoteRequest;
import br.com.rodogarcia.site.backend.model.RateLimitPolicy;
import br.com.rodogarcia.site.backend.security.EslOperationTokenService;
import br.com.rodogarcia.site.backend.security.RequestPolicy;
import br.com.rodogarcia.site.backend.service.EslTransportService;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import br.com.rodogarcia.site.backend.utils.NodeRequestHeaders;
import br.com.rodogarcia.site.backend.utils.NodeRoutePathParameter;
import br.com.rodogarcia.site.backend.validation.EslRequestParser;
import br.com.rodogarcia.site.backend.validation.ParsedJsonBody;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import tools.jackson.databind.node.StringNode;

@Controller
public class EslTransportController {

    private static final String NO_STORE = "no-store";
    private static final String COLLECTION_CAPABILITY_HEADER = "x-collection-capability";

    private final EslTransportService transportService;
    private final EslRequestParser requestParser;
    private final EslOperationTokenService tokenService;
    private final RequestPolicy requestPolicy;
    private final ExpressJsonResponse jsonResponse;

    public EslTransportController(
        EslTransportService transportService,
        EslRequestParser requestParser,
        EslOperationTokenService tokenService,
        RequestPolicy requestPolicy,
        ExpressJsonResponse jsonResponse
    ) {
        this.transportService = transportService;
        this.requestParser = requestParser;
        this.tokenService = tokenService;
        this.requestPolicy = requestPolicy;
        this.jsonResponse = jsonResponse;
    }

    @RequestMapping(
        path = { "/api/quote/fractional", "/api/quote/fractional/" },
        method = RequestMethod.POST
    )
    public void createFractionalQuote(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        requestPolicy.requirePublicMutation(request, RateLimitPolicy.ESL_QUOTE);
        QuoteRequest input = requestParser.parseQuote(ParsedJsonBody.from(request));
        Map<String, Object> quote = transportService.createFractionalQuote(input);
        jsonResponse.write(
            request,
            response,
            HttpServletResponse.SC_CREATED,
            singleEntry("quote", quote)
        );
    }

    @RequestMapping(
        path = { "/api/quote/closed/whatsapp", "/api/quote/closed/whatsapp/" },
        method = RequestMethod.POST
    )
    public void prepareClosedQuoteWhatsapp(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        requestPolicy.requirePublicMutation(request, RateLimitPolicy.ESL_QUOTE);
        QuoteRequest input = requestParser.parseQuote(ParsedJsonBody.from(request));
        Map<String, Object> result = transportService.prepareClosedQuoteWhatsapp(input);
        jsonResponse.write(request, response, HttpServletResponse.SC_OK, result);
    }

    @RequestMapping(
        path = {
            "/api/collections/invoice-validation",
            "/api/collections/invoice-validation/"
        },
        method = RequestMethod.POST
    )
    public void validateCollectionInvoice(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        requestPolicy.requirePublicMutation(
            request,
            RateLimitPolicy.ESL_INVOICE_VALIDATION
        );
        InvoiceLookupRequest input = requestParser.parseInvoiceLookup(
            ParsedJsonBody.from(request)
        );
        Map<String, Object> result = transportService.validateCollectionInvoice(input);
        response.setHeader("Cache-Control", NO_STORE);
        jsonResponse.write(request, response, HttpServletResponse.SC_OK, result);
    }

    @RequestMapping(
        path = { "/api/collections", "/api/collections/" },
        method = RequestMethod.POST
    )
    public void createCollection(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        requestPolicy.requirePublicMutation(request, RateLimitPolicy.ESL_COLLECTION_CREATE);
        CollectionRequest input = requestParser.parseCollectionCreate(ParsedJsonBody.from(request));
        Map<String, Object> result = transportService.createCollection(input);
        response.setHeader("Cache-Control", NO_STORE);
        int status = Boolean.TRUE.equals(result.get("requiresWhatsApp"))
            ? HttpServletResponse.SC_OK
            : HttpServletResponse.SC_CREATED;
        jsonResponse.write(request, response, status, result);
    }

    @RequestMapping(
        path = { "/api/collections/{id}", "/api/collections/{id}/" },
        method = RequestMethod.PATCH
    )
    public void updateCollection(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        String rawId = NodeRoutePathParameter.single(request, "/api/collections/", "");
        requestPolicy.requirePublicMutation(
            request,
            RateLimitPolicy.ESL_COLLECTION_MAINTENANCE
        );
        tokenService.requireCollectionMaintenanceToken(
            NodeRequestHeaders.commaJoined(request, COLLECTION_CAPABILITY_HEADER),
            rawId
        );
        String id = requestParser.parseRemoteCollectionId(StringNode.valueOf(rawId));
        CollectionUpdateRequest input = requestParser.parseCollectionUpdate(
            ParsedJsonBody.from(request)
        );
        Map<String, Object> collection = transportService.updateCollection(id, input);
        response.setHeader("Cache-Control", NO_STORE);
        jsonResponse.write(
            request,
            response,
            HttpServletResponse.SC_OK,
            singleEntry("collection", collection)
        );
    }

    @RequestMapping(
        path = {
            "/api/collections/{id}/cancel",
            "/api/collections/{id}/cancel/"
        },
        method = RequestMethod.POST
    )
    public void cancelCollection(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        String rawId = NodeRoutePathParameter.single(request, "/api/collections/", "/cancel");
        requestPolicy.requirePublicMutation(
            request,
            RateLimitPolicy.ESL_COLLECTION_MAINTENANCE
        );
        tokenService.requireCollectionMaintenanceToken(
            NodeRequestHeaders.commaJoined(request, COLLECTION_CAPABILITY_HEADER),
            rawId
        );
        String id = requestParser.parseRemoteCollectionId(StringNode.valueOf(rawId));
        CollectionCancellationRequest input = requestParser.parseCollectionCancellation(
            ParsedJsonBody.from(request)
        );
        Map<String, Object> collection = transportService.cancelCollection(id, input);
        response.setHeader("Cache-Control", NO_STORE);
        jsonResponse.write(
            request,
            response,
            HttpServletResponse.SC_OK,
            singleEntry("collection", collection)
        );
    }

    private static Map<String, Object> singleEntry(String key, Object value) {
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put(key, value);
        return result;
    }
}

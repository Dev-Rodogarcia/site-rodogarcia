package br.com.rodogarcia.site.backend.controller;

import java.io.IOException;

import br.com.rodogarcia.site.backend.dto.response.CompanyAddressResponse;
import br.com.rodogarcia.site.backend.dto.response.PostalCodeLookupResponse;
import br.com.rodogarcia.site.backend.model.RateLimitPolicy;
import br.com.rodogarcia.site.backend.security.RequestPolicy;
import br.com.rodogarcia.site.backend.service.CompanyLookupService;
import br.com.rodogarcia.site.backend.service.ExpressJsonResponse;
import br.com.rodogarcia.site.backend.service.PostalCodeService;
import br.com.rodogarcia.site.backend.utils.NodeRoutePathParameter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class PublicLookupController {

    private final PostalCodeService postalCodeService;
    private final CompanyLookupService companyLookupService;
    private final RequestPolicy requestPolicy;
    private final ExpressJsonResponse jsonResponse;

    public PublicLookupController(
        PostalCodeService postalCodeService,
        CompanyLookupService companyLookupService,
        RequestPolicy requestPolicy,
        ExpressJsonResponse jsonResponse
    ) {
        this.postalCodeService = postalCodeService;
        this.companyLookupService = companyLookupService;
        this.requestPolicy = requestPolicy;
        this.jsonResponse = jsonResponse;
    }

    @RequestMapping(
        path = {
            "/api/public/postal-code/{postalCode}",
            "/api/public/postal-code/{postalCode}/"
        },
        method = { RequestMethod.GET, RequestMethod.HEAD }
    )
    public void lookupPostalCode(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        String postalCode = NodeRoutePathParameter.single(
            request,
            "/api/public/postal-code/",
            ""
        );
        requestPolicy.consume(request, RateLimitPolicy.PUBLIC_POSTAL_CODE);
        PostalCodeLookupResponse payload = postalCodeService.lookup(postalCode);
        jsonResponse.write(request, response, HttpServletResponse.SC_OK, payload);
    }

    @RequestMapping(
        path = {
            "/api/public/company/{cnpj}",
            "/api/public/company/{cnpj}/"
        },
        method = { RequestMethod.GET, RequestMethod.HEAD }
    )
    public void lookupCompany(
        HttpServletRequest request,
        HttpServletResponse response
    ) throws IOException {
        String cnpj = NodeRoutePathParameter.single(request, "/api/public/company/", "");
        requestPolicy.consume(request, RateLimitPolicy.PUBLIC_COMPANY_LOOKUP);
        CompanyAddressResponse payload = companyLookupService.lookup(cnpj);
        jsonResponse.write(request, response, HttpServletResponse.SC_OK, payload);
    }
}

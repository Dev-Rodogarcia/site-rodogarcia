package br.com.rodogarcia.cms.backend.service.content;

import java.util.Map;

import br.com.rodogarcia.cms.backend.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public final class ContentAuditTrailAdapter implements ContentAuditTrail {
    private final AuditService audit;

    public ContentAuditTrailAdapter(AuditService audit) {
        this.audit = audit;
    }

    @Override
    public void record(
        HttpServletRequest request,
        String action,
        String target,
        Map<String, String> metadata
    ) {
        audit.record(request, action, target, metadata);
    }
}

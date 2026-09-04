package br.com.rodogarcia.cms.backend.service.content;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

public interface ContentAuditTrail {
    void record(HttpServletRequest request, String action, String target, Map<String, String> metadata);
}

package br.com.rodogarcia.cms.backend.config;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

public record StoragePaths(
    Path root,
    Path privateRoot,
    Path content,
    Path siteTexts,
    Path contacts,
    Path quotes,
    Path popupConfig,
    Path popupLeads,
    Path popupEvents,
    Path users,
    Path cmsAccessProfiles,
    Path sessions,
    Path analytics,
    Path analyticsConfig,
    Path seoSettings,
    Path consentSettings,
    Path cookieConsents,
    Path leads,
    Path improvements,
    Path improvementAttachments,
    Path trackingEvents,
    Path auditLog,
    Path mediaLibrary,
    Path mediaSlots,
    Path mediaReplaceTransaction,
    Path rateLimits
) {

    public List<Path> fileTargets() {
        return List.of(
            content,
            siteTexts,
            contacts,
            quotes,
            popupConfig,
            popupLeads,
            popupEvents,
            users,
            cmsAccessProfiles,
            sessions,
            analytics,
            analyticsConfig,
            seoSettings,
            consentSettings,
            cookieConsents,
            leads,
            improvements,
            trackingEvents,
            auditLog,
            mediaLibrary,
            mediaSlots,
            mediaReplaceTransaction,
            rateLimits
        );
    }

    public List<Path> directoryTargets() {
        return List.of(root, privateRoot, improvementAttachments);
    }

    static StoragePaths from(Map<String, String> env, Path backendRoot, Path storageRoot) {
        Path privateRoot = storageRoot.resolve("private");
        return new StoragePaths(
            storageRoot,
            privateRoot,
            resolve(env, backendRoot, "CONTENT_STORE_PATH", storageRoot.resolve("content.json")),
            resolve(env, backendRoot, "SITE_TEXTS_STORE_PATH", storageRoot.resolve("site-texts.json")),
            resolve(env, backendRoot, "CONTACTS_STORE_PATH", storageRoot.resolve("contacts.json")),
            resolve(env, backendRoot, "QUOTES_STORE_PATH", storageRoot.resolve("quotes.json")),
            resolve(env, backendRoot, "POPUP_CONFIG_STORE_PATH", storageRoot.resolve("popup-config.json")),
            resolve(env, backendRoot, "POPUP_LEADS_STORE_PATH", storageRoot.resolve("popup-leads.json")),
            resolve(env, backendRoot, "POPUP_EVENTS_STORE_PATH", storageRoot.resolve("popup-events.json")),
            resolve(env, backendRoot, "USERS_STORE_PATH", privateRoot.resolve("users.json")),
            resolve(env, backendRoot, "CMS_ACCESS_PROFILES_STORE_PATH", privateRoot.resolve("cms-access-profiles.json")),
            resolve(env, backendRoot, "SESSIONS_STORE_PATH", privateRoot.resolve("sessions.json")),
            resolve(env, backendRoot, "ANALYTICS_STORE_PATH", privateRoot.resolve("analytics.json")),
            resolve(env, backendRoot, "ANALYTICS_CONFIG_PATH", privateRoot.resolve("analytics-config.json")),
            resolve(env, backendRoot, "SEO_SETTINGS_STORE_PATH", storageRoot.resolve("seo-settings.json")),
            resolve(env, backendRoot, "CONSENT_SETTINGS_STORE_PATH", storageRoot.resolve("consent-settings.json")),
            resolve(env, backendRoot, "COOKIE_CONSENTS_STORE_PATH", privateRoot.resolve("cookie-consents.json")),
            resolve(env, backendRoot, "LEADS_STORE_PATH", storageRoot.resolve("leads.json")),
            resolve(env, backendRoot, "IMPROVEMENTS_STORE_PATH", privateRoot.resolve("improvements.json")),
            resolve(env, backendRoot, "IMPROVEMENT_ATTACHMENTS_PATH", privateRoot.resolve("improvement-attachments")),
            resolve(env, backendRoot, "TRACKING_EVENTS_STORE_PATH", privateRoot.resolve("tracking-events.json")),
            resolve(env, backendRoot, "AUDIT_LOG_STORE_PATH", privateRoot.resolve("audit-log.json")),
            resolve(env, backendRoot, "MEDIA_LIBRARY_STORE_PATH", storageRoot.resolve("media-library.json")),
            resolve(env, backendRoot, "MEDIA_SLOTS_STORE_PATH", storageRoot.resolve("media-slots.json")),
            resolve(env, backendRoot, "MEDIA_REPLACE_TRANSACTION_PATH", privateRoot.resolve("media-replace-transaction.json")),
            resolve(env, backendRoot, "CMS_RATE_LIMITS_STORE_PATH", privateRoot.resolve("cms-rate-limits.json"))
        );
    }

    private static Path resolve(
        Map<String, String> env,
        Path backendRoot,
        String key,
        Path fallback
    ) {
        String override = env.get(key);
        return override == null || override.isEmpty()
            ? fallback.normalize()
            : CmsProperties.resolveAgainst(backendRoot, override);
    }
}

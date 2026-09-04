package br.com.rodogarcia.cms.backend.model.auth;

public final class SessionRecord {

    private String id;
    private String userId;
    private String csrfToken;
    private long createdAt;
    private long expiresAt;

    public SessionRecord() {
    }

    public SessionRecord(String id, String userId, String csrfToken, long createdAt, long expiresAt) {
        this.id = id;
        this.userId = userId;
        this.csrfToken = csrfToken;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public SessionRecord copy() {
        return new SessionRecord(id, userId, csrfToken, createdAt, expiresAt);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getCsrfToken() { return csrfToken; }
    public void setCsrfToken(String csrfToken) { this.csrfToken = csrfToken; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
    public long getExpiresAt() { return expiresAt; }
    public void setExpiresAt(long expiresAt) { this.expiresAt = expiresAt; }
}

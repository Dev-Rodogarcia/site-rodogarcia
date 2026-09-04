package br.com.rodogarcia.cms.backend.model.auth;

import java.util.ArrayList;
import java.util.List;

public final class UserRecord {

    private String id;
    private String email;
    private String name;
    private String role;
    private String createdAt;
    private String cmsTheme;
    private String passwordHash;
    private Boolean active;
    private Boolean isOwner;
    private Boolean mustChangePassword;
    private List<String> permissions;
    private String accessProfileId;
    private List<String> cmsPermissions;
    private List<CmsPermissionOverride> cmsPermissionOverrides;
    private String passwordResetRequestedAt;

    public UserRecord() {
    }

    public UserRecord copy() {
        UserRecord copy = new UserRecord();
        copy.id = id;
        copy.email = email;
        copy.name = name;
        copy.role = role;
        copy.createdAt = createdAt;
        copy.cmsTheme = cmsTheme;
        copy.passwordHash = passwordHash;
        copy.active = active;
        copy.isOwner = isOwner;
        copy.mustChangePassword = mustChangePassword;
        copy.permissions = permissions == null ? null : new ArrayList<>(permissions);
        copy.accessProfileId = accessProfileId;
        copy.cmsPermissions = cmsPermissions == null ? null : new ArrayList<>(cmsPermissions);
        copy.cmsPermissionOverrides = cmsPermissionOverrides == null
            ? null
            : cmsPermissionOverrides.stream().map(CmsPermissionOverride::copy).toList();
        copy.passwordResetRequestedAt = passwordResetRequestedAt;
        return copy;
    }

    public boolean isActive() {
        return !Boolean.FALSE.equals(active);
    }

    public boolean isAdmin() {
        return "admin".equals(role);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getCmsTheme() { return cmsTheme; }
    public void setCmsTheme(String cmsTheme) { this.cmsTheme = cmsTheme; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Boolean getIsOwner() { return isOwner; }
    public void setIsOwner(Boolean owner) { isOwner = owner; }
    public Boolean getMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(Boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
    public String getAccessProfileId() { return accessProfileId; }
    public void setAccessProfileId(String accessProfileId) { this.accessProfileId = accessProfileId; }
    public List<String> getCmsPermissions() { return cmsPermissions; }
    public void setCmsPermissions(List<String> cmsPermissions) { this.cmsPermissions = cmsPermissions; }
    public List<CmsPermissionOverride> getCmsPermissionOverrides() { return cmsPermissionOverrides; }
    public void setCmsPermissionOverrides(List<CmsPermissionOverride> cmsPermissionOverrides) { this.cmsPermissionOverrides = cmsPermissionOverrides; }
    public String getPasswordResetRequestedAt() { return passwordResetRequestedAt; }
    public void setPasswordResetRequestedAt(String passwordResetRequestedAt) { this.passwordResetRequestedAt = passwordResetRequestedAt; }
}

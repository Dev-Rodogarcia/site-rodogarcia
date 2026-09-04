package br.com.rodogarcia.cms.backend.model.auth;

import java.util.ArrayList;
import java.util.List;

public final class CmsAccessProfile {

    private String id;
    private String name;
    private String description;
    private List<String> permissions;
    private Boolean active;
    private String createdAt;
    private String updatedAt;

    public CmsAccessProfile() {
    }

    public CmsAccessProfile copy() {
        CmsAccessProfile copy = new CmsAccessProfile();
        copy.id = id;
        copy.name = name;
        copy.description = description;
        copy.permissions = permissions == null ? null : new ArrayList<>(permissions);
        copy.active = active;
        copy.createdAt = createdAt;
        copy.updatedAt = updatedAt;
        return copy;
    }

    public boolean isActive() { return !Boolean.FALSE.equals(active); }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}

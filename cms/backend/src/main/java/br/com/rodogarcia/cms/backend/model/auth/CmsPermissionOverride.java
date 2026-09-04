package br.com.rodogarcia.cms.backend.model.auth;

public final class CmsPermissionOverride {

    private String permission;
    private String effect;

    public CmsPermissionOverride() {
    }

    public CmsPermissionOverride(String permission, String effect) {
        this.permission = permission;
        this.effect = effect;
    }

    public CmsPermissionOverride copy() {
        return new CmsPermissionOverride(permission, effect);
    }

    public String getPermission() { return permission; }
    public void setPermission(String permission) { this.permission = permission; }
    public String getEffect() { return effect; }
    public void setEffect(String effect) { this.effect = effect; }
}

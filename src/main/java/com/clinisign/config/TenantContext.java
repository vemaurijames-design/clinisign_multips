package com.clinisign.config;

public final class TenantContext {
    private static final ThreadLocal<Long> CURRENT_IPS_ID = new ThreadLocal<>();

    private TenantContext() {}

    public static void setIpsId(Long ipsId) {
        CURRENT_IPS_ID.set(ipsId);
    }

    public static Long getIpsId() {
        return CURRENT_IPS_ID.get();
    }

    public static void clear() {
        CURRENT_IPS_ID.remove();
    }
}

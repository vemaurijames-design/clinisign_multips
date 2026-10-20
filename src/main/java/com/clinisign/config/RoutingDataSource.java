package com.clinisign.config;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RoutingDataSource extends AbstractRoutingDataSource {

    private final Map<Object, Object> liveTargets = new ConcurrentHashMap<>();

    public RoutingDataSource() {
        setTargetDataSources(liveTargets);
        setLenientFallback(true);
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getIpsId();
    }

    public synchronized void addDataSource(Long ipsId, DataSource dataSource) {
        if (ipsId == null || dataSource == null) {
            return;
        }
        liveTargets.put(ipsId, dataSource);
        setTargetDataSources(new ConcurrentHashMap<>(liveTargets));
        afterPropertiesSet();
    }

    public boolean hasTenant(Long ipsId) {
        return liveTargets.containsKey(ipsId);
    }
}

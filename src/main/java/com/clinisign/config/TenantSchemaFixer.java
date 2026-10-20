package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TenantSchemaFixer implements ApplicationRunner {
    private final IpsRepository ipsRepository;
    private final DataSourceManager dataSourceManager;

    @Override
    public void run(ApplicationArguments args) {
        for (Ips ips : ipsRepository.findAll()) {
            try {
                dataSourceManager.getDataSource(ips.getId());
                log.info("Esquema tenant actualizado: {} ({})", ips.getBdNombre(), ips.getId());
            } catch (Exception e) {
                log.warn("No se pudo parchear {}: {}", ips.getBdNombre(), e.getMessage());
            }
        }
    }
}

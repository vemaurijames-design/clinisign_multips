package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.tenant.service.CitaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AgendaScheduler {

    private final IpsRepository ipsRepository;
    private final DataSourceManager dataSourceManager;
    private final CitaService citaService;

    @Scheduled(fixedDelayString = "${clinisign.agenda.scheduler-ms:60000}")
    public void recordarCitas() {
        for (Ips ips : ipsRepository.findByActivoTrue()) {
            try {
                dataSourceManager.getDataSource(ips.getId());
                TenantContext.setIpsId(ips.getId());
                int n = citaService.procesarRecordatoriosPendientes();
                if (n > 0) log.info("IPS {} recordatorios enviados: {}", ips.getNombre(), n);
            } catch (Exception e) {
                log.warn("Agenda IPS {}: {}", ips.getId(), e.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }
}

package com.clinisign.master.service;

import com.clinisign.config.DataSourceManager;
import com.clinisign.master.dto.IpsDTO;
import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class IpsProvisioningService {

    private final IpsRepository ipsRepository;
    private final DataSourceManager dataSourceManager;

    @Transactional("masterTransactionManager")
    public Ips crearIps(IpsDTO dto) {
        if (dto.getNit() == null || dto.getNit().isBlank()) {
            throw new RuntimeException("El NIT es obligatorio");
        }
        if (ipsRepository.findByNit(dto.getNit()).isPresent()) {
            throw new RuntimeException("Ya existe una IPS con NIT " + dto.getNit());
        }
        Ips ips = new Ips();
        ips.setNombre(dto.getNombre());
        ips.setNit(dto.getNit());
        ips.setDv(dto.getDv());
        ips.setDireccion(dto.getDireccion());
        ips.setCiudad(dto.getCiudad());
        ips.setTelefono(dto.getTelefono());
        ips.setCorreo(dto.getCorreo());
        ips.setRepresentante(dto.getRepresentante());
        ips.setCcRepresentante(dto.getCcRepresentante());
        ips.setSuplente(dto.getSuplente());
        ips.setCcSuplente(dto.getCcSuplente());
        ips.setLogoUrl(dto.getLogoUrl());
        ips.setActivo(true);
        ips.setBdNombre("ips_" + dto.getNit().replaceAll("[^0-9A-Za-z]", ""));
        ips = ipsRepository.save(ips);

        dataSourceManager.provisionTenant(
                ips,
                dto.getAdminEmail(),
                dto.getAdminPassword(),
                dto.getAdminNombre(),
                dto.getAdminDocumento()
        );
        return ips;
    }
}

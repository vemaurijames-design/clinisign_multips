package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.PlantillaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlantillaDocumentoRepository extends JpaRepository<PlantillaDocumento, Long> {
    List<PlantillaDocumento> findByActivaTrue();
    List<PlantillaDocumento> findByTipoAndActivaTrue(String tipo);
    PlantillaDocumento findFirstByTipoAndActivaTrueOrderByIdDesc(String tipo);
}
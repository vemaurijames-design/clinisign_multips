package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.Consentimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsentimientoRepository extends JpaRepository<Consentimiento, Long> {
    List<Consentimiento> findByHistoriaClinicaId(Long id);
    List<Consentimiento> findByDocumentoOrderByIdDesc(String documento);
    long countByTipo(String tipo);
}

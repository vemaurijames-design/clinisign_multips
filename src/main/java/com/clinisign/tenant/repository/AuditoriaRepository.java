package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findTop80ByOrderByFechaDesc();
}
package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.SolicitudServicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SolicitudRepository extends JpaRepository<SolicitudServicio, Long> {
    List<SolicitudServicio> findByEstado(String estado);
}

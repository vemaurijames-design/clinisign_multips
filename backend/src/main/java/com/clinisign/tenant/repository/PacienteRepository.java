package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByDocumento(String documento);
    Optional<Paciente> findByDocumentoAndActivoTrue(String documento);
}
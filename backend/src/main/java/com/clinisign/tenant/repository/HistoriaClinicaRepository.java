package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long> {
    List<HistoriaClinica> findByPacienteId(Long id);

    @Query("SELECT COALESCE(MAX(h.consecutivo), 0) FROM HistoriaClinica h")
    Integer findMaxConsecutivo();
}
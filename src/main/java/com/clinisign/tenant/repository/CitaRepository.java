package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByEstado(String estado);
    List<Cita> findByFechaHoraBetweenOrderByFechaHoraAsc(Date desde, Date hasta);
    List<Cita> findByRecordatorioEnviadoFalseAndEstadoIn(List<String> estados);
    List<Cita> findByPacienteIdOrderByFechaHoraDesc(Long pacienteId);
    long countByFechaHoraBetween(Date desde, Date hasta);
    long countByEstado(String estado);
}

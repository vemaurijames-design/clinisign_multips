package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    // ✅ Busca notificaciones por la solicitud asociada
    List<Notificacion> findByEntidadId(Long entidadId);

    // ✅ Últimas 30 notificaciones sin filtro de rol (para SUPERADMIN / ADMINIPS / RADIOPERADOR)
    List<Notificacion> findTop30ByOrderByFechaCreacionDesc();

    // ✅ Últimas 30 notificaciones de un rol específico
    List<Notificacion> findTop30ByRolDestinoOrderByFechaCreacionDesc(String rolDestino);
}
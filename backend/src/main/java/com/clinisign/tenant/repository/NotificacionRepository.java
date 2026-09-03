package com.clinisign.tenant.repository;

import com.clinisign.tenant.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findTop30ByOrderByFechaCreacionDesc();
    List<Notificacion> findTop30ByRolDestinoOrderByFechaCreacionDesc(String rolDestino);
    List<Notificacion> findByRolDestinoOrderByFechaCreacionDesc(String rolDestino);
}

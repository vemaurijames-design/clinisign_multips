package com.clinisign.tenant.service;

import com.clinisign.tenant.entity.Notificacion;
import com.clinisign.tenant.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {
    private final NotificacionRepository repo;

    public List<Notificacion> listar(String rol) {
        try {
            List<Notificacion> list;
            if (rol == null || rol.isBlank() || "SUPERADMIN".equals(rol) || "ADMINIPS".equals(rol) || "RADIOPERADOR".equals(rol)) {
                list = repo.findTop30ByOrderByFechaCreacionDesc();
            } else {
                list = repo.findTop30ByRolDestinoOrderByFechaCreacionDesc(rol);
            }
            if (list == null || list.isEmpty()) {
                crear("SUPERADMIN", "CliniSign listo", "No hay avisos nuevos. Las solicitudes del radiooperador aparecerán aquí.", "SISTEMA");
                list = repo.findTop30ByOrderByFechaCreacionDesc();
            }
            return list;
        } catch (Exception e) {
            return List.of();
        }
    }

    public List<Notificacion> listarPorRol(String rol) {
        return listar(rol);
    }

    public List<Notificacion> listarLeidasPorRol(String rol) {
        return listar(rol);
    }

    public Notificacion crear(String rolDestino, String titulo, String mensaje, String modulo) {
        return crearNotificacion(rolDestino, titulo, mensaje, null, modulo);
    }

    public Notificacion crearNotificacion(String rolDestino, String titulo, String mensaje, Long entidadId) {
        return crearNotificacion(rolDestino, titulo, mensaje, entidadId, "SOLICITUDES");
    }

    public Notificacion crearNotificacion(String rolDestino, String titulo, String mensaje, Long entidadId, String modulo) {
        Notificacion n = new Notificacion();
        n.setRolDestino(rolDestino);
        n.setTipo(titulo != null ? titulo.replace(" ", "_") : "AVISO");
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setModulo(modulo);
        n.setEntidadId(entidadId);
        return repo.save(n);
    }

    public Notificacion marcarLeida(Long id) {
        Notificacion n = repo.findById(id).orElseThrow();
        n.setLeida(true);
        return repo.save(n);
    }

    public Notificacion marcarComoLeida(Long id) {
        return marcarLeida(id);
    }

    public Notificacion marcarComoLeida(Long id, String rol) {
        return marcarLeida(id);
    }
}
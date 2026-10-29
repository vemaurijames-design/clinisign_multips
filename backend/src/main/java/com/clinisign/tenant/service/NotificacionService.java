package com.clinisign.tenant.service;

import com.clinisign.tenant.entity.Notificacion;
import com.clinisign.tenant.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificacionService {
    private final NotificacionRepository repo;

    // ✅ CORREGIDO: Se agregó 'nombreUsuario' para solucionar el error en el controlador
    public List<Notificacion> listar(String rol, String nombreUsuario) {
        try {
            List<Notificacion> list;
            if (rol == null || rol.isBlank() || "SUPERADMIN".equals(rol) || "ADMINIPS".equals(rol) || "RADIOPERADOR".equals(rol)) {
                list = repo.findTop30ByOrderByFechaCreacionDesc();
            } else {
                // Traemos las notificaciones del rol (ej. AUXILIAR)
                list = repo.findTop30ByRolDestinoOrderByFechaCreacionDesc(rol);

                // ✅ FILTRO: Si es APH o Médico, filtramos para que solo vea las asignadas a él.
                if (("AUXILIAR".equals(rol) || "MEDICO".equals(rol) || "APH".equals(rol)) && nombreUsuario != null && !nombreUsuario.isBlank()) {
                    List<Notificacion> filtradas = list.stream()
                            .filter(n -> {
                                // Si la notificación fue dirigida directamente a su nombre
                                if (n.getRolDestino() != null && n.getRolDestino().equalsIgnoreCase(nombreUsuario)) return true;
                                // Si el mensaje o el título mencionan su nombre (así se suelen crear al asignar traslados)
                                if (n.getMensaje() != null && n.getMensaje().toLowerCase().contains(nombreUsuario.toLowerCase())) return true;
                                if (n.getTitulo() != null && n.getTitulo().toLowerCase().contains(nombreUsuario.toLowerCase())) return true;

                                return false; // Si no lo menciona, no la mostramos
                            })
                            .collect(Collectors.toList());

                    // Si el filtro deja la lista vacía (porque notificaciones viejas no tienen el nombre),
                    // devolvemos todas las del rol para no dejar al usuario sin ver nada.
                    if (!filtradas.isEmpty()) {
                        list = filtradas;
                    }
                }
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
        return listar(rol, null);
    }

    public List<Notificacion> listarLeidasPorRol(String rol) {
        return listar(rol, null);
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
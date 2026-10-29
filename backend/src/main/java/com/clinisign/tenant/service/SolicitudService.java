package com.clinisign.tenant.service;

import com.clinisign.config.ActorContext;
import com.clinisign.tenant.entity.Ambulancia;
import com.clinisign.tenant.entity.Notificacion;
import com.clinisign.tenant.entity.Paciente;
import com.clinisign.tenant.entity.SolicitudServicio;
import com.clinisign.tenant.repository.AmbulanciaRepository;
import com.clinisign.tenant.repository.NotificacionRepository;
import com.clinisign.tenant.repository.PacienteRepository;
import com.clinisign.tenant.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SolicitudService {
    private final SolicitudRepository repo;
    private final PacienteRepository pacRepo;
    private final AmbulanciaRepository ambRepo;
    private final NotificacionService notificacionService;
    private final NotificacionRepository notificacionRepo;
    private final AuditoriaService auditoria;

    public List<SolicitudServicio> listar() { return repo.findAll(); }
    public List<SolicitudServicio> porEstado(String estado) { return repo.findByEstado(estado); }
    public SolicitudServicio obtener(Long id) { return repo.findById(id).orElseThrow(); }

    public SolicitudServicio crear(Map<String, Object> body) {
        SolicitudServicio s = new SolicitudServicio();
        s.setOrigen(str(body.get("origen")));
        s.setDestino(str(body.get("destino")));
        s.setCiudadOrigen(str(body.get("ciudadOrigen")));
        s.setCiudadDestino(str(body.get("ciudadDestino")));
        s.setMotivo(str(body.get("motivo")));
        s.setPrioridad(str(body.getOrDefault("prioridad", "NORMAL")));
        s.setEstado("PENDIENTE");
        s.setRadioperador(str(body.get("radioperador")));
        if (s.getRadioperador() == null || s.getRadioperador().isBlank()) {
            s.setRadioperador(ActorContext.etiqueta());
        }
        s.setRegistradoPor(ActorContext.etiqueta());
        s.setObservaciones(str(body.get("observaciones")));
        Object pacId = body.get("pacienteId");
        if (pacId != null && !pacId.toString().isBlank()) {
            Paciente p = pacRepo.findById(Long.valueOf(pacId.toString())).orElseThrow();
            s.setPaciente(p);
        }
        if (body.get("asignadoA") != null) s.setAsignadoA(str(body.get("asignadoA")));
        s = repo.save(s);

        auditoria.registrar("SOLICITUDES", "CREAR", s.getId(), s.getOrigen() + " → " + s.getDestino());

        // Envía aviso a Auxiliares, Médicos, Radio y Admin
        aviso("AUXILIAR", "Nueva llamada de traslado", "Radio " + s.getRadioperador() + " registró " + s.getPrioridad() + ". Paciente: " + nombrePac(s) + ".", s.getId());
        aviso("MEDICO", "Nueva llamada de traslado", "Radio " + s.getRadioperador() + " registró " + s.getPrioridad() + ". Paciente: " + nombrePac(s) + ".", s.getId());
        aviso("RADIOPERADOR", "Solicitud creada", "Quedó " + s.getConsecutivo() + " en PENDIENTE.", s.getId());
        aviso("ADMINIPS", "Solicitud creada", "Quedó " + s.getConsecutivo() + " en PENDIENTE.", s.getId());
        return s;
    }

    public SolicitudServicio actualizar(Long id, Map<String, Object> body) {
        SolicitudServicio s = repo.findById(id).orElseThrow();
        if (body.containsKey("origen")) s.setOrigen(str(body.get("origen")));
        if (body.containsKey("destino")) s.setDestino(str(body.get("destino")));
        if (body.containsKey("motivo")) s.setMotivo(str(body.get("motivo")));
        if (body.containsKey("prioridad")) s.setPrioridad(str(body.get("prioridad")));
        if (body.containsKey("observaciones")) s.setObservaciones(str(body.get("observaciones")));
        if (body.containsKey("radioperador")) s.setRadioperador(str(body.get("radioperador")));
        if (body.containsKey("asignadoA")) s.setAsignadoA(str(body.get("asignadoA")));

        Object ambId = body.get("ambulanciaId");
        if (ambId != null && !ambId.toString().isBlank()) {
            Ambulancia a = ambRepo.findById(Long.valueOf(ambId.toString())).orElseThrow();
            s.setAmbulancia(a);
            s.setEstado("ASIGNADA");
            s.setHoraAsignacion(new Date());
            a.setEstado("EN_SERVICIO");
            ambRepo.save(a);

            String msg = (s.getAsignadoA() != null ? s.getAsignadoA() + ". " : "") + s.getConsecutivo() + " móvil " + a.getPlaca() + ". Paciente " + nombrePac(s) + ".";
            aviso("AUXILIAR", "Traslado asignado a usted", msg, s.getId());
            aviso("MEDICO", "Traslado asignado a usted", msg, s.getId());
            aviso("RADIOPERADOR", "Servicio asignado", s.getConsecutivo() + " → " + a.getPlaca(), s.getId());
            aviso("ADMINIPS", "Servicio asignado", s.getConsecutivo() + " → " + a.getPlaca(), s.getId());
        }

        if (body.containsKey("estado")) {
            String estado = str(body.get("estado"));
            s.setEstado(estado);

            if ("EN_RUTA".equals(estado)) {
                s.setHoraSalida(new Date());
                aviso("RADIOPERADOR", "APH en ruta", nombrePac(s) + " salió.", s.getId());
                aviso("ADMINIPS", "APH en ruta", nombrePac(s) + " salió.", s.getId());
            }

            if ("COMPLETADA".equals(estado) || "ENTREGADO".equals(estado)) {
                s.setEstado("COMPLETADA");
                s.setHoraLlegada(new Date());
                if (s.getAmbulancia() != null) {
                    s.getAmbulancia().setEstado("DISPONIBLE");
                    ambRepo.save(s.getAmbulancia());
                }

                // ✅ LIMPIAR NOTIFICACIONES DE TODOS LOS ROLES
                marcarNotificacionesComoLeidas(s.getId());

                // Aviso final (opcional, por si quieres que quede registro)
                aviso("RADIOPERADOR", "Servicio Completado", "El traslado " + s.getConsecutivo() + " ha finalizado.", s.getId());
            }

            if ("CANCELADA".equals(estado)) {
                s.setHoraLlegada(new Date());
                if (s.getAmbulancia() != null) {
                    s.getAmbulancia().setEstado("DISPONIBLE");
                    ambRepo.save(s.getAmbulancia());
                }

                // ✅ LIMPIAR NOTIFICACIONES DE TODOS LOS ROLES
                marcarNotificacionesComoLeidas(s.getId());

                aviso("RADIOPERADOR", "Servicio Cancelado", "El traslado " + s.getConsecutivo() + " ha sido cancelado.", s.getId());
            }
        }
        return repo.save(s);
    }

    // ✅ Esta función barre TODAS las notificaciones de esa solicitud, sin importar el rol, y las marca leídas.
    private void marcarNotificacionesComoLeidas(Long solicitudId) {
        try {
            List<Notificacion> notis = notificacionRepo.findByEntidadId(solicitudId);
            for (Notificacion n : notis) {
                n.setLeida(true);
                notificacionRepo.save(n);
            }
        } catch (Exception e) {
            System.err.println("Error marcando notificaciones: " + e.getMessage());
        }
    }

    private void aviso(String rol, String titulo, String mensaje, Long entidadId) {
        try {
            notificacionService.crearNotificacion(rol, titulo, mensaje, entidadId, "SOLICITUD");
        } catch (Exception ignored) {}
    }

    private String nombrePac(SolicitudServicio s) {
        if (s.getPaciente() == null) return "sin paciente";
        return (s.getPaciente().getNombre() == null ? "" : s.getPaciente().getNombre()) + " " + (s.getPaciente().getApellido() == null ? "" : s.getPaciente().getApellido());
    }

    public void eliminar(Long id) { repo.deleteById(id); }
    private String str(Object o) { return o == null ? null : o.toString(); }
}
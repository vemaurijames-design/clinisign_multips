package com.clinisign.tenant.service;

import com.clinisign.config.TenantContext;
import com.clinisign.config.WhatsAppService;
import com.clinisign.tenant.entity.Cita;
import com.clinisign.tenant.entity.Paciente;
import com.clinisign.tenant.repository.CitaRepository;
import com.clinisign.tenant.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CitaService {
    private final CitaRepository repo;
    private final PacienteRepository pacRepo;
    private final WhatsAppService whatsAppService;
    private final SimpleDateFormat sdfFecha = new SimpleDateFormat("dd/MM/yyyy");
    private final SimpleDateFormat sdfHora = new SimpleDateFormat("HH:mm");

    public List<Cita> listar() {
        return repo.findAll();
    }

    public List<Cita> hoy() {
        Date[] rango = rangoDia(new Date());
        return repo.findByFechaHoraBetweenOrderByFechaHoraAsc(rango[0], rango[1]);
    }

    public List<Cita> proximas() {
        Calendar cal = Calendar.getInstance();
        Date desde = cal.getTime();
        cal.add(Calendar.DAY_OF_MONTH, 7);
        return repo.findByFechaHoraBetweenOrderByFechaHoraAsc(desde, cal.getTime());
    }

    public Cita obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Cita no encontrada"));
    }

    public Cita crear(Map<String, Object> body) {
        Cita c = new Cita();
        mapear(c, body);
        if (c.getFechaHora() == null) throw new RuntimeException("La fecha y hora de la cita son obligatorias");
        completarTelefono(c);
        c.setWhatsappLink(armarLink(c));
        return repo.save(c);
    }

    public Cita actualizar(Long id, Map<String, Object> body) {
        Cita c = obtener(id);
        mapear(c, body);
        completarTelefono(c);
        c.setWhatsappLink(armarLink(c));
        return repo.save(c);
    }

    public void eliminar(Long id) {
        repo.deleteById(id);
    }

    public Map<String, Object> enviarRecordatorio(Long id) {
        Cita c = obtener(id);
        if (c.getTelefonoWhatsapp() == null || c.getTelefonoWhatsapp().isBlank()) {
            throw new RuntimeException("La cita no tiene teléfono WhatsApp. Agréguelo en el paciente o en la cita.");
        }
        String nombre = c.getPaciente() != null
                ? (c.getPaciente().getNombre() + (c.getPaciente().getApellido() != null ? " " + c.getPaciente().getApellido() : ""))
                : "paciente";
        String fecha = c.getFechaHora() != null ? sdfFecha.format(c.getFechaHora()) : "";
        String hora = c.getFechaHora() != null ? sdfHora.format(c.getFechaHora()) : "";
        String mensaje = whatsAppService.mensajeCita(TenantContext.getIpsId(), nombre, fecha, hora, c.getLugar(), c.getMotivo());
        Map<String, Object> envio = whatsAppService.enviarOGenerarLink(TenantContext.getIpsId(), c.getTelefonoWhatsapp(), mensaje);
        c.setWhatsappLink(String.valueOf(envio.get("whatsappLink")));
        c.setRecordatorioCanal(String.valueOf(envio.get("canal")));
        c.setRecordatorioEnviado(true);
        c.setRecordatorioFecha(new Date());
        repo.save(c);
        envio.put("citaId", c.getId());
        envio.put("estadoCita", c.getEstado());
        return envio;
    }

    public int procesarRecordatoriosPendientes() {
        List<Cita> pendientes = repo.findByRecordatorioEnviadoFalseAndEstadoIn(List.of("PROGRAMADA", "CONFIRMADA"));
        int enviados = 0;
        Date ahora = new Date();
        for (Cita c : pendientes) {
            if (c.getFechaHora() == null) continue;
            int minutos = c.getRecordatorioMinutos() != null ? c.getRecordatorioMinutos() : 60;
            long disparo = c.getFechaHora().getTime() - minutos * 60_000L;
            if (ahora.getTime() >= disparo && ahora.getTime() <= c.getFechaHora().getTime()) {
                try {
                    enviarRecordatorio(c.getId());
                    enviados++;
                } catch (Exception ignored) {
                }
            }
        }
        return enviados;
    }

    public Map<String, Object> resumenAgenda() {
        Date[] hoy = rangoDia(new Date());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("citasHoy", repo.countByFechaHoraBetween(hoy[0], hoy[1]));
        data.put("citasProgramadas", repo.countByEstado("PROGRAMADA"));
        data.put("citasConfirmadas", repo.countByEstado("CONFIRMADA"));
        data.put("citasCumplidas", repo.countByEstado("CUMPLIDA"));
        data.put("agendaHoy", hoy());
        data.put("agendaProximas", proximas());
        return data;
    }

    private void completarTelefono(Cita c) {
        if ((c.getTelefonoWhatsapp() == null || c.getTelefonoWhatsapp().isBlank()) && c.getPaciente() != null) {
            c.setTelefonoWhatsapp(c.getPaciente().getTelefono());
        }
    }

    private String armarLink(Cita c) {
        if (c.getTelefonoWhatsapp() == null || c.getFechaHora() == null) return null;
        String nombre = c.getPaciente() != null ? c.getPaciente().getNombre() : "paciente";
        String mensaje = whatsAppService.mensajeCita(TenantContext.getIpsId(), nombre,
                sdfFecha.format(c.getFechaHora()), sdfHora.format(c.getFechaHora()), c.getLugar(), c.getMotivo());
        return String.valueOf(whatsAppService.enviarOGenerarLink(TenantContext.getIpsId(), c.getTelefonoWhatsapp(), mensaje).get("whatsappLink"));
    }

    private void mapear(Cita c, Map<String, Object> b) {
        if (b.get("pacienteId") != null && !b.get("pacienteId").toString().isBlank()) {
            Paciente p = pacRepo.findById(Long.valueOf(b.get("pacienteId").toString())).orElseThrow();
            c.setPaciente(p);
        }
        if (b.get("fechaHora") != null && !b.get("fechaHora").toString().isBlank()) {
            c.setFechaHora(parseFecha(b.get("fechaHora").toString()));
        }
        if (b.get("duracionMin") != null) c.setDuracionMin(Integer.valueOf(b.get("duracionMin").toString()));
        if (b.get("tipo") != null) c.setTipo(b.get("tipo").toString());
        if (b.get("motivo") != null) c.setMotivo(b.get("motivo").toString());
        if (b.get("lugar") != null) c.setLugar(b.get("lugar").toString());
        if (b.get("estado") != null) c.setEstado(b.get("estado").toString());
        if (b.get("telefonoWhatsapp") != null) c.setTelefonoWhatsapp(b.get("telefonoWhatsapp").toString());
        if (b.get("recordatorioMinutos") != null) c.setRecordatorioMinutos(Integer.valueOf(b.get("recordatorioMinutos").toString()));
        if (b.get("observaciones") != null) c.setObservaciones(b.get("observaciones").toString());
        if (b.get("creadoPor") != null) c.setCreadoPor(b.get("creadoPor").toString());
    }

    private Date parseFecha(String raw) {
        try {
            if (raw.length() == 16) return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm").parse(raw);
            if (raw.length() >= 19 && raw.contains("T")) return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(raw.substring(0, 19));
            return new SimpleDateFormat("yyyy-MM-dd HH:mm").parse(raw);
        } catch (Exception e) {
            throw new RuntimeException("Fecha inválida. Use yyyy-MM-ddTHH:mm");
        }
    }

    private Date[] rangoDia(Date day) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(day);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date desde = cal.getTime();
        cal.add(Calendar.DAY_OF_MONTH, 1);
        return new Date[]{desde, cal.getTime()};
    }
}

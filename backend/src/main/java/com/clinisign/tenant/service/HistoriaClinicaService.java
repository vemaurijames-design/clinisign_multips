package com.clinisign.tenant.service;

import com.clinisign.config.ActorContext;
import com.clinisign.tenant.entity.HistoriaClinica;
import com.clinisign.tenant.repository.HistoriaClinicaRepository;
import com.clinisign.tenant.repository.PacienteRepository;
import com.clinisign.tenant.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HistoriaClinicaService {
    private final HistoriaClinicaRepository repo;
    private final PacienteRepository pacRepo;
    private final SolicitudRepository solRepo;
    private final AuditoriaService auditoria;

    public List<HistoriaClinica> listar() { return repo.findAll(); }
    public List<HistoriaClinica> porPaciente(Long pacienteId) { return repo.findByPacienteId(pacienteId); }
    public HistoriaClinica obtener(Long id) { return repo.findById(id).orElseThrow(); }

    public HistoriaClinica crear(Map<String, Object> b) {
        HistoriaClinica hc = new HistoriaClinica();
        mapear(hc, b);
        Object pacId = b.get("pacienteId");
        if (pacId != null && !pacId.toString().isBlank()) {
            hc.setPaciente(pacRepo.findById(Long.valueOf(pacId.toString())).orElseThrow());
        }
        Object solId = b.get("solicitudId");
        if (solId != null && !solId.toString().isBlank()) {
            hc.setSolicitud(solRepo.findById(Long.valueOf(solId.toString())).orElseThrow());
        }
        if (hc.getNombreProfesional() == null || hc.getNombreProfesional().isBlank()) {
            hc.setNombreProfesional(ActorContext.nombre() != null ? ActorContext.nombre() : ActorContext.email());
        }
        hc = repo.save(hc);
        auditoria.registrar("HISTORIA_CLINICA", "CREAR", hc.getId(), ActorContext.etiqueta());
        return hc;
    }

    public HistoriaClinica actualizar(Long id, Map<String, Object> b) {
        HistoriaClinica hc = repo.findById(id).orElseThrow();
        mapear(hc, b);
        return repo.save(hc);
    }

    public void eliminar(Long id) { repo.deleteById(id); }

    private void mapear(HistoriaClinica hc, Map<String, Object> b) {
        set(b, "lugarAtencion", hc::setLugarAtencion);
        set(b, "horaAtencion", hc::setHoraAtencion);
        set(b, "tipoAtencion", hc::setTipoAtencion);
        set(b, "motivoConsulta", hc::setMotivoConsulta);
        set(b, "enfermedadActual", hc::setEnfermedadActual);
        set(b, "antecedentesPersonales", hc::setAntecedentesPersonales);
        set(b, "antecedentesFamiliares", hc::setAntecedentesFamiliares);
        set(b, "antecedentesQuirurgicos", hc::setAntecedentesQuirurgicos);
        set(b, "alergias", hc::setAlergias);
        set(b, "medicamentosActuales", hc::setMedicamentosActuales);
        set(b, "ttoHabitual", hc::setTtoHabitual);
        set(b, "ta", hc::setTa);
        set(b, "fc", hc::setFc);
        set(b, "fr", hc::setFr);
        set(b, "temp", hc::setTemp);
        set(b, "spo2", hc::setSpo2);
        if (b.containsKey("glasgow") && b.get("glasgow") != null && !b.get("glasgow").toString().isBlank()) {
            hc.setGlasgow(Integer.valueOf(b.get("glasgow").toString()));
        }
        set(b, "viaAerea", hc::setViaAerea);
        set(b, "respiracion", hc::setRespiracion);
        set(b, "circulacion", hc::setCirculacion);
        set(b, "discapacidad", hc::setDiscapacidad);
        set(b, "exposicion", hc::setExposicion);
        set(b, "cabezaCuello", hc::setCabezaCuello);
        set(b, "torax", hc::setTorax);
        set(b, "abdomen", hc::setAbdomen);
        set(b, "extremidades", hc::setExtremidades);
        set(b, "neurologico", hc::setNeurologico);
        set(b, "cie10Principal", hc::setCie10Principal);
        set(b, "cie10Descripcion", hc::setCie10Descripcion);
        set(b, "cie10Secundario", hc::setCie10Secundario);
        set(b, "tratamiento", hc::setTratamiento);
        set(b, "procedimientosRealizados", hc::setProcedimientosRealizados);
        set(b, "medicamentosAdministrados", hc::setMedicamentosAdministrados);
        set(b, "dosis", hc::setDosis);
        set(b, "evolucion", hc::setEvolucion);
        set(b, "destinoPaciente", hc::setDestinoPaciente);
        set(b, "recomendaciones", hc::setRecomendaciones);
        set(b, "detalleJson", hc::setDetalleJson);
        set(b, "firmaPaciente", hc::setFirmaPaciente);
        set(b, "firmaAcompanante", hc::setFirmaAcompanante);
        set(b, "firmaProfesional", hc::setFirmaProfesional);
        set(b, "nombreProfesional", hc::setNombreProfesional);
        set(b, "registroProfesional", hc::setRegistroProfesional);
        set(b, "documentoProfesional", hc::setDocumentoProfesional);
    }

    private void set(Map<String, Object> b, String key, java.util.function.Consumer<String> setter) {
        if (b.containsKey(key) && b.get(key) != null) setter.accept(b.get(key).toString());
    }
}

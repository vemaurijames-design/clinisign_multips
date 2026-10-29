package com.clinisign.tenant.service;

import com.clinisign.config.ActorContext;
import com.clinisign.tenant.entity.HistoriaClinica;
import com.clinisign.tenant.repository.HistoriaClinicaRepository;
import com.clinisign.tenant.repository.PacienteRepository;
import com.clinisign.tenant.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (pacId != null && !pacId.toString().isBlank()) hc.setPaciente(pacRepo.findById(Long.valueOf(pacId.toString())).orElseThrow());
        Object solId = b.get("solicitudId");
        if (solId != null && !solId.toString().isBlank()) hc.setSolicitud(solRepo.findById(Long.valueOf(solId.toString())).orElseThrow());

        Integer maxConsec = repo.findMaxConsecutivo();
        hc.setConsecutivo(maxConsec + 1);
        hc.setCodigo("HC-FM-05-" + String.format("%04d", maxConsec + 1));

        hc = repo.save(hc);
        auditoria.registrar("HISTORIA_CLINICA", "CREAR", hc.getId(), ActorContext.etiqueta());
        return hc;
    }

    public HistoriaClinica actualizar(Long id, Map<String, Object> b) {
        HistoriaClinica hc = repo.findById(id).orElseThrow();
        mapear(hc, b);
        return repo.save(hc);
    }

    public void activar(Long id) {
        HistoriaClinica hc = repo.findById(id).orElseThrow(() -> new RuntimeException("No encontrada"));
        hc.setActivo(true);
        repo.save(hc);
        auditoria.registrar("HISTORIA_CLINICA", "ACTIVAR", id, ActorContext.etiqueta());
    }
    @Transactional
    public void anular(Long id) {
        var hc = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Historia clínica no encontrada"));
        hc.setActivo(false);
        repo.save(hc);
        auditoria.registrar("HISTORIA_CLINICA", "ANULAR", id, ActorContext.etiqueta());
    }

    public void eliminar(Long id) {
        HistoriaClinica hc = repo.findById(id).orElseThrow(() -> new RuntimeException("No encontrada"));
        String detalle = "Eliminada HC " + (hc.getCodigo() != null ? hc.getCodigo() : id) + " por SUPERADMIN";
        repo.delete(hc);
        auditoria.registrar("HISTORIA_CLINICA", "ELIMINAR", id, detalle);
    }

    private void mapear(HistoriaClinica hc, Map<String, Object> b) {
        set(b, "ta", hc::setTa); set(b, "fc", hc::setFc); set(b, "fr", hc::setFr);
        set(b, "temp", hc::setTemp); set(b, "spo2", hc::setSpo2); set(b, "glucometria", hc::setGlucometria);
        set(b, "peso", hc::setPeso); set(b, "talla", hc::setTalla);
        if (b.containsKey("glasgow") && b.get("glasgow") != null && !b.get("glasgow").toString().isBlank()) hc.setGlasgow(Integer.valueOf(b.get("glasgow").toString()));

        set(b, "taEntrega", hc::setTaEntrega); set(b, "fcEntrega", hc::setFcEntrega); set(b, "frEntrega", hc::setFrEntrega);
        set(b, "spo2Entrega", hc::setSpo2Entrega); set(b, "tempEntrega", hc::setTempEntrega); set(b, "glucEntrega", hc::setGlucEntrega); set(b, "glasgowEntrega", hc::setGlasgowEntrega);
        set(b, "nombreEntrega", hc::setNombreEntrega); set(b, "cedulaEntrega", hc::setCedulaEntrega); set(b, "registroEntrega", hc::setRegistroEntrega);
        set(b, "nombreReceptor", hc::setNombreReceptor); set(b, "cedulaReceptor", hc::setCedulaReceptor);

        set(b, "apoyo", hc::setApoyo); set(b, "finAtencion", hc::setFinAtencion); set(b, "tipoAseguramiento", hc::setTipoAseguramiento);
        set(b, "tipoTrasladoServicio", hc::setTipoTrasladoServicio); set(b, "estadoCivil", hc::setEstadoCivil); set(b, "ocupacion", hc::setOcupacion);
        set(b, "otraAntecedente", hc::setOtraAntecedente); set(b, "horaUltimaIngesta", hc::setHoraUltimaIngesta);
        set(b, "localizacionLesiones", hc::setLocalizacionLesiones);
        set(b, "tratX", hc::setTratX); set(b, "tratA", hc::setTratA); set(b, "tratB", hc::setTratB); set(b, "tratC", hc::setTratC);
        set(b, "desfibrilacion", hc::setDesfibrilacion); set(b, "otrosTratamientos", hc::setOtrosTratamientos);
        set(b, "instruccionesTraslado", hc::setInstruccionesTraslado); set(b, "resultado", hc::setResultado); set(b, "complicacionesTraslado", hc::setComplicacionesTraslado);
        set(b, "nombreAsignaTraslado", hc::setNombreAsignaTraslado); set(b, "entidadReceptora", hc::setEntidadReceptora);
        set(b, "docAcompanante", hc::setCedulaAcompanante); set(b, "nombreAcompanante", hc::setNombreAcompanante); set(b, "parentescoAcompanante", hc::setParentescoAcompanante);
        set(b, "firmaEntidad", hc::setFirmaEntidad); set(b, "firmaEntidadReceptora", hc::setFirmaEntidadReceptora);

        set(b, "viaAerea", hc::setViaAerea); set(b, "respiracion", hc::setRespiracion); set(b, "circulacion", hc::setCirculacion);
        set(b, "piel", hc::setPiel); set(b, "hemo", hc::setHemo);

        set(b, "placaMovil", hc::setPlacaMovil); set(b, "origen", hc::setOrigen);
        set(b, "destino1", hc::setDestino1); set(b, "destino2", hc::setDestino2); set(b, "destinoFinal", hc::setDestinoFinal);
        set(b, "conductor", hc::setConductor); set(b, "tripulante", hc::setTripulante);
        set(b, "horaDespacho", hc::setHoraDespacho); set(b, "horaLlegada", hc::setHoraLlegada); set(b, "horaSalida", hc::setHoraSalida);
        set(b, "alcohol", hc::setAlcohol); set(b, "fumador", hc::setFumador); set(b, "spa", hc::setSpa);

        set(b, "alergias", hc::setAlergias); set(b, "medicamentosActuales", hc::setMedicamentosActuales); set(b, "antecedentesPersonales", hc::setAntecedentesPersonales);
        set(b, "antecedentesQuirurgicos", hc::setAntecedentesQuirurgicos); set(b, "destinoPaciente", hc::setDestinoPaciente); set(b, "tipoAtencion", hc::setTipoAtencion);
        set(b, "motivoConsulta", hc::setMotivoConsulta); set(b, "enfermedadActual", hc::setEnfermedadActual);
        set(b, "firmaPaciente", hc::setFirmaPaciente); set(b, "firmaAcompanante", hc::setFirmaAcompanante); set(b, "firmaProfesional", hc::setFirmaProfesional);
        set(b, "nombreProfesional", hc::setNombreProfesional); set(b, "registroProfesional", hc::setRegistroProfesional); set(b, "documentoProfesional", hc::setDocumentoProfesional);
        set(b, "cie10Principal", hc::setCie10Principal); set(b, "tratamiento", hc::setTratamiento);
        set(b, "procedimientosRealizados", hc::setProcedimientosRealizados); set(b, "evolucion", hc::setEvolucion);
        set(b, "detalleJson", hc::setDetalleJson);
    }

    private void set(Map<String, Object> b, String key, java.util.function.Consumer<String> setter) {
        if (b.containsKey(key) && b.get(key) != null) setter.accept(b.get(key).toString());
    }
}
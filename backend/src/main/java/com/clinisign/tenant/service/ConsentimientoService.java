package com.clinisign.tenant.service;

import com.clinisign.config.ActorContext;
import com.clinisign.config.EmailService;
import com.clinisign.config.TenantContext;
import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.tenant.entity.Consentimiento;
import com.clinisign.tenant.entity.HistoriaClinica;
import com.clinisign.tenant.entity.PlantillaDocumento;
import com.clinisign.tenant.repository.ConsentimientoRepository;
import com.clinisign.tenant.repository.HistoriaClinicaRepository;
import com.clinisign.tenant.repository.PlantillaDocumentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentimientoService {
    private final ConsentimientoRepository repo;
    private final HistoriaClinicaRepository hcRepo;
    private final EmailService emailService;
    private final ConsentimientoPdfService pdfService;
    private final IpsRepository ipsRepository;
    private final AuditoriaService auditoria;
    private final PlantillaDocumentoRepository plantillaRepo;

    public List<Consentimiento> listar() { return repo.findAll(); }

    public List<Consentimiento> porDocumento(String documento) {
        return repo.findByDocumentoOrderByIdDesc(documento);
    }

    public Consentimiento crear(Map<String, Object> body) {
        Consentimiento c = new Consentimiento();
        HistoriaClinica hc = null;
        if (body.get("historiaClinicaId") != null && !body.get("historiaClinicaId").toString().isBlank()) {
            hc = hcRepo.findById(Long.valueOf(body.get("historiaClinicaId").toString())).orElse(null);
            c.setHistoriaClinica(hc);
        }
        String tipo = str(body.getOrDefault("tipo", "CONSENTIMIENTO"));
        c.setTipo(tipo);
        c.setCodigo("DESISTIMIENTO".equalsIgnoreCase(tipo) ? "HC-FM-06" : "HC-FM-04");
        c.setVersion("01");
        try {
            if (body.get("plantillaId") != null && !body.get("plantillaId").toString().isBlank()) {
                PlantillaDocumento pl = plantillaRepo.findById(Long.valueOf(body.get("plantillaId").toString())).orElse(null);
                if (pl != null) {
                    c.setPlantillaId(pl.getId());
                    if (pl.getTipo() != null) c.setTipo(pl.getTipo());
                    if (pl.getCodigo() != null) c.setCodigo(pl.getCodigo());
                    if (pl.getVersion() != null) c.setVersion(pl.getVersion());
                    if (!notBlank(c.getProcedimientos())) c.setProcedimientos(pl.getProcedimientos());
                    if (!notBlank(c.getBeneficios())) c.setBeneficios(pl.getBeneficios());
                    if (!notBlank(c.getRiesgos())) c.setRiesgos(pl.getRiesgos());
                    if (!notBlank(c.getAlternativas())) c.setAlternativas(pl.getAlternativas());
                    if (!notBlank(c.getObservaciones())) c.setObservaciones(pl.getTextoLegal());
                }
            }
        } catch (Exception e) {
            log.warn("Plantilla no aplicada: {}", e.getMessage());
        }
        c.setCalidad(str(body.get("calidad")));
        if (notBlank(body.get("procedimientos"))) c.setProcedimientos(str(body.get("procedimientos")));
        if (notBlank(body.get("beneficios"))) c.setBeneficios(str(body.get("beneficios")));
        if (notBlank(body.get("alternativas"))) c.setAlternativas(str(body.get("alternativas")));
        if (notBlank(body.get("riesgos"))) c.setRiesgos(str(body.get("riesgos")));
        if (notBlank(body.get("observaciones"))) c.setObservaciones(str(body.get("observaciones")));
        c.setFirma(str(body.get("firma")));
        c.setDocumento(str(body.get("documento")));
        c.setTelefono(str(body.get("telefono")));
        if (!notBlank(c.getDocumento()) && hc != null && hc.getPaciente() != null) {
            c.setDocumento(hc.getPaciente().getDocumento());
        }
        if (!notBlank(c.getTelefono()) && hc != null && hc.getPaciente() != null) {
            c.setTelefono(hc.getPaciente().getTelefono());
        }
        if (!notBlank(c.getProcedimientos())) {
            c.setProcedimientos("Inmovilización y traslado en camilla; Administración de oxígeno; Administración de medicamentos; Traslado y transporte.");
        }
        c.setHuellaDigital(str(body.get("huellaDigital")));
        c.setNombreAcompanante(str(body.get("nombreAcompanante")));
        c.setNombreAuxiliar(str(body.get("nombreAuxiliar")));
        if (!notBlank(c.getNombreAuxiliar())) {
            c.setNombreAuxiliar(ActorContext.nombre() != null ? ActorContext.nombre() : ActorContext.email());
        }
        c.setRegistroAuxiliar(str(body.get("registroAuxiliar")));
        c.setRegistradoPor(ActorContext.etiqueta());
        String tipoNum = c.getTipo() != null ? c.getTipo() : "CONSENTIMIENTO";
        try {
            c.setConsecutivo((int) repo.countByTipo(tipoNum) + 1);
        } catch (Exception e) {
            c.setConsecutivo(1);
        }
        boolean tieneHuella = notBlank(c.getHuellaDigital());
        boolean tieneFirma = notBlank(c.getFirma());
        c.setFirmado(tieneFirma || tieneHuella);
        c.setCorreoEnviado(false);
        c = repo.save(c);
        try {
            auditoria.registrar("CONSENTIMIENTOS", "CREAR", c.getId(),
                    c.getCodigo() + "-" + c.getConsecutivo() + " doc " + c.getDocumento());
        } catch (Exception e) {
            log.warn("Auditoría no registrada: {}", e.getMessage());
        }

        String destino = str(body.get("correoDestino"));
        if (Boolean.TRUE.equals(c.getFirmado()) && TenantContext.getIpsId() != null && notBlank(destino)) {
            String html = "<h2>" + c.getTipo() + " " + c.getCodigo() + "-" + c.getConsecutivo() + "</h2>"
                    + "<p>Documento: " + c.getDocumento() + "</p>"
                    + "<p>Procedimientos: " + (c.getProcedimientos() != null ? c.getProcedimientos() : "") + "</p>";
            try {
                emailService.enviarConsentimiento(TenantContext.getIpsId(), destino,
                        c.getTipo() + " " + c.getCodigo() + "-" + c.getConsecutivo(), html);
                c.setCorreoEnviado(true);
                c.setCorreoDestino(destino);
                c.setFechaEnvio(new Date());
                repo.save(c);
            } catch (Exception e) {
                log.warn("No se pudo enviar correo: {}", e.getMessage());
            }
        }
        return c;
    }

    public Consentimiento enviarCorreo(Long id, String destino) {
        Consentimiento c = repo.findById(id).orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        if (!notBlank(destino)) destino = c.getCorreoDestino();
        if (!notBlank(destino) && TenantContext.getIpsId() != null) {
            Ips ips = ipsRepository.findById(TenantContext.getIpsId()).orElse(null);
            if (ips != null && notBlank(ips.getCorreo())) destino = ips.getCorreo();
        }
        if (!notBlank(destino)) {
            throw new RuntimeException("Indique el correo o configure el correo institucional de la IPS.");
        }
        Ips ips = TenantContext.getIpsId() != null ? ipsRepository.findById(TenantContext.getIpsId()).orElse(null) : null;
        String ipsNombre = ips != null && ips.getNombre() != null ? ips.getNombre() : "IPS";
        String ipsCorreo = ips != null && ips.getCorreo() != null ? ips.getCorreo() : "";
        String ipsTel = ips != null && ips.getTelefono() != null ? ips.getTelefono() : "";
        String html = "<div style='font-family:Arial,sans-serif;color:#1a2a4a'>"
                + "<h2 style='color:#0a3d7a'>" + ipsNombre + "</h2>"
                + "<p>Se adjunta el documento clínico generado en CliniSign.</p>"
                + "<table style='border-collapse:collapse;width:100%'>"
                + "<tr><td style='padding:6px;border:1px solid #ddd'><b>Tipo</b></td><td style='padding:6px;border:1px solid #ddd'>" + c.getTipo() + "</td></tr>"
                + "<tr><td style='padding:6px;border:1px solid #ddd'><b>Código</b></td><td style='padding:6px;border:1px solid #ddd'>" + c.getCodigo() + "-" + c.getConsecutivo() + "</td></tr>"
                + "<tr><td style='padding:6px;border:1px solid #ddd'><b>Documento del paciente</b></td><td style='padding:6px;border:1px solid #ddd'>" + (c.getDocumento() != null ? c.getDocumento() : "") + "</td></tr>"
                + "<tr><td style='padding:6px;border:1px solid #ddd'><b>Calidad del firmante</b></td><td style='padding:6px;border:1px solid #ddd'>" + (c.getCalidad() != null ? c.getCalidad() : "") + "</td></tr>"
                + "<tr><td style='padding:6px;border:1px solid #ddd'><b>Teléfono</b></td><td style='padding:6px;border:1px solid #ddd'>" + (c.getTelefono() != null ? c.getTelefono() : "") + "</td></tr>"
                + "<tr><td style='padding:6px;border:1px solid #ddd'><b>Registrado por</b></td><td style='padding:6px;border:1px solid #ddd'>" + (c.getRegistradoPor() != null ? c.getRegistradoPor() : "") + "</td></tr>"
                + "</table>"
                + "<p style='margin-top:12px'><b>IPS:</b> " + ipsNombre + "<br/>"
                + "<b>Correo IPS:</b> " + ipsCorreo + "<br/>"
                + "<b>Teléfono IPS:</b> " + ipsTel + "</p>"
                + "<p style='font-size:12px;color:#666'>Documento de respaldo institucional. Historia clínica reservada (Ley 23 de 1981 y Res. 1995 de 1999).</p>"
                + "</div>";
        byte[] pdf = pdfService.generarPdf(id);
        emailService.enviarPdf(TenantContext.getIpsId(), destino,
                c.getTipo() + " " + c.getCodigo() + "-" + c.getConsecutivo() + " doc " + c.getDocumento(),
                html, pdf, c.getCodigo() + "-" + c.getConsecutivo() + ".pdf");
        c.setCorreoEnviado(true);
        c.setCorreoDestino(destino);
        c.setFechaEnvio(new Date());
        return repo.save(c);
    }

    public void eliminar(Long id) { repo.deleteById(id); }
    private String str(Object o) { return o == null ? null : o.toString(); }
    private boolean notBlank(Object o) { return o != null && !o.toString().isBlank(); }
}

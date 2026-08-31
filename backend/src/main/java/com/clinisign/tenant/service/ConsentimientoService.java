package com.clinisign.tenant.service;

import com.clinisign.config.EmailService;
import com.clinisign.config.TenantContext;
import com.clinisign.tenant.entity.Consentimiento;
import com.clinisign.tenant.entity.HistoriaClinica;
import com.clinisign.tenant.repository.ConsentimientoRepository;
import com.clinisign.tenant.repository.HistoriaClinicaRepository;
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

    public List<Consentimiento> listar() { return repo.findAll(); }

    public Consentimiento crear(Map<String, Object> body) {
        Long hcId = Long.valueOf(body.get("historiaClinicaId").toString());
        HistoriaClinica hc = hcRepo.findById(hcId).orElseThrow();
        Consentimiento c = new Consentimiento();
        c.setHistoriaClinica(hc);
        c.setTipo(str(body.getOrDefault("tipo", "CONSENTIMIENTO")));
        c.setCodigo(str(body.getOrDefault("codigo", "HC-FM-04")));
        c.setCalidad(str(body.get("calidad")));
        c.setProcedimientos(str(body.get("procedimientos")));
        c.setBeneficios(str(body.get("beneficios")));
        c.setAlternativas(str(body.get("alternativas")));
        c.setRiesgos(str(body.get("riesgos")));
        c.setObservaciones(str(body.get("observaciones")));
        c.setFirma(str(body.get("firma")));
        c.setDocumento(str(body.get("documento")));
        c.setTelefono(str(body.get("telefono")));
        c.setHuellaDigital(str(body.get("huellaDigital")));
        c.setNombreAcompanante(str(body.get("nombreAcompanante")));
        c.setNombreAuxiliar(str(body.get("nombreAuxiliar")));
        c.setRegistroAuxiliar(str(body.get("registroAuxiliar")));
        boolean tieneHuella = c.getHuellaDigital() != null && !c.getHuellaDigital().isBlank();
        boolean tieneFirma = c.getFirma() != null && !c.getFirma().isBlank();
        c.setFirmado(tieneHuella && tieneFirma);
        c.setCorreoEnviado(false);
        c = repo.save(c);

        String destino = str(body.get("correoDestino"));
        if (c.getFirmado() && TenantContext.getIpsId() != null && destino != null && !destino.isBlank()) {
            String html = "<h2>Consentimiento Informado - " + c.getTipo() + "</h2>"
                    + "<p>Documento: " + c.getDocumento() + "</p>"
                    + "<p>Procedimientos: " + (c.getProcedimientos() != null ? c.getProcedimientos() : "") + "</p>"
                    + "<p>Firmado digitalmente con huella y firma.</p>";
            try {
                emailService.enviarConsentimiento(TenantContext.getIpsId(), destino,
                        "Consentimiento " + c.getTipo() + " - Doc " + c.getDocumento(), html);
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

    public void eliminar(Long id) { repo.deleteById(id); }
    private String str(Object o) { return o == null ? null : o.toString(); }
}

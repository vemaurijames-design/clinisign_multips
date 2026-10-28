package com.clinisign.tenant.service;

import com.clinisign.config.ActorContext;
import com.clinisign.config.DataSourceManager;
import com.clinisign.config.TenantContext;
import com.clinisign.tenant.entity.PlantillaDocumento;
import com.clinisign.tenant.repository.PlantillaDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlantillaDocumentoService {
    private final PlantillaDocumentoRepository repo;
    private final AuditoriaService auditoria;
    private final PdfPlantillaAnalyzer analyzer;
    private final DataSourceManager dataSourceManager;

    @Value("${clinisign.upload.dir:./uploads}")
    private String uploadDir;

    public List<PlantillaDocumento> listar() {
        asegurarTabla();
        asegurarDefaults();
        return repo.findAll();
    }

    public List<PlantillaDocumento> activas() {
        asegurarTabla();
        asegurarDefaults();
        return repo.findByActivaTrue();
    }

    public PlantillaDocumento activaPorTipo(String tipo) {
        asegurarTabla();
        asegurarDefaults();
        if (tipo == null || tipo.isBlank()) tipo = "CONSENTIMIENTO";
        PlantillaDocumento p = repo.findFirstByTipoAndActivaTrueOrderByIdDesc(tipo.trim().toUpperCase());
        if (p == null) throw new RuntimeException("Esta IPS no tiene plantilla activa de " + tipo);
        return p;
    }

    public PlantillaDocumento obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Plantilla no encontrada"));
    }

    public PlantillaDocumento guardar(Map<String, Object> body) {
        PlantillaDocumento p = body.get("id") != null
                ? repo.findById(Long.valueOf(body.get("id").toString())).orElse(new PlantillaDocumento())
                : new PlantillaDocumento();
        if (body.get("tipo") != null) p.setTipo(body.get("tipo").toString());
        if (body.get("nombre") != null) p.setNombre(body.get("nombre").toString());
        if (body.get("codigo") != null) p.setCodigo(body.get("codigo").toString());
        if (body.get("version") != null) p.setVersion(body.get("version").toString());
        if (body.get("procedimientos") != null) p.setProcedimientos(body.get("procedimientos").toString());
        if (body.get("beneficios") != null) p.setBeneficios(body.get("beneficios").toString());
        if (body.get("riesgos") != null) p.setRiesgos(body.get("riesgos").toString());
        if (body.get("alternativas") != null) p.setAlternativas(body.get("alternativas").toString());
        if (body.get("textoLegal") != null) p.setTextoLegal(body.get("textoLegal").toString());
        if (body.get("activa") != null) p.setActiva(Boolean.valueOf(body.get("activa").toString()));
        if (Boolean.TRUE.equals(p.getActiva()) && p.getTipo() != null) {
            for (PlantillaDocumento otra : repo.findByTipoAndActivaTrue(p.getTipo())) {
                if (p.getId() == null || !otra.getId().equals(p.getId())) {
                    otra.setActiva(false);
                    repo.save(otra);
                }
            }
        }
        p = repo.save(p);
        auditoria.registrar("PLANTILLAS", "GUARDAR", p.getId(), p.getTipo() + " " + p.getNombre());
        return p;
    }

    public PlantillaDocumento crearDesdePdf(MultipartFile file, String tipoForzado) {
        asegurarTabla();
        if (file == null || file.isEmpty()) throw new RuntimeException("Adjunte el PDF de la IPS");
        String texto = analyzer.extraerTexto(file);
        var datos = analyzer.analizar(texto);
        PlantillaDocumento p = new PlantillaDocumento();
        p.setTipo(tipoForzado != null && !tipoForzado.isBlank() ? tipoForzado : datos.get("tipo"));
        p.setNombre(datos.get("nombre"));
        p.setCodigo(datos.get("codigo"));
        p.setVersion("01");
        p.setProcedimientos(datos.get("procedimientos"));
        p.setBeneficios(datos.get("beneficios"));
        p.setRiesgos(datos.get("riesgos"));
        p.setAlternativas(datos.get("alternativas"));
        p.setTextoLegal(datos.get("textoLegal"));
        p.setActiva(true);
        p = repo.save(p);
        return adjuntarModelo(p.getId(), file);
    }

    public PlantillaDocumento adjuntarModelo(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) throw new RuntimeException("Adjunte el PDF modelo de la IPS");
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "modelo.pdf";
        if (!name.endsWith(".pdf")) throw new RuntimeException("El modelo debe ser un PDF");
        PlantillaDocumento p = obtener(id);
        Long ipsId = TenantContext.getIpsId();
        try {
            Path dir = Path.of(uploadDir, "ips", String.valueOf(ipsId), "plantillas");
            Files.createDirectories(dir);
            Path dest = dir.resolve(p.getId() + ".pdf");
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            p.setArchivoModeloUrl("/uploads/ips/" + ipsId + "/plantillas/" + p.getId() + ".pdf");
            p = repo.save(p);
            auditoria.registrar("PLANTILLAS", "ADJUNTAR_PDF", p.getId(), ActorContext.etiqueta());
            return p;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo guardar el PDF modelo: " + e.getMessage(), e);
        }
    }

    private void asegurarTabla() {
        Long ipsId = TenantContext.getIpsId();
        if (ipsId != null) dataSourceManager.getDataSource(ipsId);
    }

    private void asegurarDefaults() {
        if (repo.findByTipoAndActivaTrue("HISTORIA_CLINICA").isEmpty()) {
            PlantillaDocumento h = new PlantillaDocumento();
            h.setTipo("HISTORIA_CLINICA");
            h.setNombre("Historia clínica prehospitalaria");
            h.setCodigo("HC-FM-05");
            h.setVersion("01");
            h.setTextoLegal("Formato HC-FM-05. Documento reservado Ley 23 de 1981 y Res. 1995 de 1999.");
            h.setActiva(true);
            repo.save(h);
        }
        if (repo.count() > 1) return;
        PlantillaDocumento c = new PlantillaDocumento();
        c.setTipo("CONSENTIMIENTO");
        c.setNombre("Consentimiento informado de traslado");
        c.setCodigo("HC-FM-04");
        c.setVersion("01");
        c.setProcedimientos("Inmovilizacion y traslado en camilla; Administracion de oxigeno; Administracion de medicamentos (liquidos endovenosos); Traslado y transporte.");
        c.setBeneficios("Traslado en ambulancia de baja complejidad con auxiliar de enfermeria/APH y conductor. Material y medicacion para situaciones criticas. Acompanante mayor de edad. Menor riesgo de lesiones y menor tiempo de llegada.");
        c.setAlternativas("No aceptar el traslado; otro prestador; familiar en vehiculo propio; transporte publico.");
        c.setRiesgos("Complicaciones que detengan la ambulancia. Vibracion, aceleracion, accidente o averia. Caidas, mareos, vomito, agudizacion o muerte. Demora en camilla y efecto en salud mental por ruido o espacio cerrado.");
        c.setTextoLegal("Comprendi la informacion y acepto los procedimientos por el personal Auxiliar de Enfermeria/APH, acorde a la Resolucion 3100 de 2019. Autorizo el traslado a un centro asistencial si fuere necesario.");
        repo.save(c);

        PlantillaDocumento d = new PlantillaDocumento();
        d.setTipo("DESISTIMIENTO");
        d.setNombre("Desistimiento informado");
        d.setCodigo("HC-FM-06");
        d.setVersion("01");
        d.setProcedimientos("Inmovilizacion y traslado en camilla; Administracion de medicamentos; Administracion de oxigeno; Atencion y traslado.");
        d.setBeneficios("Se informaron alternativas, riesgos y beneficios de los procedimientos y del no tratamiento.");
        d.setRiesgos("Al no someterse, el paciente o responsable asume los riesgos de no traslado bajo su responsabilidad.");
        d.setAlternativas("Puede aceptar el procedimiento mas adelante si las condiciones lo permiten.");
        d.setTextoLegal("Fui informado por el Auxiliar de Enfermeria/APH. DECIDO CONSCIENTEMENTE NO SOMETERME a los procedimientos y ASUMO LOS RIESGOS DE NO TRASLADO. La historia clinica es reservada; autorizo acceso de auditoria cuando la ley lo permita.");
        repo.save(d);
    }
}
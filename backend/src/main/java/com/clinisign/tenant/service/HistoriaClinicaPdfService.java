package com.clinisign.tenant.service;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.config.TenantContext;
import com.clinisign.tenant.entity.HistoriaClinica;
import com.clinisign.tenant.entity.Paciente;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.SimpleDateFormat;

@Service
@RequiredArgsConstructor
public class HistoriaClinicaPdfService {
    private final HistoriaClinicaService hcService;
    private final IpsRepository ipsRepository;

    @Value("${clinisign.upload.dir:./uploads}")
    private String uploadDir;

    public byte[] generar(Long id) {
        HistoriaClinica hc = hcService.obtener(id);
        Paciente p = hc.getPaciente();
        Ips ips = TenantContext.getIpsId() != null ? ipsRepository.findById(TenantContext.getIpsId()).orElse(null) : null;
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf);
            doc.setFontSize(8);
            if (ips != null && ips.getLogoUrl() != null) {
                try {
                    Path logo = Path.of(uploadDir, ips.getLogoUrl().replaceFirst("^/uploads/?", ""));
                    if (Files.exists(logo)) {
                        Image img = new Image(ImageDataFactory.create(logo.toAbsolutePath().toString()));
                        img.setHeight(36);
                        doc.add(img);
                    }
                } catch (Exception ignored) {}
            }
            String ipsN = ips != null ? ips.getNombre() : "IPS";
            doc.add(new Paragraph(ipsN + "  ·  HISTORIA CLÍNICA  HC-FM-05  v01").setBold().setFontSize(12).setFontColor(new DeviceRgb(0, 51, 102)));
            doc.add(new Paragraph("Res. 1995 de 1999 · Ley 23 de 1981 · Documento reservado").setFontSize(7));
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
            doc.add(new Paragraph("Fecha atención: " + (hc.getFechaAtencion() != null ? sdf.format(hc.getFechaAtencion()) : "") + "  Hora: " + n(hc.getHoraAtencion())));
            if (p != null) {
                doc.add(new Paragraph("2. PACIENTE: " + n(p.getNombre()) + " " + n(p.getApellido())
                        + "  Doc: " + n(p.getTipoDocumento()) + " " + n(p.getDocumento())
                        + "  Edad: " + p.getEdad() + "  Sexo: " + n(p.getGenero())
                        + "  Tel: " + n(p.getTelefono()) + "  EPS: " + n(p.getEps())).setBold());
                doc.add(new Paragraph("Dir: " + n(p.getDireccion()) + "  Ciudad: " + n(p.getCiudad())
                        + "  Contacto: " + n(p.getContactoNombre()) + " " + n(p.getContactoTelefono())));
            }
            doc.add(new Paragraph("Clasificación: " + n(hc.getTipoAtencion()) + "  Lugar: " + n(hc.getLugarAtencion())));
            doc.add(new Paragraph("Motivo: " + n(hc.getMotivoConsulta())));
            doc.add(new Paragraph("Evento / enfermedad actual: " + n(hc.getEnfermedadActual())));
            doc.add(new Paragraph("Antecedentes patológicos: " + n(hc.getAntecedentesPersonales())
                    + "  Quirúrgicos: " + n(hc.getAntecedentesQuirurgicos())
                    + "  Alergias: " + n(hc.getAlergias())
                    + "  Medicamentos: " + n(hc.getMedicamentosActuales())));
            doc.add(new Paragraph("7. EXAMEN FÍSICO  TA " + n(hc.getTa()) + "  FC " + n(hc.getFc())
                    + "  FR " + n(hc.getFr()) + "  Temp " + n(hc.getTemp()) + "  SpO2 " + n(hc.getSpo2())
                    + "  Glasgow " + hc.getGlasgow()).setBold());
            doc.add(new Paragraph("Vía aérea: " + n(hc.getViaAerea()) + "  Respiración: " + n(hc.getRespiracion())
                    + "  Circulación: " + n(hc.getCirculacion())));
            doc.add(new Paragraph("CIE-10: " + n(hc.getCie10Principal()) + " " + n(hc.getCie10Descripcion())));
            doc.add(new Paragraph("Tratamiento / procedimientos: " + n(hc.getTratamiento()) + " " + n(hc.getProcedimientosRealizados())));
            doc.add(new Paragraph("Evolución: " + n(hc.getEvolucion())));
            doc.add(new Paragraph("Destino: " + n(hc.getDestinoPaciente())));
            if (hc.getDetalleJson() != null && !hc.getDetalleJson().isBlank()) {
                doc.add(new Paragraph("Detalle operativo: " + hc.getDetalleJson()).setFontSize(7));
            }
            doc.add(new Paragraph("Talento humano que traslada: " + n(hc.getNombreProfesional()) + "  Reg: " + n(hc.getRegistroProfesional())));
            addFirma(doc, "Firma del paciente", hc.getFirmaPaciente());
            addFirma(doc, "Firma del acompañante / responsable", hc.getFirmaAcompanante());
            addFirma(doc, "Firma APH / profesional", hc.getFirmaProfesional());
            doc.add(new Paragraph("Siandaludmedellin@gmail.com  3113172171 - 3008881782  Medellín-Ant").setFontSize(7).setTextAlignment(TextAlignment.CENTER));
            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el PDF de HC", e);
        }
    }

    private void addFirma(Document doc, String label, String dataUri) {
        doc.add(new Paragraph(label).setBold().setFontSize(8));
        if (dataUri != null && dataUri.startsWith("data:image")) {
            try {
                String b64 = dataUri.substring(dataUri.indexOf(',') + 1);
                Image img = new Image(ImageDataFactory.create(java.util.Base64.getDecoder().decode(b64)));
                img.setHeight(40);
                doc.add(img);
            } catch (Exception e) {
                doc.add(new Paragraph("______________________________"));
            }
        } else {
            doc.add(new Paragraph("______________________________"));
        }
    }

    private String n(String s) { return s == null ? "" : s; }
}

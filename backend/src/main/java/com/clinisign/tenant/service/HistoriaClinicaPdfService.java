package com.clinisign.tenant.service;

import com.clinisign.config.TenantContext;
import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.tenant.entity.HistoriaClinica;
import com.clinisign.tenant.entity.Paciente;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
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
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${clinisign.upload.dir:./uploads}")
    private String uploadDir;

    public byte[] generar(Long id) {
        HistoriaClinica hc = hcService.obtener(id);
        Paciente p = hc.getPaciente();
        Ips ips = TenantContext.getIpsId() != null ? ipsRepository.findById(TenantContext.getIpsId()).orElse(null) : null;
        JsonNode det = parse(hc.getDetalleJson());
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf, PageSize.LETTER);
            doc.setMargins(28, 28, 28, 28);
            doc.setFontSize(8);

            Table head = new Table(UnitValue.createPercentArray(new float[]{22, 56, 22})).useAllAvailableWidth();
            Cell logo = cell("");
            addLogo(logo, ips);
            head.addCell(logo);
            Cell mid = cell("").setTextAlignment(TextAlignment.CENTER);
            mid.add(new Paragraph(ips != null ? ips.getNombre() : "IPS").setBold().setFontSize(11));
            mid.add(new Paragraph("HISTORIA CLÍNICA").setBold().setFontSize(13));
            mid.add(new Paragraph("Documento reservado · Ley 23 de 1981 · Res. 1995 de 1999").setFontSize(7));
            head.addCell(mid);
            Cell meta = cell("");
            meta.add(new Paragraph("CÓDIGO: HC-FM-05").setBold());
            meta.add(new Paragraph("VERSIÓN: 01"));
            meta.add(new Paragraph("FECHA: ENERO 2024"));
            head.addCell(meta);
            doc.add(head);

            seccion(doc, "1. Información general");
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            fila(doc, "Fecha", hc.getFechaAtencion() != null ? sdf.format(hc.getFechaAtencion()) : "",
                    "Placa móvil", n(hc.getPlacaMovil()),
                    "Hora despacho / llegada / salida", n(hc.getHoraDespacho()) + " / " + n(hc.getHoraLlegada()) + " / " + n(hc.getHoraSalida()));
            fila(doc, "Origen", n(hc.getOrigen()), "Destino 1", n(hc.getDestino1()), "Destino 2 / final", n(hc.getDestino2()));
            fila(doc, "Clasificación", n(hc.getTipoAtencion()), "Conductor", n(hc.getConductor()), "Tripulante / REG", n(hc.getTripulante()) + "  " + n(hc.getRegistroProfesional()));

            seccion(doc, "2. Identificación del paciente");
            if (p != null) {
                fila(doc, "Nombre", n(p.getNombre()) + " " + n(p.getApellido()), "Documento", n(p.getTipoDocumento()) + " " + n(p.getDocumento()), "Edad / sexo", String.valueOf(p.getEdad()) + " / " + n(p.getGenero()));
                fila(doc, "Dirección", n(p.getDireccion()), "Municipio", n(p.getCiudad()), "Teléfono", n(p.getTelefono()));
                fila(doc, "EPS / aseguramiento", n(p.getEps()), "Ocupación", n(p.getOcupacion()), "Estado civil", n(p.getEstadoCivil()));
                fila(doc, "Acompañante", n(p.getContactoNombre()), "Cédula acompañante", txt(det, "docAcompanante"), "Tel. acompañante", n(p.getContactoTelefono()));
            } else {
                doc.add(new Paragraph("Paciente no asociado").setFontColor(ColorConstants.RED));
            }

            seccion(doc, "3–5. Cuidados, evento y motivo");
            doc.add(p("Cuidados anteriores: " + arr(det, "cuidados")));
            doc.add(p("Tipo de evento: " + arr(det, "eventos")));
            doc.add(p("Urgencia médica: " + arr(det, "motMed")));
            doc.add(p("Urgencia traumática: " + arr(det, "motTra")));

            seccion(doc, "6. Antecedentes y lesiones");
            fila(doc, "Patologías", n(hc.getAntecedentesPersonales()), "Cirugías", n(hc.getAntecedentesQuirurgicos()), "Alergias", n(hc.getAlergias()));
            fila(doc, "Medicamentos", n(hc.getMedicamentosActuales()), "Fumador / alcohol / SPA", n(hc.getFumador()) + " / " + n(hc.getAlcohol()) + " / " + n(hc.getSpa()), "Lesiones", arr(det, "lesiones"));

            seccion(doc, "7. Examen físico");
            fila(doc, "TA", n(hc.getTa()), "FC", n(hc.getFc()), "FR", n(hc.getFr()));
            fila(doc, "Sat O2 %", n(hc.getSpo2()), "Temperatura", n(hc.getTemp()), "Glasgow", hc.getGlasgow() == null ? "" : String.valueOf(hc.getGlasgow()));
            fila(doc, "Piel", n(hc.getPiel()), "Hemodinamia", n(hc.getHemo()), "Vía aérea / resp. / circ.", n(hc.getViaAerea()) + " / " + n(hc.getRespiracion()) + " / " + n(hc.getCirculacion()));

            seccion(doc, "8–9. Tratamiento y procedimientos");
            doc.add(p(arr(det, "trat")));
            doc.add(p(n(hc.getTratamiento()) + "  " + n(hc.getProcedimientosRealizados())));
            doc.add(p("Evolución: " + n(hc.getEvolucion())));

            seccion(doc, "10–13. Traslado, resultado y entrega");
            fila(doc, "Instrucción", txt(det, "instruccion"), "Resultado", txt(det, "resultado"), "Institución que recibe", n(hc.getDestinoPaciente()));
            fila(doc, "Complicaciones", txt(det, "complicaciones"), "CIE-10", n(hc.getCie10Principal()), "APH que registra", n(hc.getNombreProfesional()));

            doc.add(new Paragraph("Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 para los fines de la atención en salud, facturación y archivo clínico.")
                    .setFontSize(8).setMarginTop(6));
            addFirma(doc, "Firma del paciente  CC " + (p != null ? n(p.getDocumento()) : ""), hc.getFirmaPaciente());
            addFirma(doc, "Firma del acompañante  CC " + txt(det, "docAcompanante"), hc.getFirmaAcompanante());
            addFirma(doc, "Talento humano que traslada: " + n(hc.getNombreProfesional()), hc.getFirmaProfesional());

            String pie = ips != null
                    ? n(ips.getCorreo()) + "  " + n(ips.getTelefono()) + "  " + n(ips.getCiudad())
                    : "CliniSign · JM Ingeniero";
            doc.add(new Paragraph(pie).setFontSize(7).setTextAlignment(TextAlignment.CENTER).setMarginTop(8));
            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el PDF de HC: " + e.getMessage(), e);
        }
    }

    private void seccion(Document doc, String t) {
        doc.add(new Paragraph(t).setBold().setFontSize(9).setBackgroundColor(new DeviceRgb(0, 51, 102)).setFontColor(ColorConstants.WHITE).setMarginTop(6).setPadding(3));
    }

    private void fila(Document doc, String l1, String v1, String l2, String v2, String l3, String v3) {
        Table t = new Table(UnitValue.createPercentArray(new float[]{16, 17, 16, 17, 16, 18})).useAllAvailableWidth();
        t.addCell(cell(l1).setBold());
        t.addCell(cell(v1));
        t.addCell(cell(l2).setBold());
        t.addCell(cell(v2));
        t.addCell(cell(l3).setBold());
        t.addCell(cell(v3));
        doc.add(t);
    }

    private Cell cell(String s) {
        return new Cell().add(new Paragraph(s == null ? "" : s)).setBorder(new SolidBorder(new DeviceRgb(180, 190, 200), 0.4f)).setPadding(3);
    }

    private Paragraph p(String s) { return new Paragraph(s == null ? "" : s).setMargin(2); }

    private void addLogo(Cell cell, Ips ips) {
        if (ips == null || ips.getLogoUrl() == null) return;
        try {
            Path logo = Path.of(uploadDir, ips.getLogoUrl().replaceFirst("^/uploads/?", ""));
            if (!Files.exists(logo)) return;
            Image img = new Image(ImageDataFactory.create(logo.toAbsolutePath().toString()));
            img.setHeight(32);
            cell.add(img);
        } catch (Exception ignored) {}
    }

    private void addFirma(Document doc, String label, String dataUri) {
        doc.add(new Paragraph(label).setBold().setFontSize(8).setMarginTop(6));
        if (dataUri != null && dataUri.startsWith("data:image")) {
            try {
                String b64 = dataUri.substring(dataUri.indexOf(',') + 1);
                Image img = new Image(ImageDataFactory.create(java.util.Base64.getDecoder().decode(b64)));
                img.setHeight(36);
                doc.add(img);
                return;
            } catch (Exception ignored) {}
        }
        doc.add(new Paragraph("______________________________"));
    }

    private JsonNode parse(String json) {
        try { return json == null || json.isBlank() ? mapper.createObjectNode() : mapper.readTree(json); }
        catch (Exception e) { return mapper.createObjectNode(); }
    }

    private String arr(JsonNode n, String k) {
        if (n == null || !n.has(k) || !n.get(k).isArray()) return "";
        StringBuilder sb = new StringBuilder();
        n.get(k).forEach(x -> { if (!sb.isEmpty()) sb.append("; "); sb.append(x.asText()); });
        return sb.toString();
    }

    private String txt(JsonNode n, String k) {
        if (n == null || !n.has(k) || n.get(k).isNull()) return "";
        return n.get(k).asText("");
    }

    private String n(String s) { return s == null ? "" : s; }
}

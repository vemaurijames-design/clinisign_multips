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

            // HEADER
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
            meta.add(new Paragraph("CÓDIGO: " + (hc.getCodigo() != null ? hc.getCodigo() : "HC-FM-05")).setBold());
            meta.add(new Paragraph("VERSIÓN: 01"));
            meta.add(new Paragraph("FECHA: ENERO 2024"));
            head.addCell(meta);
            doc.add(head);

            // 1. INFORMACIÓN GENERAL
            seccion(doc, "1. Información general");
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            fila(doc, "Fecha", hc.getFechaAtencion() != null ? sdf.format(hc.getFechaAtencion()) : "",
                    "Placa móvil", n(hc.getPlacaMovil()),
                    "Hora despacho / llegada / salida", n(hc.getHoraDespacho()) + " / " + n(hc.getHoraLlegada()) + " / " + n(hc.getHoraSalida()));
            fila(doc, "Origen", n(hc.getOrigen()), "Destino 1", n(hc.getDestino1()), "Destino 2 / final", n(hc.getDestino2()));
            fila(doc, "Clasificación", n(hc.getTipoAtencion()), "Conductor", n(hc.getConductor()), "Tripulante / REG", n(hc.getTripulante()) + "  " + n(hc.getRegistroProfesional()));

            // 2. IDENTIFICACIÓN DEL PACIENTE
            seccion(doc, "2. Identificación del paciente");
            if (p != null) {
                fila(doc, "Nombre", n(p.getNombre()) + " " + n(p.getApellido()), "Documento", n(p.getTipoDocumento()) + " " + n(p.getDocumento()), "Edad / sexo", String.valueOf(p.getEdad()) + " / " + n(p.getGenero()));
                fila(doc, "Dirección", n(p.getDireccion()), "Municipio", n(p.getCiudad()), "Teléfono", n(p.getTelefono()));
                fila(doc, "EPS / aseguramiento", n(p.getEps()), "Ocupación", n(p.getOcupacion()), "Estado civil", n(p.getEstadoCivil()));
                if (p.getFechaNacimiento() != null) {
                    doc.add(new Paragraph("Fecha de nacimiento: " + new java.text.SimpleDateFormat("dd/MM/yyyy").format(p.getFechaNacimiento())).setFontSize(9));
                }
                fila(doc, "Acompañante", n(hc.getNombreAcompanante()), "Cédula acompañante", n(hc.getCedulaAcompanante()), "Parentesco", n(hc.getParentescoAcompanante()));
            } else {
                doc.add(new Paragraph("Paciente no asociado").setFontColor(ColorConstants.RED));
            }

            // 3-5. CUIDADOS, EVENTO Y MOTIVO
            seccion(doc, "3–5. Cuidados, evento y motivo");
            doc.add(p("Cuidados anteriores: " + arr(det, "cuidados")));
            doc.add(p("Tipo de evento: " + arr(det, "eventos")));
            doc.add(p("Urgencia médica: " + arr(det, "motMed")));
            doc.add(p("Urgencia traumática: " + arr(det, "motTra")));

            // 6. ANTECEDENTES Y LESIONES
            seccion(doc, "6. Antecedentes y lesiones");
            fila(doc, "Patologías", n(hc.getAntecedentesPersonales()), "Cirugías", n(hc.getAntecedentesQuirurgicos()), "Alergias", n(hc.getAlergias()));
            fila(doc, "Medicamentos", n(hc.getMedicamentosActuales()), "Fumador / alcohol / SPA", n(hc.getFumador()) + " / " + n(hc.getAlcohol()) + " / " + n(hc.getSpa()), "Lesiones", arr(det, "lesiones"));

            // 7. EXAMEN FÍSICO
            seccion(doc, "7. Examen físico");
            fila(doc, "TA", n(hc.getTa()), "FC", n(hc.getFc()), "FR", n(hc.getFr()));
            fila(doc, "Sat O2 %", n(hc.getSpo2()), "Temperatura", n(hc.getTemp()), "Glasgow", hc.getGlasgow() == null ? "" : String.valueOf(hc.getGlasgow()));
            fila(doc, "Piel", n(hc.getPiel()), "Hemodinamia", n(hc.getHemo()), "Vía aérea / resp. / circ.", n(hc.getViaAerea()) + " / " + n(hc.getRespiracion()) + " / " + n(hc.getCirculacion()));

            // 8-9. TRATAMIENTO Y PROCEDIMIENTOS (EN CUADROS)
            seccion(doc, "8–9. Tratamiento y procedimientos");

            Table tProc = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth().setMarginTop(4);
            Cell cProc = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(4);
            cProc.add(new Paragraph("PROCEDIMIENTOS REALIZADOS").setBold().setFontSize(7).setFontColor(new DeviceRgb(0, 51, 102)));
            cProc.add(new Paragraph(arr(det, "trat")).setFontSize(8).setMarginTop(2));
            tProc.addCell(cProc);
            doc.add(tProc);

            Table tTrat = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth().setMarginTop(4);
            Cell cTrat = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(4);
            cTrat.add(new Paragraph("TRATAMIENTO").setBold().setFontSize(7).setFontColor(new DeviceRgb(0, 51, 102)));
            cTrat.add(new Paragraph(n(hc.getTratamiento())).setFontSize(8).setMarginTop(2));
            tTrat.addCell(cTrat);
            doc.add(tTrat);

            Table tEvol = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth().setMarginTop(4);
            Cell cEvol = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(4).setMinHeight(40f);
            cEvol.add(new Paragraph("EVOLUCIÓN").setBold().setFontSize(7).setFontColor(new DeviceRgb(0, 51, 102)));
            cEvol.add(new Paragraph(n(hc.getEvolucion())).setFontSize(8).setMarginTop(2));
            tEvol.addCell(cEvol);
            doc.add(tEvol);

            // 10-13. TRASLADO, RESULTADO Y ENTREGA
            seccion(doc, "10–13. Traslado, resultado y entrega");
            fila(doc, "Instrucción", txt(det, "instruccion"), "Resultado", txt(det, "resultado"), "Institución que recibe", n(hc.getDestinoPaciente()));
            fila(doc, "CIE-10", n(hc.getCie10Principal()), "APH que registra", n(hc.getNombreProfesional()), "", "");

            // CUADRO DE COMPLICACIONES
            Table tComp = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth().setMarginTop(4);
            Cell cComp = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(4).setMinHeight(25f);
            cComp.add(new Paragraph("COMPLICACIONES DURANTE EL TRASLADO").setBold().setFontSize(7).setFontColor(new DeviceRgb(0, 51, 102)));
            cComp.add(new Paragraph(txt(det, "complicaciones")).setFontSize(8).setMarginTop(2));
            tComp.addCell(cComp);
            doc.add(tComp);

            // 13. ENTREGA DEL PACIENTE - SIGNOS VITALES
            seccion(doc, "13. Entrega del paciente - Signos vitales");
            fila(doc, "TA entrega", n(hc.getTaEntrega()), "FC entrega", n(hc.getFcEntrega()), "FR entrega", n(hc.getFrEntrega()));
            fila(doc, "SpO2 entrega", n(hc.getSpo2Entrega()), "Temp entrega", n(hc.getTempEntrega()), "Glasgow entrega", n(hc.getGlasgowEntrega()));
            fila(doc, "Glucometría", n(hc.getGlucEntrega()), "Quien entrega", n(hc.getNombreEntrega()), "CC entrega", n(hc.getCedulaEntrega()));
            fila(doc, "Quien recibe", n(hc.getNombreReceptor()), "CC recibe", n(hc.getCedulaReceptor()), "", "");

            // AUTORIZACIÓN DE DATOS
            Table tAuth = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth().setMarginTop(6);
            Cell cAuth = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(6).setBackgroundColor(new DeviceRgb(240, 248, 255));
            cAuth.add(new Paragraph("AUTORIZACIÓN DE TRATAMIENTO DE DATOS PERSONALES").setBold().setFontSize(8).setFontColor(new DeviceRgb(0, 51, 102)).setTextAlignment(TextAlignment.CENTER));
            cAuth.add(new Paragraph("Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 para los fines de la atención en salud, facturación, archivo clínico y cumplimiento de obligaciones legales. Declaro haber sido informado sobre mis derechos de conocer, actualizar, rectificar y suprimir mis datos personales.").setFontSize(7).setMarginTop(4).setTextAlignment(TextAlignment.JUSTIFIED));
            tAuth.addCell(cAuth);
            doc.add(tAuth);

            // FIRMAS CON INFORMACIÓN
            Table tFirmas = new Table(UnitValue.createPercentArray(new float[]{33, 33, 34})).useAllAvailableWidth().setMarginTop(6);

            Cell cFirmaPac = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(4);
            cFirmaPac.add(new Paragraph("FIRMA DEL PACIENTE").setBold().setFontSize(7).setFontColor(new DeviceRgb(0, 51, 102)).setTextAlignment(TextAlignment.CENTER));
            agregarFirmaEnCelda(cFirmaPac, hc.getFirmaPaciente());
            cFirmaPac.add(new Paragraph("Nombre: " + (p != null ? n(p.getNombre()) + " " + n(p.getApellido()) : "")).setFontSize(6).setTextAlignment(TextAlignment.CENTER).setMarginTop(2));
            cFirmaPac.add(new Paragraph("CC: " + (p != null ? n(p.getDocumento()) : "")).setFontSize(6).setTextAlignment(TextAlignment.CENTER));
            tFirmas.addCell(cFirmaPac);

            Cell cFirmaAcomp = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(4);
            cFirmaAcomp.add(new Paragraph("FIRMA DEL ACOMPAÑANTE").setBold().setFontSize(7).setFontColor(new DeviceRgb(0, 51, 102)).setTextAlignment(TextAlignment.CENTER));
            agregarFirmaEnCelda(cFirmaAcomp, hc.getFirmaAcompanante());
            cFirmaAcomp.add(new Paragraph("Nombre: " + n(hc.getNombreAcompanante())).setFontSize(6).setTextAlignment(TextAlignment.CENTER).setMarginTop(2));
            cFirmaAcomp.add(new Paragraph("CC: " + n(hc.getCedulaAcompanante())).setFontSize(6).setTextAlignment(TextAlignment.CENTER));
            cFirmaAcomp.add(new Paragraph("Parentesco: " + n(hc.getParentescoAcompanante())).setFontSize(6).setTextAlignment(TextAlignment.CENTER));
            tFirmas.addCell(cFirmaAcomp);

            Cell cFirmaProf = new Cell().setBorder(new SolidBorder(new DeviceRgb(0, 51, 102), 0.5f)).setPadding(4);
            cFirmaProf.add(new Paragraph("PROFESIONAL QUE REGISTRA").setBold().setFontSize(7).setFontColor(new DeviceRgb(0, 51, 102)).setTextAlignment(TextAlignment.CENTER));
            agregarFirmaEnCelda(cFirmaProf, hc.getFirmaProfesional());
            cFirmaProf.add(new Paragraph("Nombre: " + n(hc.getNombreProfesional())).setFontSize(6).setTextAlignment(TextAlignment.CENTER).setMarginTop(2));
            cFirmaProf.add(new Paragraph("CC: " + n(hc.getDocumentoProfesional())).setFontSize(6).setTextAlignment(TextAlignment.CENTER));
            cFirmaProf.add(new Paragraph("REG: " + n(hc.getRegistroProfesional())).setFontSize(6).setTextAlignment(TextAlignment.CENTER));
            tFirmas.addCell(cFirmaProf);
            doc.add(tFirmas);

            // PIE DE PÁGINA
            String pie = ips != null
                    ? "NIT: " + n(ips.getNit()) + " | Tel: " + n(ips.getTelefono()) + " | " + n(ips.getDireccion())
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
            img.setHeight(50); img.setAutoScale(true);
            cell.add(img);
        } catch (Exception ignored) {}
    }

    private void agregarFirmaEnCelda(Cell cell, String base64) {
        try {
            if (base64 != null && base64.contains(",")) {
                byte[] bytes = java.util.Base64.getDecoder().decode(base64.substring(base64.indexOf(',') + 1));
                Image img = new Image(ImageDataFactory.create(bytes));
                img.setHeight(25);
                img.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
                cell.add(img);
            }
        } catch (Exception ignored) {}
    }

    private JsonNode parse(String json) {
        try { return json == null || json.isBlank() ? mapper.createObjectNode() : mapper.readTree(json); }
        catch (Exception e) { return mapper.createObjectNode(); }
    }

    private String arr(JsonNode n, String k) {
        if (n == null || !n.has(k) || !n.get(k).isArray()) return "";
        StringBuilder sb = new StringBuilder();
        n.get(k).forEach(x -> { if (sb.length() > 0) sb.append("; "); sb.append(x.asText()); });
        return sb.toString();
    }

    private String txt(JsonNode n, String k) {
        if (n == null || !n.has(k) || n.get(k).isNull()) return "";
        return n.get(k).asText("");
    }

    private String n(String s) { return s == null ? "" : s; }
}
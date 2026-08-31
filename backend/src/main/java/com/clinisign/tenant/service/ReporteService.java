package com.clinisign.tenant.service;

import com.clinisign.tenant.repository.AmbulanciaRepository;
import com.clinisign.tenant.repository.CitaRepository;
import com.clinisign.tenant.repository.HistoriaClinicaRepository;
import com.clinisign.tenant.repository.PacienteRepository;
import com.clinisign.tenant.repository.SolicitudRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReporteService {
    private final PacienteRepository pacRepo;
    private final AmbulanciaRepository ambRepo;
    private final SolicitudRepository solRepo;
    private final HistoriaClinicaRepository hcRepo;
    private final CitaRepository citaRepo;
    private final SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");

    public Map<String, Object> estadisticasGenerales() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPacientes", pacRepo.count());
        stats.put("totalAmbulancias", ambRepo.count());
        stats.put("ambulanciasDisponibles", ambRepo.countByEstado("DISPONIBLE"));
        stats.put("ambulanciasEnServicio", ambRepo.countByEstado("EN_SERVICIO"));
        stats.put("ambulanciasMantenimiento", ambRepo.countByEstado("MANTENIMIENTO"));
        stats.put("solicitudesPendientes", solRepo.findByEstado("PENDIENTE").size());
        stats.put("solicitudesAsignadas", solRepo.findByEstado("ASIGNADA").size());
        stats.put("solicitudesEnRuta", solRepo.findByEstado("EN_RUTA").size());
        stats.put("solicitudesCompletadas", solRepo.findByEstado("COMPLETADA").size());
        stats.put("totalHistoriasClinicas", hcRepo.count());
        stats.put("totalCitas", citaRepo.count());
        stats.put("citasProgramadas", citaRepo.countByEstado("PROGRAMADA"));
        stats.put("fechaGeneracion", sdf.format(new Date()));
        return stats;
    }

    public byte[] generarPdfReporteGeneral() {
        try {
            Map<String, Object> stats = estadisticasGenerales();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfDocument pdf = new PdfDocument(new PdfWriter(out));
            Document doc = new Document(pdf, PageSize.A4);
            doc.setMargins(50, 50, 50, 50);
            doc.add(new Paragraph("REPORTE GENERAL").setBold().setFontSize(18).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("CliniSign — Gestión de ambulancias")
                    .setFontSize(11).setTextAlignment(TextAlignment.CENTER).setMarginBottom(5));
            doc.add(new Paragraph("Fecha: " + sdf.format(new Date()))
                    .setFontSize(10).setTextAlignment(TextAlignment.CENTER).setMarginBottom(20));
            Table table = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                    .setWidth(UnitValue.createPercentValue(100));
            table.addHeaderCell("Indicador");
            table.addHeaderCell("Valor");
            for (Map.Entry<String, Object> entry : stats.entrySet()) {
                table.addCell(formatLabel(entry.getKey()));
                table.addCell(String.valueOf(entry.getValue()));
            }
            doc.add(table);
            doc.add(new Paragraph("CliniSign — JM Ingeniero, Medellín, Colombia.")
                    .setFontSize(8).setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER).setMarginTop(30));
            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando reporte PDF", e);
        }
    }

    private String formatLabel(String key) {
        String spaced = key.replaceAll("([A-Z])", " $1");
        return spaced.substring(0, 1).toUpperCase() + spaced.substring(1);
    }
}

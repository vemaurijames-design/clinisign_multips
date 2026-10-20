package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {
    private final ReporteService service;

    @GetMapping("/estadisticas")
    public ResponseEntity<?> estadisticas() { return ResponseEntity.ok(service.estadisticasGenerales()); }

    @GetMapping("/pdf/general")
    public ResponseEntity<byte[]> pdfGeneral() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=reporte_general.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(service.generarPdfReporteGeneral());
    }
}

package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.HistoriaClinicaPdfService;
import com.clinisign.tenant.service.HistoriaClinicaService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/historias-clinicas")
@RequiredArgsConstructor
public class HistoriaClinicaController {
    private final HistoriaClinicaService service;
    private final HistoriaClinicaPdfService pdfService;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() { return ResponseEntity.ok(service.listar()); }
    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<?> porPaciente(@PathVariable Long pacienteId) { return ResponseEntity.ok(service.porPaciente(pacienteId)); }
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) { return ResponseEntity.ok(service.obtener(id)); }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        byte[] pdf = pdfService.generar(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=hc_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> b) { return ResponseEntity.ok(service.crear(b)); }
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> b) {
        permiso.requerirSuperadmin();
        return ResponseEntity.ok(service.actualizar(id, b));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirSuperadmin();
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }

}

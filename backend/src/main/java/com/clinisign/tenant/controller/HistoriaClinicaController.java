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
        var hc = service.obtener(id);
        String nombre = hc.getPaciente() != null ? (hc.getPaciente().getNombre() != null ? hc.getPaciente().getNombre().replaceAll("[^a-zA-Z0-9]", "_") : "paciente") : "paciente";
        String documento = hc.getPaciente() != null && hc.getPaciente().getDocumento() != null ? hc.getPaciente().getDocumento() : "sin_doc";
        String codigo = hc.getCodigo() != null ? hc.getCodigo() : "HC-" + id;
        String filename = codigo + "_" + nombre + "_" + documento + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> b) { return ResponseEntity.ok(service.crear(b)); }
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> b) {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS", "RADIOPERADOR");
        return ResponseEntity.ok(service.actualizar(id, b));
    }
    @PutMapping("/{id}/activar")
    public ResponseEntity<?> activar(@PathVariable Long id) {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS", "RADIOPERADOR");
        service.activar(id);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/{id}/anular")
    public ResponseEntity<?> anular(@PathVariable Long id) {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS", "RADIOPERADOR");
        service.anular(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirRoles("SUPERADMIN");
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }

}
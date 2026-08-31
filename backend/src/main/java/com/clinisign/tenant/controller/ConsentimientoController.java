package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.ConsentimientoPdfService;
import com.clinisign.tenant.service.ConsentimientoService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/consentimientos")
@RequiredArgsConstructor
public class ConsentimientoController {
    private final ConsentimientoService service;
    private final ConsentimientoPdfService pdfService;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() { return ResponseEntity.ok(service.listar()); }
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> b) { return ResponseEntity.ok(service.crear(b)); }
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=consentimiento_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfService.generarPdf(id));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirEdicion();
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }
}

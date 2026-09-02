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

    @GetMapping("/documento/{documento}")
    public ResponseEntity<?> porDocumento(@PathVariable String documento) {
        return ResponseEntity.ok(service.porDocumento(documento));
    }
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> b) { return ResponseEntity.ok(service.crear(b)); }
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=consentimiento_" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfService.generarPdf(id));
    }
    @PostMapping("/{id}/enviar")
    public ResponseEntity<?> enviar(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> b) {
        String destino = b != null && b.get("correoDestino") != null ? b.get("correoDestino").toString() : null;
        return ResponseEntity.ok(service.enviarCorreo(id, destino));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirEdicion();
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }
}

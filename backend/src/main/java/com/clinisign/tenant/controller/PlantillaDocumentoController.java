package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.PlantillaDocumentoService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/plantillas")
@RequiredArgsConstructor
public class PlantillaDocumentoController {
    private final PlantillaDocumentoService service;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/activas")
    public ResponseEntity<?> activas() {
        return ResponseEntity.ok(service.activas());
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<?> porTipo(@PathVariable String tipo) {
        return ResponseEntity.ok(service.activaPorTipo(tipo));
    }

    @PostMapping
    public ResponseEntity<?> guardar(@RequestBody Map<String, Object> body) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(service.guardar(body));
    }

    @PostMapping("/{id}/modelo")
    public ResponseEntity<?> adjuntar(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(service.adjuntarModelo(id, file));
    }

    @PostMapping("/desde-pdf")
    public ResponseEntity<?> desdePdf(@RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "tipo", required = false) String tipo) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(service.crearDesdePdf(file, tipo));
    }
}
package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.SolicitudService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {
    private final SolicitudService service;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() { return ResponseEntity.ok(service.listar()); }
    @GetMapping("/estado/{estado}")
    public ResponseEntity<?> porEstado(@PathVariable String estado) { return ResponseEntity.ok(service.porEstado(estado)); }
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) { return ResponseEntity.ok(service.obtener(id)); }
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> b) {
        permiso.requerirOperacionSolicitud();
        return ResponseEntity.ok(service.crear(b));
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> b) {
        permiso.requerirOperacionSolicitud();
        return ResponseEntity.ok(service.actualizar(id, b));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirEdicion();
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }
}

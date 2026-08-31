package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.CitaService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {
    private final CitaService service;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/hoy")
    public ResponseEntity<?> hoy() {
        return ResponseEntity.ok(service.hoy());
    }

    @GetMapping("/proximas")
    public ResponseEntity<?> proximas() {
        return ResponseEntity.ok(service.proximas());
    }

    @GetMapping("/resumen")
    public ResponseEntity<?> resumen() {
        return ResponseEntity.ok(service.resumenAgenda());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.crear(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS", "AUXILIAR", "RADIOPERADOR");
        return ResponseEntity.ok(service.actualizar(id, body));
    }

    @PostMapping("/{id}/recordatorio")
    public ResponseEntity<?> recordatorio(@PathVariable Long id) {
        return ResponseEntity.ok(service.enviarRecordatorio(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirEdicion();
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }
}

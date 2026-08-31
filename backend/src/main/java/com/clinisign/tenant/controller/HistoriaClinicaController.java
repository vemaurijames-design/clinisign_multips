package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.HistoriaClinicaService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/historias-clinicas")
@RequiredArgsConstructor
public class HistoriaClinicaController {
    private final HistoriaClinicaService service;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() { return ResponseEntity.ok(service.listar()); }
    @GetMapping("/paciente/{pacienteId}")
    public ResponseEntity<?> porPaciente(@PathVariable Long pacienteId) { return ResponseEntity.ok(service.porPaciente(pacienteId)); }
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) { return ResponseEntity.ok(service.obtener(id)); }
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> b) { return ResponseEntity.ok(service.crear(b)); }
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> b) {
        permiso.requerirEdicion();
        return ResponseEntity.ok(service.actualizar(id, b));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirEdicion();
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }
}

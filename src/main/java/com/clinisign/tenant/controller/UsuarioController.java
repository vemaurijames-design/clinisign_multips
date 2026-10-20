package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.UsuarioService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {
    private final UsuarioService service;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() { return ResponseEntity.ok(service.listar()); }

    @GetMapping("/rol/{rol}")
    public ResponseEntity<?> porRol(@PathVariable String rol) { return ResponseEntity.ok(service.listarPorRol(rol)); }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> b) {
        permiso.requerirEdicion();
        return ResponseEntity.ok(service.crear(b));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, Object> b) {
        permiso.requerirEdicion();
        return ResponseEntity.ok(service.actualizar(id, b));
    }

    @PutMapping("/{id}/activo")
    public ResponseEntity<?> toggle(@PathVariable Long id, @RequestParam Boolean activo) {
        permiso.requerirEdicion();
        return ResponseEntity.ok(service.toggleActivo(id, activo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        permiso.requerirEdicion();
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }
}

package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.NotificacionService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {
    private final NotificacionService notificacionService;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(notificacionService.listar(permiso.rolActual()));
    }

    @GetMapping("/leidas")
    public ResponseEntity<?> listarLeidas() {
        return ResponseEntity.ok(notificacionService.listarLeidasPorRol(permiso.rolActual()));
    }

    @GetMapping("/rol/{rol}")
    public ResponseEntity<?> porRol(@PathVariable String rol) {
        return ResponseEntity.ok(notificacionService.listarLeidasPorRol(rol));
    }

    @PutMapping("/{id}/leida")
    public ResponseEntity<?> leida(@PathVariable Long id) {
        return ResponseEntity.ok(notificacionService.marcarComoLeida(id, permiso.rolActual()));
    }
}

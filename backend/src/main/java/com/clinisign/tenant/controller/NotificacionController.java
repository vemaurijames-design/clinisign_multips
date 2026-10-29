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
        // Obtenemos el rol y el nombre para pasárselos al servicio
        String rol = permiso.rolActual();
        String nombreUsuario = permiso.nombreActual();
        return ResponseEntity.ok(notificacionService.listar(rol, nombreUsuario));
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
package com.clinisign.master.controller;

import com.clinisign.master.service.SuperadminStaffService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperadminController {

    private final SuperadminStaffService staffService;
    private final PermisoUtil permiso;

    @GetMapping("/ips/{ipsId}/usuarios")
    public ResponseEntity<?> usuarios(@PathVariable Long ipsId) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(staffService.listarUsuarios(ipsId));
    }

    @PostMapping("/ips/{ipsId}/usuarios")
    public ResponseEntity<?> crearUsuario(@PathVariable Long ipsId, @RequestBody Map<String, Object> body) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(staffService.crearUsuario(ipsId, body));
    }

    @PutMapping("/ips/{ipsId}/usuarios/{userId}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long ipsId,
                                               @PathVariable Long userId,
                                               @RequestBody Map<String, Object> body) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(staffService.actualizarUsuario(ipsId, userId, body));
    }

    @PutMapping("/ips/{ipsId}/usuarios/{userId}/activo")
    public ResponseEntity<?> toggle(@PathVariable Long ipsId,
                                    @PathVariable Long userId,
                                    @RequestParam Boolean activo) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(staffService.toggleUsuario(ipsId, userId, activo));
    }

    @DeleteMapping("/ips/{ipsId}/usuarios/{userId}")
    public ResponseEntity<?> eliminar(@PathVariable Long ipsId, @PathVariable Long userId) {
        permiso.requerirRol("SUPERADMIN");
        staffService.eliminarUsuario(ipsId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ips/{ipsId}/resumen")
    public ResponseEntity<?> resumen(@PathVariable Long ipsId) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(staffService.resumen(ipsId));
    }
}

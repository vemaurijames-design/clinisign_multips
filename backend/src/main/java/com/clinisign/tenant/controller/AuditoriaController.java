package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.AuditoriaService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {
    private final AuditoriaService service;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS", "CALIDAD");
        return ResponseEntity.ok(service.listar());
    }
}
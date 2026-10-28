package com.clinisign.tenant.controller;

import com.clinisign.tenant.service.PacienteService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/pacientes")
@RequiredArgsConstructor
public class PacienteController {
    private final PacienteService service;
    private final PermisoUtil permiso;

    @GetMapping
    public ResponseEntity<?> listar() { return ResponseEntity.ok(service.listar()); }

    @GetMapping("/buscar")
    public ResponseEntity<?> buscar(@RequestParam(value = "q", required = false) String q) {
        return ResponseEntity.ok(service.buscar(q));
    }

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
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS", "RADIOPERADOR");
        service.eliminar(id);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/{id}/activar")
    public ResponseEntity<?> activar(@PathVariable Long id) {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS", "RADIOPERADOR");
        service.activar(id);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel() throws Exception {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=pacientes.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(service.exportarExcel());
    }
    @PostMapping("/import/excel")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file) throws Exception {
        permiso.requerirEdicion();
        return ResponseEntity.ok(Map.of("importados", service.importarExcel(file)));
    }
}
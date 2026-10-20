package com.clinisign.master.controller;

import com.clinisign.master.dto.IpsDTO;
import com.clinisign.master.dto.IpsPublicDTO;
import com.clinisign.master.entity.Ips;
import com.clinisign.master.entity.IpsConfig;
import com.clinisign.master.repository.IpsConfigRepository;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.master.service.IpsProvisioningService;
import com.clinisign.util.PermisoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ips")
@RequiredArgsConstructor
public class IpsController {

    private final IpsProvisioningService provisioningService;
    private final IpsRepository ipsRepository;
    private final IpsConfigRepository ipsConfigRepository;
    private final PermisoUtil permiso;

    @PostMapping("/create")
    public ResponseEntity<Ips> crearIps(@RequestBody IpsDTO dto) {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(provisioningService.crearIps(dto));
    }

    @GetMapping("/list")
    public ResponseEntity<List<IpsPublicDTO>> listarIpsPublicas() {
        List<IpsPublicDTO> data = ipsRepository.findByActivoTrue().stream()
                .map(ips -> new IpsPublicDTO(ips.getId(), ips.getNombre(), ips.getNit()))
                .toList();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Ips>> listarIpsAdmin() {
        permiso.requerirRol("SUPERADMIN");
        return ResponseEntity.ok(ipsRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ips> obtenerIps(@PathVariable Long id) {
        return ResponseEntity.ok(ipsRepository.findById(id).orElseThrow(() -> new RuntimeException("IPS no encontrada")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ips> actualizarIps(@PathVariable Long id, @RequestBody Ips dto) {
        permiso.requerirRol("SUPERADMIN");
        Ips ips = ipsRepository.findById(id).orElseThrow(() -> new RuntimeException("IPS no encontrada"));
        if (dto.getNombre() != null) ips.setNombre(dto.getNombre());
        if (dto.getDireccion() != null) ips.setDireccion(dto.getDireccion());
        if (dto.getTelefono() != null) ips.setTelefono(dto.getTelefono());
        if (dto.getCorreo() != null) ips.setCorreo(dto.getCorreo());
        if (dto.getRepresentante() != null) ips.setRepresentante(dto.getRepresentante());
        if (dto.getActivo() != null) ips.setActivo(dto.getActivo());
        return ResponseEntity.ok(ipsRepository.save(ips));
    }

    @GetMapping("/{id}/config")
    public ResponseEntity<IpsConfig> obtenerConfig(@PathVariable Long id) {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS");
        IpsConfig config = ipsConfigRepository.findByIpsId(id).orElseGet(() -> {
            IpsConfig c = new IpsConfig();
            c.setIpsId(id);
            return ipsConfigRepository.save(c);
        });
        if (config.getWhatsappToken() != null && config.getWhatsappToken().length() > 6) {
            config.setWhatsappToken("******");
        }
        return ResponseEntity.ok(config);
    }

    @PutMapping("/{id}/config")
    public ResponseEntity<IpsConfig> guardarConfig(@PathVariable Long id, @RequestBody IpsConfig dto) {
        permiso.requerirRoles("SUPERADMIN", "ADMINIPS");
        IpsConfig config = ipsConfigRepository.findByIpsId(id).orElseGet(() -> {
            IpsConfig c = new IpsConfig();
            c.setIpsId(id);
            return c;
        });
        if (dto.getSmtpHost() != null) config.setSmtpHost(dto.getSmtpHost());
        if (dto.getSmtpPort() != null) config.setSmtpPort(dto.getSmtpPort());
        if (dto.getSmtpUsername() != null) config.setSmtpUsername(dto.getSmtpUsername());
        if (dto.getSmtpPassword() != null && !dto.getSmtpPassword().isBlank()) config.setSmtpPassword(dto.getSmtpPassword());
        if (dto.getCorreoFrom() != null) config.setCorreoFrom(dto.getCorreoFrom());
        if (dto.getWhatsappEnabled() != null) config.setWhatsappEnabled(dto.getWhatsappEnabled());
        if (dto.getWhatsappToken() != null && !dto.getWhatsappToken().contains("*")) config.setWhatsappToken(dto.getWhatsappToken());
        if (dto.getWhatsappPhoneNumberId() != null) config.setWhatsappPhoneNumberId(dto.getWhatsappPhoneNumberId());
        if (dto.getWhatsappFrom() != null) config.setWhatsappFrom(dto.getWhatsappFrom());
        return ResponseEntity.ok(ipsConfigRepository.save(config));
    }
}

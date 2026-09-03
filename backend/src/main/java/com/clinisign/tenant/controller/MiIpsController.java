package com.clinisign.tenant.controller;

import com.clinisign.config.EmailService;
import com.clinisign.config.TenantContext;
import com.clinisign.master.entity.Ips;
import com.clinisign.master.entity.IpsConfig;
import com.clinisign.master.repository.IpsConfigRepository;
import com.clinisign.master.repository.IpsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/api/mi-ips")
@RequiredArgsConstructor
public class MiIpsController {
    private final IpsRepository ipsRepository;
    private final IpsConfigRepository ipsConfigRepository;
    private final EmailService emailService;

    @Value("${clinisign.upload.dir:./uploads}")
    private String uploadDir;

    private Long ipsId() {
        Long id = TenantContext.getIpsId();
        if (id == null) throw new RuntimeException("Seleccione la IPS (barra superior o login de IPS).");
        return id;
    }

    @GetMapping
    public ResponseEntity<Ips> obtener() {
        return ResponseEntity.ok(ipsRepository.findById(ipsId())
                .orElseThrow(() -> new RuntimeException("IPS no encontrada")));
    }

    @PutMapping
    public ResponseEntity<Ips> actualizar(@RequestBody Ips dto) {
        Ips ips = ipsRepository.findById(ipsId()).orElseThrow();
        if (dto.getNombre() != null) ips.setNombre(dto.getNombre());
        if (dto.getDireccion() != null) ips.setDireccion(dto.getDireccion());
        if (dto.getCiudad() != null) ips.setCiudad(dto.getCiudad());
        if (dto.getTelefono() != null) ips.setTelefono(dto.getTelefono());
        if (dto.getCorreo() != null) ips.setCorreo(dto.getCorreo());
        if (dto.getRepresentante() != null) ips.setRepresentante(dto.getRepresentante());
        return ResponseEntity.ok(ipsRepository.save(ips));
    }

    @PostMapping("/logo")
    public ResponseEntity<Ips> logo(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Seleccione un archivo de logo (PNG o JPG).");
        }
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "logo.png";
        if (!original.endsWith(".png") && !original.endsWith(".jpg") && !original.endsWith(".jpeg") && !original.endsWith(".webp")) {
            throw new RuntimeException("El logo debe ser PNG, JPG o WEBP.");
        }
        String ext = original.substring(original.lastIndexOf('.'));
        Long id = ipsId();
        try {
            Path dir = Path.of(uploadDir, "ips", String.valueOf(id));
            Files.createDirectories(dir);
            Path dest = dir.resolve("logo" + ext);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            Ips ips = ipsRepository.findById(id).orElseThrow();
            ips.setLogoUrl("/uploads/ips/" + id + "/logo" + ext);
            return ResponseEntity.ok(ipsRepository.save(ips));
        } catch (Exception e) {
            throw new RuntimeException("No se pudo guardar el logo: " + e.getMessage(), e);
        }
    }

    @GetMapping("/config")
    public ResponseEntity<IpsConfig> config() {
        Long id = ipsId();
        IpsConfig config = ipsConfigRepository.findByIpsId(id).orElseGet(() -> {
            IpsConfig c = new IpsConfig();
            c.setIpsId(id);
            return ipsConfigRepository.save(c);
        });
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config")
    public ResponseEntity<IpsConfig> guardarConfig(@RequestBody IpsConfig dto) {
        Long id = ipsId();
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
        if (dto.getSmtpAuth() != null) config.setSmtpAuth(dto.getSmtpAuth());
        if (dto.getSmtpStarttls() != null) config.setSmtpStarttls(dto.getSmtpStarttls());
        if (dto.getWhatsappEnabled() != null) config.setWhatsappEnabled(dto.getWhatsappEnabled());
        if (dto.getWhatsappToken() != null && !dto.getWhatsappToken().contains("*")) config.setWhatsappToken(dto.getWhatsappToken());
        if (dto.getWhatsappPhoneNumberId() != null) config.setWhatsappPhoneNumberId(dto.getWhatsappPhoneNumberId());
        if (dto.getWhatsappFrom() != null) config.setWhatsappFrom(dto.getWhatsappFrom());
        return ResponseEntity.ok(ipsConfigRepository.save(config));
    }

    @PostMapping("/probar-correo")
    public ResponseEntity<?> probar(@RequestBody(required = false) java.util.Map<String, String> body) {
        String to = body != null ? body.get("to") : null;
        if (to == null || to.isBlank()) {
            Ips ips = ipsRepository.findById(ipsId()).orElse(null);
            to = ips != null && ips.getCorreo() != null ? ips.getCorreo() : null;
        }
        if (to == null || to.isBlank()) throw new RuntimeException("Indique un correo destino para la prueba.");
        emailService.probar(ipsId(), to);
        return ResponseEntity.ok(java.util.Map.of("ok", true, "destino", to));
    }
}

package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.entity.IpsConfig;
import com.clinisign.master.entity.Rol;
import com.clinisign.master.entity.SuperadminUser;
import com.clinisign.master.repository.IpsConfigRepository;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.master.repository.MasterRolRepository;
import com.clinisign.master.repository.SuperadminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SuperadminUserRepository superadminRepo;
    private final MasterRolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final IpsRepository ipsRepository;
    private final IpsConfigRepository ipsConfigRepository;

    @Override
    public void run(String... args) {
        String[] roles = {"SUPERADMIN", "ADMINIPS", "AUXILIAR", "RADIOPERADOR", "TECNICO", "CALIDAD"};
        for (String nombre : roles) {
            if (rolRepository.findByNombre(nombre).isEmpty()) {
                Rol rol = new Rol();
                rol.setNombre(nombre);
                rolRepository.save(rol);
            }
        }

        String email = "mantenimientojms@hotmail.com";
        if (superadminRepo.findByEmail(email).isEmpty()) {
            SuperadminUser sa = new SuperadminUser();
            sa.setNombre("JM Ingeniero");
            sa.setEmail(email);
            sa.setPassword(passwordEncoder.encode("admin123456"));
            sa.setActivo(true);
            superadminRepo.save(sa);
            log.info("Superadmin creado: {} / {}", email, "admin123456");
        } else {
            log.info("Superadmin ya existe: {}", email);
        }

        for (Ips ips : ipsRepository.findAll()) {
            IpsConfig cfg = ipsConfigRepository.findByIpsId(ips.getId()).orElseGet(() -> {
                IpsConfig n = new IpsConfig();
                n.setIpsId(ips.getId());
                return n;
            });
            if (cfg.getSmtpPassword() == null || cfg.getSmtpPassword().isBlank()) {
                cfg.setSmtpHost("smtp-mail.outlook.com");
                cfg.setSmtpPort(587);
                cfg.setSmtpAuth(true);
                cfg.setSmtpStarttls(true);
                cfg.setSmtpUsername("notificacionesclinisign@hotmail.com");
                cfg.setSmtpPassword("GQDCUQHFAJWEG7WPQWRP2YYFD");
                cfg.setCorreoFrom("notificacionesclinisign@hotmail.com");
                ipsConfigRepository.save(cfg);
                log.info("SMTP Hotmail configurado para IPS {}", ips.getNombre());
            }
        }
    }
}
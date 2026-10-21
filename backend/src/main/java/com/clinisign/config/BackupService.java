package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupService {

    private final IpsRepository ipsRepository;

    @Value("${clinisign.backup.dir:./backups}")
    private String backupDir;

    @Value("${clinisign.backup.enabled:true}")
    private boolean enabled;

    @Value("${master.datasource.url}")
    private String masterUrl;

    @Value("${master.datasource.username}")
    private String dbUser;

    @Value("${master.datasource.password}")
    private String dbPass;

    @Scheduled(cron = "${clinisign.backup.cron:0 0 2 * * *}")
    public void backupAutomatico() {
        if (!enabled) return;
        try {
            String archivo = ejecutarBackup();
            log.info("Backup automático completado: {}", archivo);
        } catch (Exception e) {
            log.error("Error en backup automático: {}", e.getMessage());
        }
    }

    public String ejecutarBackup() throws Exception {
        File dir = new File(backupDir);
        if (!dir.exists()) dir.mkdirs();

        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm"));
        File destino = new File(dir, "clinisign_" + fecha + ".sql.gz");

        List<String> bases = new ArrayList<>();
        bases.add(extraerNombreBd(masterUrl));
        for (Ips ips : ipsRepository.findAll()) {
            if (ips.getBdNombre() != null && !ips.getBdNombre().isBlank()) {
                bases.add(ips.getBdNombre());
            }
        }

        String host = extraerHost(masterUrl);
        String port = extraerPuerto(masterUrl);

        ProcessBuilder pb = new ProcessBuilder();
        pb.environment().put("PGPASSWORD", dbPass);
        List<String> cmd = new ArrayList<>();
        cmd.add("pg_dumpall");
        cmd.add("-h");
        cmd.add(host);
        cmd.add("-p");
        cmd.add(port);
        cmd.add("-U");
        cmd.add(dbUser);
        pb.command(cmd);
        pb.redirectErrorStream(true);

        Process p = pb.start();
        try (GZIPOutputStream gz = new GZIPOutputStream(new FileOutputStream(destino))) {
            p.getInputStream().transferTo(gz);
        }
        int code = p.waitFor();
        if (code != 0) {
            throw new RuntimeException("pg_dumpall terminó con código " + code);
        }
        log.info("Backup guardado en {} (bases: {})", destino.getAbsolutePath(), bases);
        return destino.getAbsolutePath();
    }

    private String extraerNombreBd(String url) {
        int i = url.lastIndexOf('/');
        return i > 0 ? url.substring(i + 1) : "clinisign_master";
    }

    private String extraerHost(String url) {
        try {
            String s = url.replace("jdbc:postgresql://", "");
            return s.split(":")[0];
        } catch (Exception e) {
            return "localhost";
        }
    }

    private String extraerPuerto(String url) {
        try {
            String s = url.replace("jdbc:postgresql://", "");
            String[] parts = s.split(":");
            if (parts.length > 1) {
                return parts[1].split("/")[0];
            }
        } catch (Exception ignored) {}
        return "5432";
    }
}

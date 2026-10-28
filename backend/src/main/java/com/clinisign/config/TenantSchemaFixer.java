package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TenantSchemaFixer implements ApplicationRunner {
    private final IpsRepository ipsRepository;
    private final DataSourceManager dataSourceManager;

    @Override
    public void run(ApplicationArguments args) {
        for (Ips ips : ipsRepository.findAll()) {
            try {
                dataSourceManager.getDataSource(ips.getId());
                updateColumns(ips.getId());
                insertRoles(ips.getId());
                log.info("Esquema tenant actualizado: {} ({})", ips.getBdNombre(), ips.getId());
            } catch (Exception e) {
                log.warn("No se pudo parchear {}: {}", ips.getBdNombre(), e.getMessage());
            }
        }
    }

    private void updateColumns(Long ipsId) {
        String[] columns = {
                // Consentimientos
                "ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS documento_auxiliar VARCHAR(50)",
                "ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS parentesco_acompanante VARCHAR(100)",
                "ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS firma_profesional TEXT",
                "ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS cedula_auxiliar VARCHAR(50)",
                "ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS nombre_auxiliar VARCHAR(200)",
                "ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS registro_auxiliar VARCHAR(50)",
                // Historias clínicas - datos básicos
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS parentesco_acompanante VARCHAR(100)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS doc_acompanante VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cedula_acompanante VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS nombre_acompanante VARCHAR(200)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS apoyo VARCHAR(100)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS fin_atencion VARCHAR(100)",
                // Firmas
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS firma_acompanante TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS firma_profesional TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS firma_paciente TEXT",
                // Profesional
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS nombre_profesional VARCHAR(200)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS registro_profesional VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cedula_profesional VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS documento_profesional VARCHAR(50)",
                // Entrega/Recepción
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS nombre_entrega VARCHAR(200)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cedula_entrega VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS nombre_receptor VARCHAR(200)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cedula_receptor VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entidad_receptora VARCHAR(200)",
                // Signos vitales entrega
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS ta_entrega VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS fc_entrega VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS fr_entrega VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS spo2_entrega VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS temp_entrega VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS gluc_entrega VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS glasgow_entrega VARCHAR(20)",
                // Diagnósticos
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cie10_principal VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cie10_secundario VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cie10_descripcion VARCHAR(500)",
                // Otros campos
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS complicaciones_traslado TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS destino_paciente VARCHAR(200)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS detalle_json TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS procedimientos_realizados TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS medicamentos_administrados TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS evolucion TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS tratamiento TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS recomendaciones TEXT",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS via_aerea VARCHAR(100)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS cabeza_cuello VARCHAR(100)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS neurologico VARCHAR(100)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS placa_movil VARCHAR(50)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS conductor VARCHAR(200)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS tripulante VARCHAR(200)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hora_despacho VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hora_llegada VARCHAR(20)",
                "ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hora_salida VARCHAR(20)"
        };
        try (var conn = dataSourceManager.getDataSource(ipsId).getConnection()) {
            for (String sql : columns) {
                try (var ps = conn.prepareStatement(sql)) {
                    ps.execute();
                } catch (Exception e) {
                    log.debug("Columna ya existe o error: {}", e.getMessage());
                }
            }
            log.info("Columnas verificadas para IPS {}", ipsId);
        } catch (Exception e) {
            log.warn("No se pudieron actualizar columnas: {}", e.getMessage());
        }
    }

    private void insertRoles(Long ipsId) {
        try (var conn = dataSourceManager.getDataSource(ipsId).getConnection();
             var ps = conn.prepareStatement("INSERT INTO roles (nombre) VALUES (?) ON CONFLICT (nombre) DO NOTHING")) {
            for (String rol : new String[]{"ADMINIPS", "AUXILIAR", "RADIOPERADOR", "TECNICO", "CALIDAD", "MEDICO"}) {
                ps.setString(1, rol);
                ps.executeUpdate();
            }
            log.info("Roles actualizados para IPS {}", ipsId);
        } catch (Exception e) {
            log.warn("No se pudieron insertar roles: {}", e.getMessage());
        }
    }
}
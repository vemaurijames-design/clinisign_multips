package com.clinisign.config;

import com.clinisign.master.entity.Ips;
import com.clinisign.master.entity.IpsConfig;
import com.clinisign.master.repository.IpsConfigRepository;
import com.clinisign.master.repository.IpsRepository;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Component
@Slf4j
public class DataSourceManager {

    private static final Pattern SAFE_IDENT = Pattern.compile("^[a-zA-Z0-9_]+$");

    @Value("${provisioning.datasource.url}")
    private String provisioningUrl;
    @Value("${provisioning.datasource.username}")
    private String provisioningUser;
    @Value("${provisioning.datasource.password}")
    private String provisioningPass;
    @Value("${tenant.datasource.host:localhost}")
    private String tenantHost;
    @Value("${tenant.datasource.port:5432}")
    private int tenantPort;

    private final IpsRepository ipsRepository;
    private final IpsConfigRepository ipsConfigRepository;
    private final ObjectProvider<RoutingDataSource> routingProvider;
    private final PasswordEncoder passwordEncoder;
    private final Map<Long, HikariDataSource> cache = new ConcurrentHashMap<>();

    public DataSourceManager(IpsRepository ipsRepository,
                             IpsConfigRepository ipsConfigRepository,
                             ObjectProvider<RoutingDataSource> routingProvider,
                             PasswordEncoder passwordEncoder) {
        this.ipsRepository = ipsRepository;
        this.ipsConfigRepository = ipsConfigRepository;
        this.routingProvider = routingProvider;
        this.passwordEncoder = passwordEncoder;
    }

    public DataSource getDataSource(Long ipsId) {
        HikariDataSource existing = cache.get(ipsId);
        if (existing != null && !existing.isClosed()) {
            ensureTenantExtras(existing);
            return existing;
        }
        synchronized (this) {
            existing = cache.get(ipsId);
            if (existing != null && !existing.isClosed()) {
                return existing;
            }
            return createAndCache(ipsId);
        }
    }

    public DataSource createDataSourceForIps(Ips ips) {
        String dbUrl = "jdbc:postgresql://" + tenantHost + ":" + tenantPort + "/" + ips.getBdNombre();
        HikariConfig hc = new HikariConfig();
        hc.setJdbcUrl(dbUrl);
        hc.setUsername(provisioningUser);
        hc.setPassword(provisioningPass);
        hc.setDriverClassName("org.postgresql.Driver");
        hc.setMaximumPoolSize(5);
        hc.setMinimumIdle(1);
        hc.setPoolName("tenant-" + ips.getId());
        return new HikariDataSource(hc);
    }

    private HikariDataSource createAndCache(Long ipsId) {
        Ips ips = ipsRepository.findById(ipsId)
                .orElseThrow(() -> new IllegalArgumentException("IPS no encontrada: " + ipsId));
        HikariDataSource ds = (HikariDataSource) createDataSourceForIps(ips);
        ensureTenantExtras(ds);
        cache.put(ipsId, ds);
        try {
            RoutingDataSource routing = routingProvider.getIfAvailable();
            if (routing != null && !routing.hasTenant(ipsId)) {
                routing.addDataSource(ipsId, ds);
            }
        } catch (Exception e) {
            log.warn("No se pudo registrar el pool en el router (la BD sí existe): {}", e.getMessage());
        }
        log.info("DataSource creado para IPS {} ({})", ipsId, ips.getBdNombre());
        return ds;
    }

    private void ensureTenantExtras(DataSource ds) {
        String sql = """
                CREATE TABLE IF NOT EXISTS auditoria (
                    id BIGSERIAL PRIMARY KEY,
                    modulo VARCHAR(80),
                    accion VARCHAR(40),
                    entidad_id BIGINT,
                    usuario_email VARCHAR(200),
                    usuario_nombre VARCHAR(200),
                    rol VARCHAR(50),
                    detalle TEXT,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(250);
                ALTER TABLE citas ADD COLUMN IF NOT EXISTS creado_por VARCHAR(250);
                ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(250);
                ALTER TABLE solicitudes_servicio ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(250);
                ALTER TABLE solicitudes_servicio ADD COLUMN IF NOT EXISTS asignado_a VARCHAR(200);
                ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS plantilla_id BIGINT;
                ALTER TABLE consentimientos ADD COLUMN IF NOT EXISTS consecutivo INTEGER;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS detalle_json TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS firma_paciente TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS firma_acompanante TEXT;
                CREATE TABLE IF NOT EXISTS notificaciones (
                    id BIGSERIAL PRIMARY KEY,
                    rol_destino VARCHAR(50),
                    titulo VARCHAR(200),
                    mensaje TEXT,
                    modulo VARCHAR(80),
                    entidad_id BIGINT,
                    leida BOOLEAN DEFAULT FALSE,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS titulo VARCHAR(200);
                ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS modulo VARCHAR(80);
                ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS entidad_id BIGINT;
                ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS rol_destino VARCHAR(50);
                ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS alcohol VARCHAR(20);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS fumador VARCHAR(20);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS spa VARCHAR(20);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS placa_movil VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS origen VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS destino1 VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS destino2 VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS conductor VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS tripulante VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hora_despacho VARCHAR(20);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hora_llegada VARCHAR(20);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hora_salida VARCHAR(20);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS piel VARCHAR(80);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hemo VARCHAR(80);
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS ocupacion VARCHAR(120);
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(40);
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS municipio VARCHAR(120);
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS aseguramiento VARCHAR(80);
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS parentesco VARCHAR(80);
                ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS tipo_traslado VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS complicaciones_traslado TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS desfibrilacion VARCHAR(80);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS destino_final VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entidad_receptora VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entrega_fc VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entrega_fr VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entrega_glasgow VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entrega_glucometria VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entrega_spo2 VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entrega_ta VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS entrega_temp VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS estado_hemodinamico VARCHAR(80);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS firma_entidad TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS firma_entidad_receptora TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS glucometria VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS hora_ultima_ingesta VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS instrucciones_traslado TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS lesiones_marcadas TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS localizacion_lesiones TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS nombre_asigna_traslado VARCHAR(200);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS ocupacion VARCHAR(120);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS otra_antecedente TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS otros_tratamientos TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS sustancias_psicoactivas VARCHAR(40);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS tipo_aseguramiento VARCHAR(80);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS tipo_traslado_servicio VARCHAR(80);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS trat_a TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS trat_b TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS trat_c TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS trat_x TEXT;
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS peso VARCHAR(20);
                ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS talla VARCHAR(20);
                ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS tipo VARCHAR(80) DEFAULT 'AVISO';
                ALTER TABLE notificaciones ALTER COLUMN tipo DROP NOT NULL;
                ALTER TABLE notificaciones ALTER COLUMN tipo SET DEFAULT 'AVISO';
                UPDATE notificaciones SET tipo = 'AVISO' WHERE tipo IS NULL;
                CREATE TABLE IF NOT EXISTS plantillas_documento (
                    id BIGSERIAL PRIMARY KEY,
                    tipo VARCHAR(40),
                    nombre VARCHAR(200),
                    codigo VARCHAR(40),
                    version VARCHAR(20),
                    procedimientos TEXT,
                    beneficios TEXT,
                    riesgos TEXT,
                    alternativas TEXT,
                    texto_legal TEXT,
                    archivo_modelo_url VARCHAR(300),
                    activa BOOLEAN DEFAULT TRUE,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """;
        try (var conn = ds.getConnection(); var st = conn.createStatement()) {
            for (String part : sql.split(";")) {
                String cmd = part.trim();
                if (!cmd.isEmpty()) st.execute(cmd);
            }
        } catch (Exception e) {
            log.warn("No se pudieron aplicar extras de auditoría: {}", e.getMessage());
        }
    }

    public void registerExisting(Long ipsId, DataSource ds) {
        if (ds instanceof HikariDataSource hikari) {
            cache.put(ipsId, hikari);
        }
    }

    public void provisionTenant(Ips ips, String adminEmail, String adminPassword,
                                String adminNombre, String adminDocumento) {
        String bdNombre = requireSafe(ips.getBdNombre(), "nombre de BD");
        log.info("Provisionando BD {} para IPS {}", bdNombre, ips.getNombre());

        try (Connection conn = DriverManager.getConnection(provisioningUrl, provisioningUser, provisioningPass)) {
            try (Statement st = conn.createStatement()) {
                st.execute("CREATE DATABASE " + quote(bdNombre));
            } catch (Exception e) {
                log.warn("BD {} ya existe o error: {}", bdNombre, e.getMessage());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error conectando al servidor PostgreSQL: " + e.getMessage(), e);
        }

        String tenantUrl = provisioningUrl.endsWith("/")
                ? provisioningUrl + bdNombre
                : provisioningUrl + "/" + bdNombre;

        try (Connection tconn = DriverManager.getConnection(tenantUrl, provisioningUser, provisioningPass)) {
            ScriptUtils.executeSqlScript(tconn, new ClassPathResource("schema-tenant.sql"));
            insertRoles(tconn);
            insertAdminIps(tconn, adminEmail, adminPassword, adminNombre, adminDocumento);
        } catch (Exception e) {
            throw new RuntimeException("Error ejecutando esquema tenant: " + e.getMessage(), e);
        }

        if (ipsConfigRepository.findByIpsId(ips.getId()).isEmpty()) {
            IpsConfig config = new IpsConfig();
            config.setIpsId(ips.getId());
            config.setSmtpHost("smtp.gmail.com");
            config.setSmtpPort(587);
            config.setSmtpUsername(ips.getCorreo());
            config.setSmtpPassword("");
            config.setSmtpAuth(true);
            config.setSmtpStarttls(true);
            config.setCorreoFrom(ips.getCorreo());
            ipsConfigRepository.save(config);
        }

        getDataSource(ips.getId());
        log.info("BD {} provisionada correctamente", bdNombre);
    }

    private void insertRoles(Connection conn) throws Exception {
        String[] roles = {"ADMINIPS", "AUXILIAR", "RADIOPERADOR", "TECNICO", "CALIDAD"};
        for (String rol : roles) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO roles (nombre) VALUES (?) ON CONFLICT (nombre) DO NOTHING")) {
                ps.setString(1, rol);
                ps.executeUpdate();
            }
        }
    }

    private void insertAdminIps(Connection conn, String email, String rawPassword,
                                String nombre, String documento) throws Exception {
        Long rolId;
        try (PreparedStatement ps = conn.prepareStatement("SELECT id FROM roles WHERE nombre = 'ADMINIPS'")) {
            ResultSet rs = ps.executeQuery();
            if (!rs.next()) {
                throw new RuntimeException("Rol ADMINIPS no encontrado");
            }
            rolId = rs.getLong(1);
        }

        String hash = passwordEncoder.encode(rawPassword != null && !rawPassword.isBlank()
                ? rawPassword : "adminips123456");

        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO usuarios (nombre, email, password, documento, rol_id, activo) " +
                        "VALUES (?, ?, ?, ?, ?, true) ON CONFLICT (email) DO NOTHING")) {
            ps.setString(1, nombre != null ? nombre : "Administrador IPS");
            ps.setString(2, email);
            ps.setString(3, hash);
            ps.setString(4, documento);
            ps.setLong(5, rolId);
            ps.executeUpdate();
        }
        log.info("ADMINIPS creado: {}", email);
    }

    private String requireSafe(String ident, String label) {
        if (ident == null || !SAFE_IDENT.matcher(ident).matches()) {
            throw new IllegalArgumentException("Identificador inválido de " + label + ": " + ident);
        }
        return ident;
    }

    private String quote(String ident) {
        return "\"" + ident + "\"";
    }
}

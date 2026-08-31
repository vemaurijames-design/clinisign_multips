-- Esquema maestro. Hibernate también puede crearlo con hbm2ddl=update.
CREATE TABLE IF NOT EXISTS ips (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(200) NOT NULL,
    nit             VARCHAR(20)  NOT NULL UNIQUE,
    dv              VARCHAR(2),
    direccion       VARCHAR(300),
    ciudad          VARCHAR(100),
    telefono        VARCHAR(30),
    correo          VARCHAR(150),
    representante   VARCHAR(200),
    cc_representante VARCHAR(20),
    suplente        VARCHAR(200),
    cc_suplente     VARCHAR(20),
    logo_url        VARCHAR(500),
    bd_nombre       VARCHAR(100) NOT NULL,
    activo          BOOLEAN DEFAULT TRUE,
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ips_config (
    id              BIGSERIAL PRIMARY KEY,
    ips_id          BIGINT NOT NULL REFERENCES ips(id),
    smtp_host       VARCHAR(200),
    smtp_port       INT DEFAULT 587,
    smtp_username   VARCHAR(200),
    smtp_password   VARCHAR(200),
    smtp_auth       BOOLEAN DEFAULT TRUE,
    smtp_starttls   BOOLEAN DEFAULT TRUE,
    correo_from     VARCHAR(200),
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_token   VARCHAR(500),
    whatsapp_phone_number_id VARCHAR(80),
    whatsapp_from    VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS superadmin_users (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(200) NOT NULL,
    email           VARCHAR(200) NOT NULL UNIQUE,
    password        VARCHAR(300) NOT NULL,
    activo          BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS roles_catalogo (
    id    BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO roles_catalogo (nombre) VALUES
    ('SUPERADMIN'), ('ADMINIPS'), ('AUXILIAR'), ('RADIOPERADOR'), ('TECNICO'), ('CALIDAD')
ON CONFLICT DO NOTHING;

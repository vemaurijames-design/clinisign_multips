CREATE TABLE IF NOT EXISTS roles (
    id    BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id         BIGSERIAL PRIMARY KEY,
    nombre     VARCHAR(200) NOT NULL,
    apellido   VARCHAR(200),
    email      VARCHAR(200) NOT NULL UNIQUE,
    password   VARCHAR(300) NOT NULL,
    documento  VARCHAR(20),
    telefono   VARCHAR(30),
    rol_id     BIGINT REFERENCES roles(id),
    activo     BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pacientes (
    id              BIGSERIAL PRIMARY KEY,
    tipo_documento  VARCHAR(10) DEFAULT 'CC',
    documento       VARCHAR(20) NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    apellido        VARCHAR(200),
    fecha_nacimiento DATE,
    edad            INT,
    genero          VARCHAR(20),
    direccion       VARCHAR(300),
    telefono        VARCHAR(30),
    ciudad          VARCHAR(100),
    eps             VARCHAR(100),
    rh              VARCHAR(10),
    contacto_nombre VARCHAR(200),
    contacto_telefono VARCHAR(30),
    antecedentes    TEXT,
    alergias        TEXT,
    medicamentos    TEXT,
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ambulancias (
    id           BIGSERIAL PRIMARY KEY,
    placa        VARCHAR(20) NOT NULL UNIQUE,
    marca        VARCHAR(100),
    modelo       VARCHAR(50),
    ano          INT,
    tipo         VARCHAR(50) DEFAULT 'MV',
    estado       VARCHAR(20) DEFAULT 'DISPONIBLE',
    kilometraje  INT DEFAULT 0,
    soat_venc    DATE,
    tecnomecanica_venc DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solicitudes_servicio (
    id              BIGSERIAL PRIMARY KEY,
    consecutivo     VARCHAR(50),
    paciente_id     BIGINT REFERENCES pacientes(id),
    origen          VARCHAR(300),
    destino         VARCHAR(300),
    ciudad_origen   VARCHAR(100),
    ciudad_destino  VARCHAR(100),
    motivo          VARCHAR(500),
    prioridad       VARCHAR(20) DEFAULT 'NORMAL',
    estado          VARCHAR(30) DEFAULT 'PENDIENTE',
    ambulancia_id   BIGINT REFERENCES ambulancias(id),
    radioperador    VARCHAR(200),
    hora_solicitud  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hora_asignacion TIMESTAMP,
    hora_salida     TIMESTAMP,
    hora_llegada    TIMESTAMP,
    observaciones   TEXT,
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historias_clinicas (
    id                    BIGSERIAL PRIMARY KEY,
    solicitud_id          BIGINT REFERENCES solicitudes_servicio(id),
    paciente_id           BIGINT REFERENCES pacientes(id),
    codigo                VARCHAR(50) DEFAULT 'HC-FM-05',
    version               VARCHAR(10) DEFAULT '01',
    fecha_atencion        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lugar_atencion        VARCHAR(300),
    hora_atencion         VARCHAR(10),
    tipo_atencion         VARCHAR(50),
    motivo_consulta       TEXT,
    enfermedad_actual     TEXT,
    antecedentes_personales   TEXT,
    antecedentes_familiares   TEXT,
    antecedentes_quirurgicos  TEXT,
    alergias                  TEXT,
    medicamentos_actuales     TEXT,
    tto_habitual              TEXT,
    ta                        VARCHAR(20),
    fc                        VARCHAR(20),
    fr                        VARCHAR(20),
    temp                      VARCHAR(20),
    spo2                      VARCHAR(20),
    glasgow                   INT,
    via_aerea                 VARCHAR(200),
    respiracion               VARCHAR(200),
    circulacion               VARCHAR(200),
    discapacidad              VARCHAR(200),
    exposicion                VARCHAR(200),
    cabeza_cuello             TEXT,
    torax                     TEXT,
    abdomen                   TEXT,
    extremidades              TEXT,
    neurologico               TEXT,
    cie10_principal           VARCHAR(20),
    cie10_descripcion         VARCHAR(500),
    cie10_secundario          VARCHAR(20),
    tratamiento               TEXT,
    procedimientos_realizados TEXT,
    medicamentos_administrados TEXT,
    dosis                     VARCHAR(200),
    evolucion                 TEXT,
    destino_paciente          VARCHAR(200),
    recomendaciones           TEXT,
    firma_profesional         TEXT,
    nombre_profesional        VARCHAR(200),
    registro_profesional      VARCHAR(50),
    documento_profesional     VARCHAR(20),
    creado_por                BIGINT,
    fecha_creacion            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consentimientos (
    id                    BIGSERIAL PRIMARY KEY,
    historia_clinica_id   BIGINT REFERENCES historias_clinicas(id),
    tipo                  VARCHAR(50) DEFAULT 'CONSENTIMIENTO',
    codigo                VARCHAR(50) DEFAULT 'HC-FM-04',
    version               VARCHAR(10) DEFAULT '01',
    fecha                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calidad               VARCHAR(200),
    procedimientos        TEXT,
    beneficios            TEXT,
    alternativas          TEXT,
    riesgos               TEXT,
    observaciones         TEXT,
    firma                 TEXT,
    huella_digital        TEXT,
    documento             VARCHAR(20),
    telefono              VARCHAR(30),
    nombre_acompanante    VARCHAR(200),
    documento_acompanante VARCHAR(20),
    firma_acompanante     TEXT,
    nombre_auxiliar       VARCHAR(200),
    registro_auxiliar     VARCHAR(50),
    firmado               BOOLEAN DEFAULT FALSE,
    correo_enviado        BOOLEAN DEFAULT FALSE,
    correo_destino        VARCHAR(200),
    fecha_envio           TIMESTAMP,
    fecha_creacion        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citas (
    id                    BIGSERIAL PRIMARY KEY,
    paciente_id           BIGINT REFERENCES pacientes(id),
    fecha_hora            TIMESTAMP NOT NULL,
    duracion_min          INT DEFAULT 30,
    tipo                  VARCHAR(50) DEFAULT 'CITA',
    motivo                VARCHAR(500),
    lugar                 VARCHAR(300),
    estado                VARCHAR(30) DEFAULT 'PROGRAMADA',
    telefono_whatsapp     VARCHAR(30),
    recordatorio_minutos  INT DEFAULT 60,
    recordatorio_enviado  BOOLEAN DEFAULT FALSE,
    recordatorio_fecha    TIMESTAMP,
    recordatorio_canal    VARCHAR(30),
    whatsapp_link         TEXT,
    observaciones         TEXT,
    creado_por            VARCHAR(200),
    fecha_creacion        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reportes (
    id              BIGSERIAL PRIMARY KEY,
    tipo            VARCHAR(50) NOT NULL,
    datos           JSONB,
    generado_por    BIGINT,
    fecha_generacion VARCHAR(50),
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (nombre) VALUES
    ('ADMINIPS'), ('AUXILIAR'), ('RADIOPERADOR'), ('TECNICO'), ('CALIDAD')
ON CONFLICT (nombre) DO NOTHING;

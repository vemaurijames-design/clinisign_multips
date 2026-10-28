package com.clinisign.tenant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "consentimientos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Consentimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "historia_clinica_id")
    private HistoriaClinica historiaClinica;
    @Column(name = "plantilla_id")
    private Long plantillaId;
    private String tipo = "CONSENTIMIENTO";
    private Integer consecutivo;
    private String codigo = "HC-FM-04";
    private String version = "01";
    private Date fecha;
    private String calidad;
    private String procedimientos;
    private String beneficios;
    private String alternativas;
    private String riesgos;
    private String observaciones;
    private String firma;
    @Column(name = "huella_digital")
    private String huellaDigital;
    private String documento;
    private String telefono;
    @Column(name = "nombre_acompanante")
    private String nombreAcompanante;
    @Column(name = "documento_acompanante")
    private String documentoAcompanante;
    @Column(name = "parentesco_acompanante")
    private String parentescoAcompanante;
    @Column(name = "firma_acompanante")
    private String firmaAcompanante;
    @Column(name = "nombre_auxiliar")
    private String nombreAuxiliar;
    @Column(name = "registro_auxiliar")
    private String registroAuxiliar;
    @Column(name = "documento_auxiliar")
    private String documentoAuxiliar;
    @Column(name = "firma_profesional", columnDefinition = "TEXT")
    private String firmaProfesional;
    @Column(name = "registrado_por")
    private String registradoPor;
    private Boolean firmado = false;
    @Column(name = "correo_enviado")
    private Boolean correoEnviado = false;
    @Column(name = "correo_destino")
    private String correoDestino;
    @Column(name = "fecha_envio")
    private Date fechaEnvio;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    private Boolean activo = true;

    @PrePersist
    void prePersist() {
        if (fecha == null) fecha = new Date();
        if (fechaCreacion == null) fechaCreacion = new Date();
    }
}
package com.clinisign.tenant.entity;

import jakarta.persistence.*;
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
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "historia_clinica_id")
    private HistoriaClinica historiaClinica;
    private String tipo = "CONSENTIMIENTO";
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
    @Column(name = "firma_acompanante")
    private String firmaAcompanante;
    @Column(name = "nombre_auxiliar")
    private String nombreAuxiliar;
    @Column(name = "registro_auxiliar")
    private String registroAuxiliar;
    private Boolean firmado = false;
    @Column(name = "correo_enviado")
    private Boolean correoEnviado = false;
    @Column(name = "correo_destino")
    private String correoDestino;
    @Column(name = "fecha_envio")
    private Date fechaEnvio;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void prePersist() {
        if (fecha == null) fecha = new Date();
        if (fechaCreacion == null) fechaCreacion = new Date();
    }
}

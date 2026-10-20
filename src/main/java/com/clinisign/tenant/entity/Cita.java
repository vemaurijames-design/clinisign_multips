package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "citas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cita {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @Column(name = "fecha_hora", nullable = false)
    private Date fechaHora;

    @Column(name = "duracion_min")
    private Integer duracionMin = 30;

    private String tipo = "CITA";
    private String motivo;
    private String lugar;
    private String estado = "PROGRAMADA";

    @Column(name = "telefono_whatsapp")
    private String telefonoWhatsapp;

    @Column(name = "recordatorio_minutos")
    private Integer recordatorioMinutos = 60;

    @Column(name = "recordatorio_enviado")
    private Boolean recordatorioEnviado = false;

    @Column(name = "recordatorio_fecha")
    private Date recordatorioFecha;

    @Column(name = "recordatorio_canal")
    private String recordatorioCanal;

    @Column(name = "whatsapp_link")
    private String whatsappLink;

    private String observaciones;

    @Column(name = "creado_por")
    private String creadoPor;

    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void prePersist() {
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (estado == null) estado = "PROGRAMADA";
        if (tipo == null) tipo = "CITA";
        if (duracionMin == null) duracionMin = 30;
        if (recordatorioMinutos == null) recordatorioMinutos = 60;
        if (recordatorioEnviado == null) recordatorioEnviado = false;
    }
}

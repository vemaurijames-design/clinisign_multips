package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "solicitudes_servicio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudServicio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String consecutivo;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;
    private String origen;
    private String destino;
    @Column(name = "ciudad_origen")
    private String ciudadOrigen;
    @Column(name = "ciudad_destino")
    private String ciudadDestino;
    private String motivo;
    private String prioridad = "NORMAL";
    private String estado = "PENDIENTE";
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ambulancia_id")
    private Ambulancia ambulancia;
    private String radioperador;
    @Column(name = "hora_solicitud")
    private Date horaSolicitud;
    @Column(name = "hora_asignacion")
    private Date horaAsignacion;
    @Column(name = "hora_salida")
    private Date horaSalida;
    @Column(name = "hora_llegada")
    private Date horaLlegada;
    private String observaciones;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void prePersist() {
        if (horaSolicitud == null) horaSolicitud = new Date();
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (consecutivo == null) consecutivo = "SOL-" + System.currentTimeMillis();
        if (estado == null) estado = "PENDIENTE";
        if (prioridad == null) prioridad = "NORMAL";
    }
}

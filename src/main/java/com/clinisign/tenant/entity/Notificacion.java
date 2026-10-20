package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "notificaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notificacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "rol_destino")
    private String rolDestino;
    private String tipo = "AVISO";
    private String titulo;
    @Column(columnDefinition = "TEXT")
    private String mensaje;
    private String modulo;
    @Column(name = "entidad_id")
    private Long entidadId;
    private Boolean leida = false;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void pre() {
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (leida == null) leida = false;
        if (tipo == null || tipo.isBlank()) tipo = "AVISO";
    }
}

package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "auditoria")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Auditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String modulo;
    private String accion;
    @Column(name = "entidad_id")
    private Long entidadId;
    @Column(name = "usuario_email")
    private String usuarioEmail;
    @Column(name = "usuario_nombre")
    private String usuarioNombre;
    private String rol;
    private String detalle;
    private Date fecha;

    @PrePersist
    void pre() {
        if (fecha == null) fecha = new Date();
    }
}

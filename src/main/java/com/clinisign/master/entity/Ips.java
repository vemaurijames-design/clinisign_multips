package com.clinisign.master.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "ips")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ips {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String nombre;
    @Column(nullable = false, unique = true)
    private String nit;
    private String dv;
    private String direccion;
    private String ciudad;
    private String telefono;
    private String correo;
    private String representante;
    private String ccRepresentante;
    private String suplente;
    private String ccSuplente;
    private String logoUrl;
    @Column(name = "bd_nombre", nullable = false)
    private String bdNombre;
    private Boolean activo = true;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void prePersist() {
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (activo == null) activo = true;
    }
}

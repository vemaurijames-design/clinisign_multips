package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "ambulancias")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ambulancia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String placa;
    private String marca;
    private String modelo;
    private Integer ano;
    private String tipo = "MV";
    private String estado = "DISPONIBLE";
    private Integer kilometraje = 0;
    @Column(name = "soat_venc")
    private Date soatVenc;
    @Column(name = "tecnomecanica_venc")
    private Date tecnomecanicaVenc;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void prePersist() {
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (estado == null) estado = "DISPONIBLE";
        if (tipo == null) tipo = "MV";
    }
}

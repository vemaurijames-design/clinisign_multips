package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "plantillas_documento")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantillaDocumento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /** CONSENTIMIENTO o DESISTIMIENTO */
    private String tipo = "CONSENTIMIENTO";
    private String nombre;
    private String codigo;
    private String version = "01";
    @Column(columnDefinition = "TEXT")
    private String procedimientos;
    @Column(columnDefinition = "TEXT")
    private String beneficios;
    @Column(columnDefinition = "TEXT")
    private String riesgos;
    @Column(columnDefinition = "TEXT")
    private String alternativas;
    @Column(name = "texto_legal", columnDefinition = "TEXT")
    private String textoLegal;
    @Column(name = "archivo_modelo_url")
    private String archivoModeloUrl;
    private Boolean activa = true;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void pre() {
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (activa == null) activa = true;
        if (version == null) version = "01";
    }
}

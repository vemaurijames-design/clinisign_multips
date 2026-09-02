package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "pacientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paciente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tipo_documento")
    private String tipoDocumento = "CC";
    @Column(nullable = false, unique = true)
    private String documento;
    @Column(nullable = false)
    private String nombre;
    private String apellido;
    @Column(name = "fecha_nacimiento")
    private Date fechaNacimiento;
    private Integer edad;
    private String genero;
    private String direccion;
    private String telefono;
    private String ciudad;
    private String eps;
    private String rh;
    @Column(name = "contacto_nombre")
    private String contactoNombre;
    @Column(name = "contacto_telefono")
    private String contactoTelefono;
    private String antecedentes;
    private String alergias;
    private String medicamentos;
    @Column(name = "registrado_por")
    private String registradoPor;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void prePersist() {
        if (fechaCreacion == null) fechaCreacion = new Date();
    }
}

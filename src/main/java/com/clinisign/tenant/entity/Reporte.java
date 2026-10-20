package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reportes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reporte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String tipo;
    @Column(columnDefinition = "text")
    private String datos;
    @Column(name = "generado_por")
    private Long generadoPor;
    @Column(name = "fecha_generacion")
    private String fechaGeneracion;
}

package com.clinisign.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "historias_clinicas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoriaClinica {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "solicitud_id")
    private SolicitudServicio solicitud;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;
    private String codigo = "HC-FM-05";
    private String version = "01";
    @Column(name = "fecha_atencion")
    private Date fechaAtencion;
    @Column(name = "lugar_atencion")
    private String lugarAtencion;
    @Column(name = "hora_atencion")
    private String horaAtencion;
    @Column(name = "tipo_atencion")
    private String tipoAtencion;
    @Column(name = "motivo_consulta")
    private String motivoConsulta;
    @Column(name = "enfermedad_actual")
    private String enfermedadActual;
    @Column(name = "antecedentes_personales")
    private String antecedentesPersonales;
    @Column(name = "antecedentes_familiares")
    private String antecedentesFamiliares;
    @Column(name = "antecedentes_quirurgicos")
    private String antecedentesQuirurgicos;
    private String alergias;
    @Column(name = "medicamentos_actuales")
    private String medicamentosActuales;
    @Column(name = "tto_habitual")
    private String ttoHabitual;
    private String ta;
    private String fc;
    private String fr;
    private String temp;
    private String spo2;
    private Integer glasgow;
    @Column(name = "via_aerea")
    private String viaAerea;
    private String respiracion;
    private String circulacion;
    private String discapacidad;
    private String exposicion;
    @Column(name = "cabeza_cuello")
    private String cabezaCuello;
    private String torax;
    private String abdomen;
    private String extremidades;
    @Column(name = "neurologico")
    private String neurologico;
    @Column(name = "cie10_principal")
    private String cie10Principal;
    @Column(name = "cie10_descripcion")
    private String cie10Descripcion;
    @Column(name = "cie10_secundario")
    private String cie10Secundario;
    private String tratamiento;
    @Column(name = "procedimientos_realizados")
    private String procedimientosRealizados;
    @Column(name = "medicamentos_administrados")
    private String medicamentosAdministrados;
    private String dosis;
    private String evolucion;
    @Column(name = "destino_paciente")
    private String destinoPaciente;
    private String recomendaciones;
    @Column(name = "detalle_json", columnDefinition = "TEXT")
    private String detalleJson;
    @Column(name = "firma_paciente", columnDefinition = "TEXT")
    private String firmaPaciente;
    @Column(name = "firma_acompanante", columnDefinition = "TEXT")
    private String firmaAcompanante;
    @Column(name = "firma_profesional")
    private String firmaProfesional;
    @Column(name = "nombre_profesional")
    private String nombreProfesional;
    @Column(name = "registro_profesional")
    private String registroProfesional;
    @Column(name = "documento_profesional")
    private String documentoProfesional;
    @Column(name = "creado_por")
    private Long creadoPor;
    @Column(name = "fecha_creacion")
    private Date fechaCreacion;

    @PrePersist
    void prePersist() {
        if (fechaAtencion == null) fechaAtencion = new Date();
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (codigo == null) codigo = "HC-FM-05";
        if (version == null) version = "01";
    }
}

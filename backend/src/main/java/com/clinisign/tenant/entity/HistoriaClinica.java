package com.clinisign.tenant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "solicitud_id")
    private SolicitudServicio solicitud;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;
    private String codigo = "HC-FM-05";
    private Integer consecutivo;
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
    @Column(name = "ta_entrega") private String taEntrega;
    @Column(name = "fc_entrega") private String fcEntrega;
    @Column(name = "fr_entrega") private String frEntrega;
    @Column(name = "spo2_entrega") private String spo2Entrega;
    @Column(name = "temp_entrega") private String tempEntrega;
    @Column(name = "gluc_entrega") private String glucEntrega;
    @Column(name = "glasgow_entrega") private String glasgowEntrega;
    @Column(name = "nombre_entrega") private String nombreEntrega;
    @Column(name = "cedula_entrega") private String cedulaEntrega;
    @Column(name = "nombre_receptor") private String nombreReceptor;
    @Column(name = "cedula_receptor") private String cedulaReceptor;
    @Column(name = "registro_receptor")
    private String registroReceptor;
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
    @Column(name = "placa_movil")
    private String placaMovil;
    private String origen;
    private String destino1;
    private String destino2;
    private String conductor;
    private String tripulante;
    @Column(name = "hora_despacho")
    private String horaDespacho;
    @Column(name = "hora_llegada")
    private String horaLlegada;
    @Column(name = "hora_salida")
    private String horaSalida;
    private String alcohol;
    private String fumador;
    private String spa;
    private String piel;
    private String hemo;
    @Column(name = "firma_paciente", columnDefinition = "TEXT")
    private String firmaPaciente;
    @Column(name = "nombre_acompanante") private String nombreAcompanante;
    @Column(name = "cedula_acompanante") private String cedulaAcompanante;
    @Column(name = "parentesco_acompanante") private String parentescoAcompanante;
    @Column(name = "registro_entrega") private String registroEntrega;
    @Column(name = "firma_acompanante", columnDefinition = "TEXT")
    private String firmaAcompanante;
    @Column(name = "firma_profesional", columnDefinition = "TEXT")
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
    private Boolean activo = true;
    @Column(name = "glucometria") private String glucometria;
    @Column(name = "peso") private String peso;
    @Column(name = "talla") private String talla;
    @Column(name = "apoyo") private String apoyo;
    @Column(name = "fin_atencion") private String finAtencion;
    @Column(name = "tipo_aseguramiento") private String tipoAseguramiento;
    @Column(name = "tipo_traslado_servicio") private String tipoTrasladoServicio;
    @Column(name = "estado_civil") private String estadoCivil;
    @Column(name = "ocupacion") private String ocupacion;
    @Column(name = "otra_antecedente") private String otraAntecedente;
    @Column(name = "hora_ultima_ingesta") private String horaUltimaIngesta;
    @Column(name = "localizacion_lesiones") private String localizacionLesiones;
    @Column(name = "trat_x") private String tratX;
    @Column(name = "trat_a") private String tratA;
    @Column(name = "trat_b") private String tratB;
    @Column(name = "trat_c") private String tratC;
    @Column(name = "desfibrilacion") private String desfibrilacion;
    @Column(name = "otros_tratamientos") private String otrosTratamientos;
    @Column(name = "instrucciones_traslado") private String instruccionesTraslado;
    @Column(name = "resultado") private String resultado;
    @Column(name = "complicaciones_traslado") private String complicacionesTraslado;
    @Column(name = "nombre_asigna_traslado") private String nombreAsignaTraslado;
    @Column(name = "entidad_receptora") private String entidadReceptora;
    @Column(name = "firma_entidad", columnDefinition = "TEXT") private String firmaEntidad;
    @Column(name = "firma_entidad_receptora", columnDefinition = "TEXT") private String firmaEntidadReceptora;
    @Column(name = "destino_final") private String destinoFinal;
    @Column(name = "doc_acompanante") private String docAcompanante;

    @PrePersist
    void prePersist() {
        if (fechaAtencion == null) fechaAtencion = new Date();
        if (fechaCreacion == null) fechaCreacion = new Date();
        if (codigo == null) codigo = "HC-FM-05";
        if (version == null) version = "01";
    }
}
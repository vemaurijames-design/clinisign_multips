package com.clinisign.master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IpsDTO {
    private String nombre;
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
    private String adminEmail;
    private String adminPassword;
    private String adminNombre;
    private String adminDocumento;
}

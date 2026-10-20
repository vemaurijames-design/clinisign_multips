package com.clinisign.master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String rol;
    private String email;
    private String nombre;
    private Long ipsId;
    private String ipsNombre;
}

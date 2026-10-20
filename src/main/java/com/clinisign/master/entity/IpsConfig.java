package com.clinisign.master.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ips_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IpsConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "ips_id", nullable = false)
    private Long ipsId;
    private String smtpHost;
    private Integer smtpPort = 587;
    private String smtpUsername;
    private String smtpPassword;
    private Boolean smtpAuth = true;
    private Boolean smtpStarttls = true;
    private String correoFrom;
    private Boolean whatsappEnabled = false;
    private String whatsappToken;
    private String whatsappPhoneNumberId;
    private String whatsappFrom;
}

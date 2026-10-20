package com.clinisign;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ClinisignApplication {
    public static void main(String[] args) {
        System.out.println("CliniSign Multi-IPS v1.0.0 - JM Ingeniero, Medellin");
        SpringApplication.run(ClinisignApplication.class, args);
    }
}

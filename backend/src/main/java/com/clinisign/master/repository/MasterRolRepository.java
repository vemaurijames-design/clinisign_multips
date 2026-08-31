package com.clinisign.master.repository;

import com.clinisign.master.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MasterRolRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByNombre(String nombre);
}

package com.clinisign.master.repository;

import com.clinisign.master.entity.Ips;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IpsRepository extends JpaRepository<Ips, Long> {
    Optional<Ips> findByNit(String nit);
    List<Ips> findByActivoTrue();
}

package com.clinisign.master.repository;

import com.clinisign.master.entity.IpsConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IpsConfigRepository extends JpaRepository<IpsConfig, Long> {
    Optional<IpsConfig> findByIpsId(Long ipsId);
}

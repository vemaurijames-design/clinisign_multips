package com.clinisign.master.repository;

import com.clinisign.master.entity.SuperadminUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SuperadminUserRepository extends JpaRepository<SuperadminUser, Long> {
    Optional<SuperadminUser> findByEmail(String email);
}

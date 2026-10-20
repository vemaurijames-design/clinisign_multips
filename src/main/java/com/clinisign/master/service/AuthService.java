package com.clinisign.master.service;

import com.clinisign.config.JwtService;
import com.clinisign.config.TenantContext;
import com.clinisign.master.dto.AuthResponse;
import com.clinisign.master.dto.LoginRequest;
import com.clinisign.master.entity.Ips;
import com.clinisign.master.entity.SuperadminUser;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.master.repository.SuperadminUserRepository;
import com.clinisign.tenant.entity.Usuario;
import com.clinisign.tenant.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SuperadminUserRepository superadminRepo;
    private final IpsRepository ipsRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest req) {
        if (req.getEmail() == null || req.getPassword() == null) {
            throw new RuntimeException("Email y contraseña son obligatorios");
        }

        if (req.getIpsId() == null) {
            SuperadminUser sa = superadminRepo.findByEmail(req.getEmail())
                    .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));
            if (!Boolean.TRUE.equals(sa.getActivo())) {
                throw new RuntimeException("Superadmin inactivo");
            }
            if (!passwordEncoder.matches(req.getPassword(), sa.getPassword())) {
                throw new RuntimeException("Credenciales inválidas");
            }
            String token = jwtService.generateToken(sa.getEmail(), "SUPERADMIN", null);
            AuthResponse resp = new AuthResponse();
            resp.setToken(token);
            resp.setRol("SUPERADMIN");
            resp.setEmail(sa.getEmail());
            resp.setNombre(sa.getNombre());
            return resp;
        }

        Ips ips = ipsRepository.findById(req.getIpsId())
                .orElseThrow(() -> new RuntimeException("IPS no encontrada"));
        if (!Boolean.TRUE.equals(ips.getActivo())) {
            throw new RuntimeException("IPS inactiva");
        }

        TenantContext.setIpsId(req.getIpsId());
        try {
            Usuario user = usuarioRepository.findByEmail(req.getEmail())
                    .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));
            if (!Boolean.TRUE.equals(user.getActivo())) {
                throw new RuntimeException("Usuario inactivo. Contacte al administrador.");
            }
            if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                throw new RuntimeException("Credenciales inválidas");
            }
            String rolNombre = user.getRol() != null ? user.getRol().getNombre() : "AUXILIAR";
            String token = jwtService.generateToken(user.getEmail(), rolNombre, req.getIpsId());
            AuthResponse resp = new AuthResponse();
            resp.setToken(token);
            resp.setRol(rolNombre);
            resp.setEmail(user.getEmail());
            String apellido = user.getApellido() != null ? " " + user.getApellido() : "";
            resp.setNombre(user.getNombre() + apellido);
            resp.setIpsId(req.getIpsId());
            resp.setIpsNombre(ips.getNombre());
            return resp;
        } finally {
            TenantContext.clear();
        }
    }
}

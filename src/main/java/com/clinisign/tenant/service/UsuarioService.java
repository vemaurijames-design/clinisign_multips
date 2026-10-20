package com.clinisign.tenant.service;

import com.clinisign.tenant.entity.Rol;
import com.clinisign.tenant.entity.Usuario;
import com.clinisign.tenant.repository.TenantRolRepository;
import com.clinisign.tenant.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final TenantRolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Usuario> listar() { return usuarioRepository.findAll(); }
    public List<Usuario> listarPorRol(String rol) { return usuarioRepository.findByRolNombre(rol); }

    public Usuario crear(Map<String, Object> body) {
        Usuario u = new Usuario();
        u.setNombre(str(body.get("nombre")));
        u.setApellido(str(body.get("apellido")));
        u.setEmail(str(body.get("email")));
        u.setDocumento(str(body.get("documento")));
        u.setTelefono(str(body.get("telefono")));
        String rolNombre = str(body.getOrDefault("rol", "AUXILIAR"));
        Rol rol = rolRepository.findByNombre(rolNombre).orElseThrow(() -> new RuntimeException("Rol no encontrado: " + rolNombre));
        u.setRol(rol);
        u.setActivo(true);
        String raw = str(body.get("password"));
        if (raw == null || raw.isBlank()) raw = "Usuario123456";
        u.setPassword(passwordEncoder.encode(raw));
        return usuarioRepository.save(u);
    }

    public Usuario actualizar(Long id, Map<String, Object> body) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        if (body.containsKey("nombre")) u.setNombre(str(body.get("nombre")));
        if (body.containsKey("apellido")) u.setApellido(str(body.get("apellido")));
        if (body.containsKey("email")) u.setEmail(str(body.get("email")));
        if (body.containsKey("telefono")) u.setTelefono(str(body.get("telefono")));
        if (body.containsKey("documento")) u.setDocumento(str(body.get("documento")));
        if (body.containsKey("rol")) {
            Rol rol = rolRepository.findByNombre(str(body.get("rol"))).orElseThrow();
            u.setRol(rol);
        }
        if (body.get("password") != null && !str(body.get("password")).isBlank()) {
            u.setPassword(passwordEncoder.encode(str(body.get("password"))));
        }
        return usuarioRepository.save(u);
    }

    public Usuario toggleActivo(Long id, Boolean activo) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        u.setActivo(activo);
        return usuarioRepository.save(u);
    }

    public void eliminar(Long id) { usuarioRepository.deleteById(id); }

    private String str(Object o) { return o == null ? null : o.toString(); }
}

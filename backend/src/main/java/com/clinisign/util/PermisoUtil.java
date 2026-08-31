package com.clinisign.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class PermisoUtil {

    public void requerirEdicion() {
        String rol = rolActual();
        if (!"SUPERADMIN".equals(rol) && !"ADMINIPS".equals(rol)) {
            throw new RuntimeException("No tiene permisos de edición. Rol actual: " + rol);
        }
    }

    public void requerirRoles(String... roles) {
        String actual = rolActual();
        for (String r : roles) {
            if (r.equals(actual)) return;
        }
        throw new RuntimeException("No tiene permisos para esta acción. Rol actual: " + actual);
    }

    public void requerirRol(String rolNombre) {
        if (!tieneRol(rolNombre)) {
            throw new RuntimeException("Se requiere el rol " + rolNombre);
        }
    }

    public boolean puedeOperarSolicitudes() {
        return Set.of("SUPERADMIN", "ADMINIPS", "RADIOPERADOR").contains(rolActual());
    }

    public void requerirOperacionSolicitud() {
        if (!puedeOperarSolicitudes()) {
            throw new RuntimeException("No tiene permisos sobre solicitudes. Rol actual: " + rolActual());
        }
    }

    public boolean tieneRol(String rolNombre) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + rolNombre));
    }

    public String rolActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) return null;
        return auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }
}

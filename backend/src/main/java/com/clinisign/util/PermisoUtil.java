package com.clinisign.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class PermisoUtil {

    public void requerirSuperadmin() {
        if (!"SUPERADMIN".equals(rolActual())) {
            throw new RuntimeException("Solo el SUPERADMIN puede crear o modificar usuarios. El cliente IPS solo consulta su staff.");
        }
    }

    public void requerirEdicion() {
        String rol = rolActual();
        if (!"SUPERADMIN".equals(rol) && !"ADMINIPS".equals(rol) && !"RADIOPERADOR".equals(rol) && !"AUXILIAR".equals(rol) && !"MEDICO".equals(rol)) {
            throw new RuntimeException("No tiene permisos de edición. Rol actual: " + rol);
        }
    }

    public void requerirEdicionHistoria() {
        if (!"SUPERADMIN".equals(rolActual())) {
            throw new RuntimeException("La historia clínica es un documento reservado (Ley 23 de 1981 y Res. 1995 de 1999). Solo el SUPERADMIN o quien él autorice puede corregirla. El resto solo visualiza.");
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
        return Set.of("SUPERADMIN", "ADMINIPS", "RADIOPERADOR", "AUXILIAR", "MEDICO").contains(rolActual());
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

    // Permisos de administración (anular, enviar correo)
    public boolean puedeAdministrar() {
        return Set.of("SUPERADMIN", "ADMINIPS", "RADIOPERADOR").contains(rolActual());
    }

    public void requerirAdministrador() {
        if (!puedeAdministrar()) {
            throw new RuntimeException("Solo ADMINIPS, RADIOPERADOR o SUPERADMIN pueden realizar esta acción. Rol actual: " + rolActual());
        }
    }

    // Permisos de configuración
    public boolean puedeConfigurar() {
        return Set.of("SUPERADMIN", "ADMINIPS", "RADIOPERADOR").contains(rolActual());
    }

    public void requerirConfiguracion() {
        if (!puedeConfigurar()) {
            throw new RuntimeException("Solo ADMINIPS, RADIOPERADOR o SUPERADMIN pueden configurar. Rol actual: " + rolActual());
        }
    }

    // ✅ AGREGADO: Obtener el nombre del usuario logueado desde el token
    public String nombreActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return "Sistema";
        return auth.getName(); // Retorna el email o nombre con el que se loguea
    }

}
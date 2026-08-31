package com.clinisign.master.service;

import com.clinisign.config.DataSourceManager;
import com.clinisign.config.TenantContext;
import com.clinisign.master.entity.Ips;
import com.clinisign.master.repository.IpsRepository;
import com.clinisign.tenant.entity.Usuario;
import com.clinisign.tenant.repository.AmbulanciaRepository;
import com.clinisign.tenant.repository.CitaRepository;
import com.clinisign.tenant.repository.ConsentimientoRepository;
import com.clinisign.tenant.repository.HistoriaClinicaRepository;
import com.clinisign.tenant.repository.PacienteRepository;
import com.clinisign.tenant.repository.SolicitudRepository;
import com.clinisign.tenant.repository.UsuarioRepository;
import com.clinisign.tenant.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class SuperadminStaffService {

    private final IpsRepository ipsRepository;
    private final DataSourceManager dataSourceManager;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final PacienteRepository pacienteRepository;
    private final AmbulanciaRepository ambulanciaRepository;
    private final SolicitudRepository solicitudRepository;
    private final HistoriaClinicaRepository historiaRepository;
    private final ConsentimientoRepository consentimientoRepository;
    private final CitaRepository citaRepository;

    public List<Usuario> listarUsuarios(Long ipsId) {
        return onIps(ipsId, usuarioService::listar);
    }

    public Usuario crearUsuario(Long ipsId, Map<String, Object> body) {
        return onIps(ipsId, () -> usuarioService.crear(body));
    }

    public Usuario actualizarUsuario(Long ipsId, Long userId, Map<String, Object> body) {
        return onIps(ipsId, () -> usuarioService.actualizar(userId, body));
    }

    public Usuario toggleUsuario(Long ipsId, Long userId, Boolean activo) {
        return onIps(ipsId, () -> usuarioService.toggleActivo(userId, activo));
    }

    public void eliminarUsuario(Long ipsId, Long userId) {
        onIps(ipsId, () -> {
            usuarioService.eliminar(userId);
            return null;
        });
    }

    public Map<String, Object> resumen(Long ipsId) {
        return onIps(ipsId, () -> {
            Ips ips = ipsRepository.findById(ipsId).orElseThrow();
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("ipsId", ips.getId());
            data.put("ipsNombre", ips.getNombre());
            data.put("nit", ips.getNit());
            data.put("bdNombre", ips.getBdNombre());
            data.put("activo", ips.getActivo());
            data.put("usuarios", usuarioRepository.count());
            data.put("pacientes", pacienteRepository.count());
            data.put("ambulancias", ambulanciaRepository.count());
            data.put("solicitudes", solicitudRepository.count());
            data.put("historiasClinicas", historiaRepository.count());
            data.put("consentimientos", consentimientoRepository.count());
            data.put("citas", citaRepository.count());
            return data;
        });
    }

    private <T> T onIps(Long ipsId, Supplier<T> action) {
        Ips ips = ipsRepository.findById(ipsId)
                .orElseThrow(() -> new RuntimeException("IPS no encontrada"));
        if (!Boolean.TRUE.equals(ips.getActivo())) {
            throw new RuntimeException("La IPS está inactiva");
        }
        dataSourceManager.getDataSource(ipsId);
        Long previous = TenantContext.getIpsId();
        TenantContext.setIpsId(ipsId);
        try {
            return action.get();
        } finally {
            if (previous != null) TenantContext.setIpsId(previous);
            else TenantContext.clear();
        }
    }
}

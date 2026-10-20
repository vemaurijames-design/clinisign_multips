package com.clinisign.tenant.service;

import com.clinisign.config.ActorContext;
import com.clinisign.tenant.entity.Auditoria;
import com.clinisign.tenant.repository.AuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditoriaService {
    private final AuditoriaRepository repo;

    public List<Auditoria> listar() {
        return repo.findTop80ByOrderByFechaDesc();
    }

    public void registrar(String modulo, String accion, Long entidadId, String detalle) {
        try {
            Auditoria a = new Auditoria();
            a.setModulo(modulo);
            a.setAccion(accion);
            a.setEntidadId(entidadId);
            a.setDetalle(detalle);
            a.setUsuarioEmail(ActorContext.email());
            a.setUsuarioNombre(ActorContext.nombre());
            a.setRol(ActorContext.rol());
            repo.save(a);
        } catch (Exception ignored) {
            // La IPS vieja puede no tener tabla auditoria; no debe bloquear el guardado.
        }
    }
}

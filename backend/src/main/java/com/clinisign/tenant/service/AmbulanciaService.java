package com.clinisign.tenant.service;

import com.clinisign.tenant.entity.Ambulancia;
import com.clinisign.tenant.repository.AmbulanciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AmbulanciaService {
    private final AmbulanciaRepository repo;

    public List<Ambulancia> listar() { return repo.findAll(); }
    public Ambulancia obtener(Long id) { return repo.findById(id).orElseThrow(); }
    public Ambulancia crear(Map<String, Object> body) {
        Ambulancia a = new Ambulancia();
        mapear(a, body);
        return repo.save(a);
    }
    public Ambulancia actualizar(Long id, Map<String, Object> body) {
        Ambulancia a = repo.findById(id).orElseThrow();
        mapear(a, body);
        return repo.save(a);
    }
    public void eliminar(Long id) { repo.deleteById(id); }

    private void mapear(Ambulancia a, Map<String, Object> body) {
        if (body.containsKey("placa")) a.setPlaca(str(body.get("placa")));
        if (body.containsKey("marca")) a.setMarca(str(body.get("marca")));
        if (body.containsKey("modelo")) a.setModelo(str(body.get("modelo")));
        if (body.containsKey("ano")) a.setAno(toInt(body.get("ano")));
        if (body.containsKey("tipo")) a.setTipo(str(body.get("tipo")));
        if (body.containsKey("estado")) a.setEstado(str(body.get("estado")));
        if (body.containsKey("kilometraje")) a.setKilometraje(toInt(body.get("kilometraje")));
    }
    private Integer toInt(Object o) {
        if (o == null || o.toString().isBlank()) return null;
        return Integer.valueOf(o.toString());
    }
    private String str(Object o) { return o == null ? null : o.toString(); }
}

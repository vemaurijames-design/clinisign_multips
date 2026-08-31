import { useEffect, useState } from 'react';
import { ambulanciaService, pacienteService, solicitudService } from '../services/rest';

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [ambulancias, setAmbulancias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const cargar = async () => {
    const [sols, pacs, ambs] = await Promise.all([
      solicitudService.listar(), pacienteService.listar(), ambulanciaService.listar(),
    ]);
    setSolicitudes(sols.data);
    setPacientes(pacs.data);
    setAmbulancias(ambs.data.filter((a: any) => a.estado === 'DISPONIBLE'));
  };
  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id: number, estado: string, ambulanciaId?: number) => {
    await solicitudService.actualizar(id, { estado, ambulanciaId });
    cargar();
  };

  return (
    <div>
      <div className="page-head">
        <h2>Solicitudes de servicio</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Nueva</button>
      </div>
      {showForm && <Form pacientes={pacientes} onSave={async (data: any) => {
        await solicitudService.crear(data); setShowForm(false); cargar();
      }} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Consecutivo</th><th>Paciente</th><th>Origen</th><th>Destino</th><th>Prioridad</th><th>Estado</th><th>Ambulancia</th><th></th></tr></thead>
          <tbody>
            {solicitudes.map(s => (
              <tr key={s.id}>
                <td>{s.consecutivo}</td>
                <td>{s.paciente?.nombre} {s.paciente?.apellido}</td>
                <td>{s.origen}</td><td>{s.destino}</td><td>{s.prioridad}</td>
                <td>{s.estado}</td>
                <td>{s.ambulancia?.placa ?? '—'}</td>
                <td>
                  {s.estado === 'PENDIENTE' && (
                    <select defaultValue="" onChange={e => { const ambId = Number(e.target.value); if (ambId) cambiarEstado(s.id, 'ASIGNADA', ambId); }}>
                      <option value="" disabled>Asignar...</option>
                      {ambulancias.map(a => <option key={a.id} value={a.id}>{a.placa}</option>)}
                    </select>
                  )}
                  {s.estado === 'ASIGNADA' && <button onClick={() => cambiarEstado(s.id, 'EN_RUTA')}>En ruta</button>}
                  {s.estado === 'EN_RUTA' && <button onClick={() => cambiarEstado(s.id, 'COMPLETADA')}>Completar</button>}
                  {s.estado !== 'COMPLETADA' && s.estado !== 'CANCELADA' && <button onClick={() => cambiarEstado(s.id, 'CANCELADA')}>Cancelar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Form({ pacientes, onSave, onCancel }: any) {
  const [form, setForm] = useState({
    pacienteId: '', origen: '', destino: '', ciudadOrigen: '', ciudadDestino: '',
    motivo: '', prioridad: 'NORMAL', observaciones: '', radioperador: '',
  });
  return (
    <div className="card">
      <h3>Nueva solicitud</h3>
      <div className="form-grid-2">
        <select value={form.pacienteId} onChange={e => setForm({ ...form, pacienteId: e.target.value })}>
          <option value="">Paciente...</option>
          {pacientes.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.documento}</option>)}
        </select>
        <input placeholder="Radioperador" value={form.radioperador} onChange={e => setForm({ ...form, radioperador: e.target.value })} />
        <input placeholder="Origen" value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })} />
        <input placeholder="Destino" value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })} />
        <input placeholder="Ciudad origen" value={form.ciudadOrigen} onChange={e => setForm({ ...form, ciudadOrigen: e.target.value })} />
        <input placeholder="Ciudad destino" value={form.ciudadDestino} onChange={e => setForm({ ...form, ciudadDestino: e.target.value })} />
        <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
          <option value="NORMAL">Normal</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>
        <input placeholder="Motivo" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
      </div>
      <textarea placeholder="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={() => onSave(form)}>Guardar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

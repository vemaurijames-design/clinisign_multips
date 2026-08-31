import { useEffect, useState } from 'react';
import { citaService, pacienteService } from '../services/rest';

export default function Agenda() {
  const [citas, setCitas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');

  const cargar = async () => {
    const [c, p] = await Promise.all([citaService.listar(), pacienteService.listar()]);
    setCitas(c.data);
    setPacientes(p.data);
  };
  useEffect(() => { cargar().catch(() => {}); }, []);

  const recordar = async (id: number) => {
    try {
      const { data } = await citaService.recordatorio(id);
      setMsg(data.detalle + (data.whatsappLink ? ' Enlace listo.' : ''));
      if (data.whatsappLink) window.open(data.whatsappLink, '_blank');
      cargar();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'No se pudo enviar el recordatorio');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Agenda y recordatorios</h2>
          <p className="hint">Agende la cita del paciente y envíe el recordatorio por WhatsApp (API de Meta o enlace wa.me).</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Nueva cita</button>
      </div>
      {msg && <div className="card">{msg}</div>}
      {showForm && (
        <CitaForm pacientes={pacientes} onSave={async (data: any) => {
          await citaService.crear(data);
          setShowForm(false);
          cargar();
        }} onCancel={() => setShowForm(false)} />
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Paciente</th><th>Tipo</th><th>Motivo</th>
              <th>WhatsApp</th><th>Estado</th><th>Recordatorio</th><th></th>
            </tr>
          </thead>
          <tbody>
            {citas.map(c => (
              <tr key={c.id}>
                <td>{c.fechaHora ? new Date(c.fechaHora).toLocaleString() : ''}</td>
                <td>{c.paciente?.nombre} {c.paciente?.apellido}</td>
                <td>{c.tipo}</td>
                <td>{c.motivo}</td>
                <td>{c.telefonoWhatsapp || '—'}</td>
                <td>{c.estado}</td>
                <td>{c.recordatorioEnviado ? `Sí (${c.recordatorioCanal || ''})` : 'Pendiente'}</td>
                <td>
                  <button onClick={() => recordar(c.id)}>WhatsApp</button>
                  <select defaultValue={c.estado} onChange={async e => {
                    await citaService.actualizar(c.id, { estado: e.target.value });
                    cargar();
                  }}>
                    <option value="PROGRAMADA">Programada</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="CUMPLIDA">Cumplida</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="NO_ASISTIO">No asistió</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CitaForm({ pacientes, onSave, onCancel }: any) {
  const [form, setForm] = useState({
    pacienteId: '', fechaHora: '', tipo: 'CITA', motivo: '', lugar: '',
    telefonoWhatsapp: '', recordatorioMinutos: 60, observaciones: '',
  });
  const onPaciente = (id: string) => {
    const p = pacientes.find((x: any) => String(x.id) === id);
    setForm({ ...form, pacienteId: id, telefonoWhatsapp: p?.telefono || form.telefonoWhatsapp });
  };
  return (
    <div className="card">
      <h3>Nueva cita</h3>
      <div className="form-grid">
        <select value={form.pacienteId} onChange={e => onPaciente(e.target.value)}>
          <option value="">Paciente...</option>
          {pacientes.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.documento}</option>)}
        </select>
        <input type="datetime-local" value={form.fechaHora} onChange={e => setForm({ ...form, fechaHora: e.target.value })} />
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
          <option value="CITA">Cita</option>
          <option value="CONTROL">Control</option>
          <option value="TRASLADO">Traslado</option>
          <option value="SEGUIMIENTO">Seguimiento</option>
        </select>
        <input placeholder="Lugar" value={form.lugar} onChange={e => setForm({ ...form, lugar: e.target.value })} />
        <input placeholder="WhatsApp 300..." value={form.telefonoWhatsapp} onChange={e => setForm({ ...form, telefonoWhatsapp: e.target.value })} />
        <input type="number" placeholder="Recordar (minutos antes)" value={form.recordatorioMinutos}
          onChange={e => setForm({ ...form, recordatorioMinutos: Number(e.target.value) })} />
      </div>
      <input placeholder="Motivo" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
      <textarea placeholder="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={() => onSave(form)}>Agendar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

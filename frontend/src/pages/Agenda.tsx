import { useEffect, useMemo, useState } from 'react';
import { citaService, pacienteService } from '../services/rest';
import BuscadorPaciente from '../components/BuscadorPaciente';

export default function Agenda() {
  const [citas, setCitas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [vista, setVista] = useState<'lista' | 'semana' | 'mes'>('semana');
  const [q, setQ] = useState('');
  const [buscado, setBuscado] = useState('');
  const [pacienteSel, setPacienteSel] = useState<any>(null);
  const [detalle, setDetalle] = useState<any>(null);
  const [cursor, setCursor] = useState(() => new Date());

  const cargar = async () => {
    const [c, p] = await Promise.all([citaService.listar(), pacienteService.listar()]);
    setCitas(c.data || []);
    setPacientes(p.data || []);
  };
  useEffect(() => { cargar().catch(() => {}); }, []);

  const filtradas = citas.filter(c => {
    const doc = pacienteSel?.documento || buscado;
    if (!doc) return true;
    const t = `${c.paciente?.nombre} ${c.paciente?.apellido} ${c.paciente?.documento} ${c.motivo} ${c.tipo}`.toLowerCase();
    return t.includes(String(doc).toLowerCase());
  });

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
          <h2>Agenda</h2>
          <p className="hint">Busque paciente por cédula o nombre. Vista semana o mes. La cita queda ligada al paciente de esta IPS.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Nueva cita</button>
      </div>
      {msg && <div className="card">{msg}</div>}
      <BuscadorPaciente onElegir={p => { setPacienteSel(p); setBuscado(p.documento || p.nombre); setShowForm(true); }} />
      {pacienteSel && (
        <div className="card">
          <h3>Historial de {pacienteSel.nombre} {pacienteSel.apellido} · {pacienteSel.documento}</h3>
          <p className="hint">Tel {pacienteSel.telefono || '—'} · EPS {pacienteSel.eps || '—'}</p>
          <ul>
            {filtradas.map((c: any) => (
              <li key={c.id}>
                {c.fechaHora ? new Date(c.fechaHora).toLocaleString() : ''} — {c.tipo} {c.motivo} [{c.estado}] {c.creadoPor ? `· ${c.creadoPor}` : ''}
                <button onClick={() => recordar(c.id)}>WhatsApp</button>
                <button onClick={() => setDetalle(c)}>Ver</button>
              </li>
            ))}
          </ul>
          {filtradas.length === 0 && <p className="hint">Sin citas. Use Nueva cita para agendar a este paciente.</p>}
          <button onClick={() => { setPacienteSel(null); setBuscado(''); }}>Quitar filtro</button>
        </div>
      )}
      <div className="toolbar">
        <input placeholder="Filtrar citas ya agendadas" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" className="btn-primary" onClick={() => setBuscado(q)}>Filtrar agenda</button>
        <button onClick={() => setVista('lista')}>Lista</button>
        <button onClick={() => setVista('semana')}>Semana</button>
        <button onClick={() => setVista('mes')}>Mes</button>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>◀</button>
        <strong>{cursor.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</strong>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>▶</button>
      </div>
      {showForm && (
        <CitaForm pacientes={pacientes} prefill={pacienteSel} onSave={async (data: any) => {
          await citaService.crear(data);
          setShowForm(false);
          cargar();
        }} onCancel={() => setShowForm(false)} />
      )}
      {vista === 'lista' && <ListaCitas citas={filtradas} recordar={recordar} recargar={cargar} onDetalle={setDetalle} />}
      {vista !== 'lista' && <Calendario citas={filtradas} cursor={cursor} modo={vista} onDetalle={setDetalle} />}
      {detalle && (
        <div className="card">
          <h3>Detalle de la cita</h3>
          <p><strong>Paciente:</strong> {detalle.paciente?.nombre} {detalle.paciente?.apellido} · {detalle.paciente?.documento}</p>
          <p><strong>Tel:</strong> {detalle.telefonoWhatsapp || detalle.paciente?.telefono}</p>
          <p><strong>Fecha:</strong> {detalle.fechaHora ? new Date(detalle.fechaHora).toLocaleString() : ''}</p>
          <p><strong>Tipo / motivo:</strong> {detalle.tipo} — {detalle.motivo}</p>
          <p><strong>Lugar:</strong> {detalle.lugar}</p>
          <p><strong>Creada por:</strong> {detalle.creadoPor || '—'}</p>
          <p><strong>Estado:</strong> {detalle.estado}</p>
          <p>{detalle.observaciones}</p>
          <button onClick={() => setDetalle(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}

function ListaCitas({ citas, recordar, recargar, onDetalle }: any) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr><th>Fecha</th><th>Paciente</th><th>Doc</th><th>Tipo</th><th>Motivo</th><th>WhatsApp</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          {citas.map((c: any) => (
            <tr key={c.id}>
              <td>{c.fechaHora ? new Date(c.fechaHora).toLocaleString() : ''}</td>
              <td>{c.paciente?.nombre} {c.paciente?.apellido}</td>
              <td>{c.paciente?.documento}</td>
              <td>{c.tipo}</td>
              <td>{c.motivo}</td>
              <td>{c.telefonoWhatsapp || '—'}</td>
              <td>{c.estado}</td>
              <td>
                <button onClick={() => onDetalle?.(c)}>Ver</button>
                <button onClick={() => recordar(c.id)}>WhatsApp</button>
                <select defaultValue={c.estado} onChange={async e => {
                  await citaService.actualizar(c.id, { estado: e.target.value });
                  recargar();
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
  );
}

function Calendario({ citas, cursor, modo, onDetalle }: { citas: any[]; cursor: Date; modo: string; onDetalle?: (c: any) => void }) {
  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    if (modo === 'semana') {
      const d = new Date(cursor);
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      return Array.from({ length: 7 }, (_, i) => {
        const x = new Date(d); x.setDate(d.getDate() + i); return x;
      });
    }
    const first = new Date(year, month, 1);
    const startPad = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = Array(startPad).fill(null);
    for (let i = 1; i <= days; i++) arr.push(new Date(year, month, i));
    return arr;
  }, [cursor, modo]);

  const enDia = (d: Date | null) => {
    if (!d) return [];
    return citas.filter(c => {
      if (!c.fechaHora) return false;
      const x = new Date(c.fechaHora);
      return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate();
    });
  };

  return (
    <div className="form-grid" style={{ gridTemplateColumns: modo === 'semana' ? 'repeat(7, 1fr)' : 'repeat(7, 1fr)' }}>
      {['L','M','X','J','V','S','D'].map(h => <div key={h} className="hint" style={{ fontWeight: 700 }}>{h}</div>)}
      {cells.map((d, i) => (
        <div key={i} className="card" style={{ minHeight: 90, padding: 8 }}>
          <strong>{d ? d.getDate() : ''}</strong>
          {enDia(d).map((c: any) => (
            <button key={c.id} type="button" className="hint" onClick={() => onDetalle?.(c)}>
              {c.fechaHora ? new Date(c.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} {c.paciente?.nombre} {c.tipo}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function CitaForm({ pacientes, prefill, onSave, onCancel }: any) {
  const [q, setQ] = useState(prefill?.documento || '');
  const [form, setForm] = useState({
    pacienteId: prefill?.id ? String(prefill.id) : '', fechaHora: '', tipo: 'CITA', motivo: '', lugar: '',
    telefonoWhatsapp: prefill?.telefono || '', recordatorioMinutos: 60, observaciones: '',
  });
  const lista = (pacientes || []).filter((p: any) =>
    !q || `${p.nombre} ${p.apellido} ${p.documento}`.toLowerCase().includes(q.toLowerCase())
  );
  const onPaciente = (id: string) => {
    const p = pacientes.find((x: any) => String(x.id) === id);
    setForm({ ...form, pacienteId: id, telefonoWhatsapp: p?.telefono || form.telefonoWhatsapp });
  };
  return (
    <div className="card">
      <h3>Nueva cita</h3>
      <div className="toolbar">
        <input placeholder="Buscar paciente cédula o nombre" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" onClick={() => {}}>Buscar</button>
      </div>
      <div className="form-grid">
        <select required value={form.pacienteId} onChange={e => onPaciente(e.target.value)}>
          <option value="">Paciente *</option>
          {lista.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.documento}</option>)}
        </select>
        <input required type="datetime-local" value={form.fechaHora} onChange={e => setForm({ ...form, fechaHora: e.target.value })} />
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
          <option value="CITA">Cita</option>
          <option value="CONTROL">Control</option>
          <option value="TRASLADO">Traslado</option>
          <option value="SEGUIMIENTO">Seguimiento</option>
        </select>
        <input placeholder="Lugar" value={form.lugar} onChange={e => setForm({ ...form, lugar: e.target.value })} />
        <input placeholder="WhatsApp" value={form.telefonoWhatsapp} onChange={e => setForm({ ...form, telefonoWhatsapp: e.target.value })} />
      </div>
      <input placeholder="Motivo *" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
      <textarea placeholder="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
      <div className="toolbar">
        <button className="btn-primary" onClick={() => {
          if (!form.pacienteId || !form.fechaHora) return alert('Paciente y fecha son obligatorios');
          onSave(form);
        }}>Agendar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

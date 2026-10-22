import { useEffect, useState } from 'react';
import { ambulanciaService, pacienteService, solicitudService, usuarioService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

function fecha(v: any) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString(); } catch { return String(v); }
}

export default function Solicitudes() {
  const { rol, nombre } = useAuth();
  const radio = rol === 'RADIOPERADOR' || rol === 'SUPERADMIN' || rol === 'ADMINIPS';
  const aph = rol === 'AUXILIAR' || rol === 'SUPERADMIN' || rol === 'ADMINIPS';
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [ambulancias, setAmbulancias] = useState<any[]>([]);
  const [aphs, setAphs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [detalle, setDetalle] = useState<any>(null);

  const cargar = async () => {
    const [sols, pacs, ambs, users] = await Promise.all([
      solicitudService.listar(),
      pacienteService.listar().catch(() => ({ data: [] })),
      ambulanciaService.listar().catch(() => ({ data: [] })),
      usuarioService.listar().catch(() => ({ data: [] })),
    ]);
    setSolicitudes(sols.data || []);
    setPacientes(pacs.data || []);
    setAmbulancias((ambs.data || []).filter((a: any) => a.estado === 'DISPONIBLE' || a.estado === 'EN_SERVICIO'));
    setAphs((users.data || []).filter((u: any) => {
      const r = u.rol?.nombre || u.rol || '';
      return String(r).includes('AUXILIAR') || String(r).includes('APH');
    }));
  };
  useEffect(() => { cargar(); }, []);

  const asignar = async (id: number, ambulanciaId: string, asignadoA: string) => {
    if (!ambulanciaId) return alert('Elija el móvil');
    if (!asignadoA) return alert('Elija el APH');
    await solicitudService.actualizar(id, { estado: 'ASIGNADA', ambulanciaId: Number(ambulanciaId), asignadoA });
    cargar();
  };

  const accionar = async (id: number, estado: string) => {
    try {
      await solicitudService.actualizar(id, { estado });
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.message || 'No se actualizó el traslado');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Traslados</h2>
          <p className="hint">Pulse <b>Ver detalle</b> para leer lo que indicó el radiooperador (motivo, indicaciones, origen y destino).</p>
        </div>
        {radio && <button className="btn-primary" onClick={() => setShowForm(true)}>Nueva llamada</button>}
      </div>
      {showForm && radio && (
        <Form pacientes={pacientes} radioNombre={nombre || ''} onSave={async (data: any) => {
          await solicitudService.crear(data); setShowForm(false); cargar();
        }} onCancel={() => setShowForm(false)} />
      )}
      {detalle && <Detalle s={detalle} onClose={() => setDetalle(null)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Consecutivo</th><th>Paciente</th><th>Origen → Destino</th>
              <th>Prioridad</th><th>Estado</th><th>Móvil</th><th>APH</th><th></th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map(s => (
              <tr key={s.id}>
                <td>{s.consecutivo}</td>
                <td>{s.paciente?.nombre} {s.paciente?.apellido}<br /><span className="hint">{s.paciente?.documento}</span></td>
                <td>{s.origen} → {s.destino}</td>
                <td style={{ color: s.prioridad === 'URGENTE' ? 'red' : s.prioridad === 'ALTA' ? 'orange' : '#0b63c8', fontWeight: s.prioridad === 'URGENTE' ? 'bold' : 'normal' }}>{s.prioridad}</td>
                <td style={{ color: s.estado === 'PENDIENTE' ? 'red' : s.estado === 'URGENTE' ? 'orange' : 'inherit', fontWeight: s.estado === 'PENDIENTE' ? 'bold' : 'normal' }}>{s.estado}</td>
                <td>{s.ambulancia?.placa ?? '—'}</td>
                <td>{s.asignadoA || '—'}</td>
                <td>
                  <button type="button" onClick={() => setDetalle(s)} style={{ background: '#0b63c8', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>Ver detalle</button>
                  {radio && s.estado === 'PENDIENTE' && (
                    <Asignar ambs={ambulancias} aphs={aphs} onOk={(amb, aphName) => asignar(s.id, amb, aphName)} />
                  )}
                  {aph && s.estado === 'ASIGNADA' && (
                    <button className="btn-primary" onClick={() => accionar(s.id, 'EN_RUTA')}>Salgo en ruta</button>
                  )}
                  {aph && s.estado === 'EN_RUTA' && (
                    <button className="btn-primary" onClick={() => accionar(s.id, 'COMPLETADA')}>Paciente entregado</button>
                  )}
                  {radio && s.estado !== 'COMPLETADA' && s.estado !== 'CANCELADA' && (
                    <button onClick={() => accionar(s.id, 'CANCELADA')}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detalle({ s, onClose }: any) {
  const p = s.paciente || {};
  return (
    <div className="card">
      <div className="page-head">
        <h3 style={{ color: '#0b63c8', borderBottom: '2px solid #0b63c8', paddingBottom: 8 }}>Detalle de la llamada {s.consecutivo}</h3>
        <button onClick={onClose}>Cerrar</button>
      </div>
      <p className="hint">Lo registró el radiooperador. El APH debe leerlo antes de salir.</p>
      <div className="form-grid">
        <p style={{ background: s.estado === 'PENDIENTE' ? '#ffebee' : s.estado === 'COMPLETADA' ? '#e8f5e9' : '#fff3e0', padding: '8px 12px', borderRadius: 4 }}><b>Estado:</b> {s.estado}</p>
        <p><b>Prioridad:</b> {s.prioridad}</p>
        <p><b>Radio:</b> {s.radioperador || s.registradoPor || '—'}</p>
        <p><b>APH asignado:</b> {s.asignadoA || 'Sin asignar'}</p>
        <p><b>Móvil:</b> {s.ambulancia?.placa || '—'} {s.ambulancia?.tipo ? `· ${s.ambulancia.tipo}` : ''}</p>
        <p><b>Motivo:</b> {s.motivo || '—'}</p>
        <p><b>Recoger en (origen):</b> {s.origen || '—'} {s.ciudadOrigen ? `· ${s.ciudadOrigen}` : ''}</p>
        <p><b>Dejar en (destino):</b> {s.destino || '—'} {s.ciudadDestino ? `· ${s.ciudadDestino}` : ''}</p>
        <p><b>Hora solicitud:</b> {fecha(s.horaSolicitud)}</p>
        <p><b>Asignación:</b> {fecha(s.horaAsignacion)}</p>
        <p><b>Salida:</b> {fecha(s.horaSalida)}</p>
        <p><b>Entrega:</b> {fecha(s.horaLlegada)}</p>
      </div>
      <h4>Paciente</h4>
      <div className="form-grid">
        <p><b>Nombre:</b> {p.nombre} {p.apellido}</p>
        <p><b>Documento:</b> {p.tipoDocumento} {p.documento}</p>
        <p><b>Edad / sexo:</b> {p.edad || '—'} / {p.genero || '—'}</p>
        <p><b>Teléfono:</b> {p.telefono || '—'}</p>
        <p><b>Dirección:</b> {p.direccion || '—'}</p>
        <p><b>EPS:</b> {p.eps || '—'}</p>
        <p><b>Acompañante:</b> {p.contactoNombre || '—'} {p.contactoTelefono || ''}</p>
      </div>
      <h4>Indicaciones del radiooperador</h4>
      <div className="card" style={{ background: '#f4f7fb' }}>
        {s.observaciones ? s.observaciones : 'El radio no dejó indicaciones adicionales.'}
      </div>
    </div>
  );
}

function Asignar({ ambs, aphs, onOk }: any) {
  const [amb, setAmb] = useState('');
  const [aph, setAph] = useState('');
  return (
    <div>
      <select value={amb} onChange={e => setAmb(e.target.value)}>
        <option value="">Móvil...</option>
        {ambs.map((a: any) => <option key={a.id} value={a.id}>{a.placa}</option>)}
      </select>
      <select value={aph} onChange={e => setAph(e.target.value)}>
        <option value="">APH / auxiliar...</option>
        {aphs.map((u: any) => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
      </select>
      <button className="btn-primary" onClick={() => onOk(amb, aph)}>Remitir al APH</button>
    </div>
  );
}

function Form({ pacientes, radioNombre, onSave, onCancel }: any) {
  const [nuevoPac, setNuevoPac] = useState({ nombre: '', apellido: '', documento: '', telefono: '' });
  const [crearNuevo, setCrearNuevo] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '', origen: '', destino: '', ciudadOrigen: '', ciudadDestino: '',
    motivo: 'Traslado', prioridad: 'NORMAL', observaciones: '', radioperador: radioNombre,
    tipoDestino: 'IPS / centro médico',
  });
  const guardar = async () => {
    let pacienteId = form.pacienteId;
    if (crearNuevo && nuevoPac.documento) {
      const r = await pacienteService.crear(nuevoPac);
      pacienteId = r.data.id;
    }
    const extra = `Destino tipo: ${form.tipoDestino}. ${form.observaciones || ''}`.trim();
    onSave({ ...form, pacienteId, observaciones: extra });
  };
  return (
    <div className="card">
      <h3>Llamada recibida en radio</h3>
      <p className="hint">Escriba origen, destino e indicaciones. El auxiliar las verá en Ver detalle.</p>
      <div className="form-grid-2">
        <select value={form.pacienteId} onChange={e => setForm({ ...form, pacienteId: e.target.value })}>
          <option value="">Paciente existente</option>
          {pacientes.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.documento}</option>)}
        </select>
        <label><input type="checkbox" checked={crearNuevo} onChange={e => setCrearNuevo(e.target.checked)} /> Crear paciente nuevo</label>
        {crearNuevo && (
          <>
            <input placeholder="Nombre" value={nuevoPac.nombre} onChange={e => setNuevoPac({ ...nuevoPac, nombre: e.target.value })} />
            <input placeholder="Apellido" value={nuevoPac.apellido} onChange={e => setNuevoPac({ ...nuevoPac, apellido: e.target.value })} />
            <input placeholder="Documento" value={nuevoPac.documento} onChange={e => setNuevoPac({ ...nuevoPac, documento: e.target.value })} />
            <input placeholder="Teléfono" value={nuevoPac.telefono} onChange={e => setNuevoPac({ ...nuevoPac, telefono: e.target.value })} />
          </>
        )}
        <input readOnly value={form.radioperador} />
        <input placeholder="Origen / recoger en" value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })} />
        <input placeholder="Destino / dejar en" value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })} />
        <input placeholder="Ciudad origen" value={form.ciudadOrigen} onChange={e => setForm({ ...form, ciudadOrigen: e.target.value })} />
        <input placeholder="Ciudad destino" value={form.ciudadDestino} onChange={e => setForm({ ...form, ciudadDestino: e.target.value })} />
        <select value={form.tipoDestino} onChange={e => setForm({ ...form, tipoDestino: e.target.value })}>
          <option>IPS / centro médico</option>
          <option>Domicilio del paciente</option>
          <option>Otro</option>
        </select>
        <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
          <option value="NORMAL">Normal</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>
        <input placeholder="Motivo de la llamada" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
      </div>
      <textarea placeholder="Indicaciones para el APH (piso, acompañante, oxígeno, aislamiento…)" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={guardar}>Registrar llamada</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ambulanciaService, pacienteService, solicitudService, usuarioService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

function fecha(v: any) {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); } catch { return String(v); }
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'COMPLETADA': return { color: '#10B981', bg: '#e8f5e9', border: '#10B981' };
    case 'CANCELADA': return { color: '#EF4444', bg: '#ffebee', border: '#EF4444' };
    case 'EN_RUTA': return { color: '#F59E0B', bg: '#fff3e0', border: '#F59E0B' };
    case 'ASIGNADA': return { color: '#3B82F6', bg: '#eff6ff', border: '#3B82F6' };
    default: return { color: '#EF4444', bg: '#fef2f2', border: '#EF4444' };
  }
};

export default function Solicitudes() {
  const { rol, nombre } = useAuth();
  const radio = rol === 'RADIOPERADOR' || rol === 'SUPERADMIN' || rol === 'ADMINIPS';
  const aph = rol === 'AUXILIAR' || rol === 'MEDICO' || rol === 'SUPERADMIN' || rol === 'ADMINIPS';
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

    const solicitudesOrdenadas = (sols.data || []).sort((a: any, b: any) => a.id - b.id);

    setSolicitudes(solicitudesOrdenadas);
    setPacientes(pacs.data || []);
    setAmbulancias((ambs.data || []).filter((a: any) => a.estado === 'DISPONIBLE' || a.estado === 'EN_SERVICIO'));
    setAphs((users.data || []).filter((u: any) => {
      const r = u.rol?.nombre || u.rol || '';
      return String(r).includes('AUXILIAR') || String(r).includes('MEDICO') || String(r).includes('APH');
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
    <div style={{ padding: '10px' }}>
      {/* HEADER RESPONSIVE */}
      <div className="page-head" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Traslados</h2>
          <p className="hint" style={{ margin: '5px 0 0 0' }}>Pulse <b>Ver detalle</b> para leer lo que indicó el radiooperador.</p>
        </div>
        {radio && <button className="btn-primary" onClick={() => setShowForm(true)} style={{ width: '100%', maxWidth: '200px' }}>Nueva llamada</button>}
      </div>

      {showForm && radio && (
        <Form
          pacientes={pacientes}
          ambulancias={ambulancias}
          aphs={aphs}
          radioNombre={nombre || ''}
          onSave={async (data: any) => {
            await solicitudService.crear(data);
            setShowForm(false);
            cargar();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {detalle && <Detalle s={detalle} onClose={() => setDetalle(null)} />}

      {/* TABLA RESPONSIVE CON SCROLL HORIZONTAL */}
      <div className="table-wrap" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Consecutivo</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Fecha / Hora</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Paciente</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Origen → Destino</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Prioridad</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Móvil</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>APH</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map(s => {
              const est = getEstadoColor(s.estado);
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{s.consecutivo}</td>
                  <td style={{ padding: '12px' }}>{fecha(s.horaSolicitud)}</td>
                  <td style={{ padding: '12px' }}>{s.paciente?.nombre} {s.paciente?.apellido}<br /><span className="hint" style={{ fontSize: '11px' }}>{s.paciente?.documento}</span></td>
                  <td style={{ padding: '12px' }}>{s.origen} <span style={{ color: '#0b63c8' }}>→</span> {s.destino}</td>
                  <td style={{ padding: '12px', color: s.prioridad === 'URGENTE' ? '#EF4444' : s.prioridad === 'ALTA' ? '#F59E0B' : '#0b63c8', fontWeight: s.prioridad === 'URGENTE' ? 'bold' : 'normal' }}>{s.prioridad}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      backgroundColor: est.bg, color: est.color, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', border: `1px solid ${est.border}`, whiteSpace: 'nowrap'
                    }}>
                      {s.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{s.ambulancia?.placa ?? '—'}</td>
                  <td style={{ padding: '12px' }}>{s.asignadoA || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      <button type="button" onClick={() => setDetalle(s)} style={{ background: '#0b63c8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Ver detalle</button>
                      {radio && s.estado === 'PENDIENTE' && (
                        <Asignar ambs={ambulancias} aphs={aphs} onOk={(amb, aphName) => asignar(s.id, amb, aphName)} />
                      )}
                      {aph && s.estado === 'ASIGNADA' && (
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => accionar(s.id, 'EN_RUTA')}>Salgo en ruta</button>
                      )}
                      {aph && s.estado === 'EN_RUTA' && (
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => accionar(s.id, 'COMPLETADA')}>Entregado</button>
                      )}
                      {radio && s.estado !== 'COMPLETADA' && s.estado !== 'CANCELADA' && (
                        <button onClick={() => accionar(s.id, 'CANCELADA')} style={{ padding: '6px 12px', fontSize: '12px', color: '#EF4444', borderColor: '#EF4444' }}>Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: VER DETALLE (RESPONSIVE)
// ==========================================
function Detalle({ s, onClose }: any) {
  const p = s.paciente || {};
  const est = getEstadoColor(s.estado);

  // Estilos Responsive para el Detalle
  const gridResponsive = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' };
  const gridResponsiveSmall = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' };

  return (
    <div className="card" style={{ marginBottom: '20px', padding: '15px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0b63c8', paddingBottom: '10px', marginBottom: '20px', gap: '10px' }}>
        <h3 style={{ color: '#0b63c8', margin: 0, fontSize: '20px' }}>Detalle del Traslado: {s.consecutivo}</h3>
        <button onClick={onClose} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar</button>
      </div>

      <div style={{ backgroundColor: est.bg, borderLeft: `5px solid ${est.color}`, padding: '15px', borderRadius: '4px', marginBottom: '25px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
        <div>
          <span style={{ color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Estado Actual</span>
          <h4 style={{ color: est.color, margin: 0, fontSize: '18px' }}>{s.estado}</h4>
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{ color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Prioridad</span>
          <h4 style={{ color: s.prioridad === 'URGENTE' ? '#EF4444' : s.prioridad === 'ALTA' ? '#F59E0B' : '#0b63c8', margin: 0 }}>{s.prioridad}</h4>
        </div>
      </div>

      <div style={{ ...gridResponsive, marginBottom: '20px' }}>
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Información de Despacho</h4>
          <div style={gridResponsiveSmall}>
            <p style={{ margin: 0 }}><b>Radiooperador:</b><br />{s.radioperador || s.registradoPor || '—'}</p>
            <p style={{ margin: 0 }}><b>APH Asignado:</b><br />{s.asignadoA || 'Sin asignar'}</p>
            <p style={{ margin: 0 }}><b>Móvil:</b><br />{s.ambulancia?.placa || '—'} {s.ambulancia?.tipo ? `(${s.ambulancia.tipo})` : ''}</p>
            <p style={{ margin: 0 }}><b>Motivo:</b><br />{s.motivo || '—'}</p>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Registro de Tiempos</h4>
          <div style={gridResponsiveSmall}>
            <p style={{ margin: 0 }}><b>Solicitud:</b><br />{fecha(s.horaSolicitud)}</p>
            <p style={{ margin: 0 }}><b>Asignación:</b><br />{fecha(s.horaAsignacion)}</p>
            <p style={{ margin: 0 }}><b>Salida:</b><br />{fecha(s.horaSalida)}</p>
            <p style={{ margin: 0 }}><b>Entrega:</b><br />{fecha(s.horaLlegada)}</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Ruta del Traslado</h4>
        <div style={gridResponsive}>
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Origen (Recoger en)</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '15px', fontWeight: '500' }}>{s.origen || '—'}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{s.ciudadOrigen || ''}</p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Destino (Dejar en)</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '15px', fontWeight: '500' }}>{s.destino || '—'}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{s.ciudadDestino || ''}</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Datos Completos del Paciente</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '14px' }}>
          <p style={{ margin: 0 }}><b>Nombre:</b> {p.nombre} {p.apellido}</p>
          <p style={{ margin: 0 }}><b>Documento:</b> {p.tipoDocumento} {p.documento}</p>
          <p style={{ margin: 0 }}><b>Fec. Nacimiento:</b> {p.fechaNacimiento || '—'}</p>
          <p style={{ margin: 0 }}><b>Edad / Sexo:</b> {p.edad || '—'} / {p.genero || '—'}</p>
          <p style={{ margin: 0 }}><b>Teléfono:</b> {p.telefono || '—'}</p>
          <p style={{ margin: 0 }}><b>Dirección:</b> {p.direccion || '—'}</p>
          <p style={{ margin: 0 }}><b>Ciudad:</b> {p.ciudad || '—'}</p>
          <p style={{ margin: 0 }}><b>EPS:</b> {p.eps || '—'}</p>
          <p style={{ margin: 0 }}><b>RH:</b> {p.rh || '—'}</p>
          <p style={{ margin: 0 }}><b>Ocupación:</b> {p.ocupacion || '—'}</p>
          <p style={{ margin: 0 }}><b>Estado Civil:</b> {p.estadoCivil || '—'}</p>
        </div>
        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '15px', fontSize: '14px' }}>
          <b>Contacto de Emergencia:</b> {p.contactoNombre || '—'} · Tel: {p.contactoTelefono || '—'}
        </div>
      </div>

      <div>
        <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '10px' }}>Indicaciones del Radiooperador</h4>
        <div style={{ background: '#e0f2fe', borderLeft: '4px solid #0ea5e9', padding: '15px', borderRadius: '4px', color: '#0c4a6e', fontSize: '15px' }}>
          {s.observaciones ? s.observaciones : 'El radiooperador no dejó indicaciones adicionales.'}
        </div>
      </div>
    </div>
  );
}

function Asignar({ ambs, aphs, onOk }: any) {
  const [amb, setAmb] = useState('');
  const [aph, setAph] = useState('');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
      <select value={amb} onChange={e => setAmb(e.target.value)} style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
        <option value="">Móvil...</option>
        {ambs.map((a: any) => <option key={a.id} value={a.id}>{a.placa}</option>)}
      </select>
      <select value={aph} onChange={e => setAph(e.target.value)} style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
        <option value="">APH...</option>
        {aphs.map((u: any) => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
      </select>
      <button className="btn-primary" style={{ padding: '5px 8px', fontSize: '12px' }} onClick={() => onOk(amb, aph)}>OK</button>
    </div>
  );
}

// ==========================================
// COMPONENTE: FORMULARIO NUEVA LLAMADA (RESPONSIVE)
// ==========================================
function Form({ pacientes, ambulancias, aphs, radioNombre, onSave, onCancel }: any) {
  const [nuevoPac, setNuevoPac] = useState({
    tipoDocumento: 'CC', documento: '', nombre: '', apellido: '', fechaNacimiento: '', edad: '', genero: '', telefono: '', direccion: '', ciudad: '', eps: '', rh: '', ocupacion: '', estadoCivil: '', contactoNombre: '', contactoTelefono: ''
  });
  const [crearNuevo, setCrearNuevo] = useState(false);
  const [form, setForm] = useState({
    ambulanciaId: '', asignadoA: '', pacienteId: '', origen: '', destino: '', ciudadOrigen: '', ciudadDestino: '', motivo: 'Traslado', prioridad: 'NORMAL', observaciones: '', radioperador: radioNombre, tipoDestino: 'IPS / centro médico',
  });
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    try {
      setGuardando(true);
      let pacienteId = form.pacienteId;

      if (crearNuevo && nuevoPac.documento) {
        const payloadPaciente = {
          ...nuevoPac,
          edad: nuevoPac.edad ? parseInt(nuevoPac.edad, 10) : null,
          fechaNacimiento: nuevoPac.fechaNacimiento ? nuevoPac.fechaNacimiento : null
        };
        const r = await pacienteService.crear(payloadPaciente);
        pacienteId = r.data.id;
      }

      if (!pacienteId) {
        alert('Debe seleccionar un paciente o crear uno nuevo con documento.');
        setGuardando(false);
        return;
      }

      const extra = `Destino tipo: ${form.tipoDestino}. ${form.observaciones || ''}`.trim();
      onSave({ ...form, pacienteId, observaciones: extra });

    } catch (error: any) {
      alert('Error al guardar: ' + (error.response?.data?.message || error.message));
      setGuardando(false);
    }
  };

  // Estilos Responsive para Formulario
  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' as const, fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '5px', marginTop: '10px' };
  const sectionStyle = { background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' };
  const h4Style = { margin: '0 0 15px 0', color: '#0b63c8', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', fontSize: '16px' };
  // Grid mágico que se adapta a móviles (1 columna), tablets (2) y PC (3)
  const formGrid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' };
  const formGrid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' };

  return (
    <div className="card" style={{ padding: '15px', maxWidth: '1000px', margin: '0 auto', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#0b63c8', margin: 0, fontSize: '20px' }}>Registrar Nueva Llamada</h3>
        <p className="hint" style={{ marginTop: '5px' }}>Complete los datos requeridos para el despacho de la ambulancia.</p>
      </div>

      <div style={sectionStyle}>
        <h4 style={h4Style}>1. Información del Paciente</h4>

        <div style={crearNuevo ? { display: 'block' } : formGrid2}>
          <div>
            <label style={labelStyle}>Seleccionar Paciente Existente</label>
            <select
              style={inputStyle}
              value={form.pacienteId}
              onChange={e => setForm({ ...form, pacienteId: e.target.value })}
              disabled={crearNuevo}
            >
              <option value="">-- Buscar paciente --</option>
              {pacientes.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} — {p.documento}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '5px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#0b63c8', background: '#e0f2fe', padding: '10px', borderRadius: '6px', width: '100%', border: '1px solid #bae6fd' }}>
              <input
                type="checkbox"
                checked={crearNuevo}
                onChange={e => {
                  setCrearNuevo(e.target.checked);
                  if (e.target.checked) setForm({ ...form, pacienteId: '' });
                }}
                style={{ width: '18px', height: '18px' }}
              />
              Crear paciente nuevo
            </label>
          </div>
        </div>

        {crearNuevo && (
          <div style={{ ...formGrid3, marginTop: '20px', padding: '15px', background: '#fff', borderLeft: '4px solid #0b63c8', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div>
              <label style={labelStyle}>Documento *</label>
              <input style={inputStyle} placeholder="Ej. 12345678" value={nuevoPac.documento} onChange={e => setNuevoPac({ ...nuevoPac, documento: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input style={inputStyle} placeholder="Ej. Juan" value={nuevoPac.nombre} onChange={e => setNuevoPac({ ...nuevoPac, nombre: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Apellido *</label>
              <input style={inputStyle} placeholder="Ej. Pérez" value={nuevoPac.apellido} onChange={e => setNuevoPac({ ...nuevoPac, apellido: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Fecha de nacimiento</label>
              <input type="date" style={inputStyle} value={nuevoPac.fechaNacimiento} onChange={e => setNuevoPac({ ...nuevoPac, fechaNacimiento: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Edad</label>
              <input type="number" style={inputStyle} placeholder="Ej. 35" value={nuevoPac.edad} onChange={e => setNuevoPac({ ...nuevoPac, edad: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Género</label>
              <select style={inputStyle} value={nuevoPac.genero} onChange={e => setNuevoPac({ ...nuevoPac, genero: e.target.value })}>
                <option value="">Seleccione...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input style={inputStyle} placeholder="Ej. 3001234567" value={nuevoPac.telefono} onChange={e => setNuevoPac({ ...nuevoPac, telefono: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input style={inputStyle} placeholder="Ej. Calle 10 # 45-20" value={nuevoPac.direccion} onChange={e => setNuevoPac({ ...nuevoPac, direccion: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input style={inputStyle} placeholder="Ej. Medellín" value={nuevoPac.ciudad} onChange={e => setNuevoPac({ ...nuevoPac, ciudad: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>EPS</label>
              <input style={inputStyle} placeholder="Ej. Sura" value={nuevoPac.eps} onChange={e => setNuevoPac({ ...nuevoPac, eps: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>RH</label>
              <input style={inputStyle} placeholder="Ej. O+" value={nuevoPac.rh} onChange={e => setNuevoPac({ ...nuevoPac, rh: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Ocupación</label>
              <input style={inputStyle} placeholder="Ej. Empleado" value={nuevoPac.ocupacion} onChange={e => setNuevoPac({ ...nuevoPac, ocupacion: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Estado civil</label>
              <select style={inputStyle} value={nuevoPac.estadoCivil} onChange={e => setNuevoPac({ ...nuevoPac, estadoCivil: e.target.value })}>
                <option value="">Seleccione...</option>
                <option value="SOLTERO">Soltero(a)</option>
                <option value="CASADO">Casado(a)</option>
                <option value="UNION_LIBRE">Unión Libre</option>
                <option value="VIUDO">Viudo(a)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Contacto</label>
              <input style={inputStyle} placeholder="Nombre del contacto" value={nuevoPac.contactoNombre} onChange={e => setNuevoPac({ ...nuevoPac, contactoNombre: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Tel. contacto</label>
              <input style={inputStyle} placeholder="Teléfono del contacto" value={nuevoPac.contactoTelefono} onChange={e => setNuevoPac({ ...nuevoPac, contactoTelefono: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h4 style={h4Style}>2. Detalles de la Ruta</h4>
        <div style={formGrid2}>
          <div>
            <label style={labelStyle}>Origen (Recoger en)</label>
            <input style={inputStyle} placeholder="Dirección o lugar de origen" value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Ciudad Origen</label>
            <input style={inputStyle} placeholder="Ciudad de origen" value={form.ciudadOrigen} onChange={e => setForm({ ...form, ciudadOrigen: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Destino (Dejar en)</label>
            <input style={inputStyle} placeholder="Dirección o lugar de destino" value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Ciudad Destino</label>
            <input style={inputStyle} placeholder="Ciudad de destino" value={form.ciudadDestino} onChange={e => setForm({ ...form, ciudadDestino: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Tipo de Destino</label>
            <select style={inputStyle} value={form.tipoDestino} onChange={e => setForm({ ...form, tipoDestino: e.target.value })}>
              <option>IPS / centro médico</option>
              <option>Domicilio del paciente</option>
              <option>Otro</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Prioridad del Servicio</label>
            <select style={{ ...inputStyle, fontWeight: 'bold', color: form.prioridad === 'URGENTE' ? '#EF4444' : form.prioridad === 'ALTA' ? '#F59E0B' : '#0b63c8' }} value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
              <option value="NORMAL">NORMAL</option>
              <option value="ALTA">ALTA</option>
              <option value="URGENTE">URGENTE</option>
            </select>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h4 style={h4Style}>3. Asignación de Recursos (Opcional en llamada)</h4>
        <div style={formGrid2}>
          <div>
            <label style={labelStyle}>Móvil / Ambulancia</label>
            <select style={inputStyle} value={form.ambulanciaId} onChange={e => setForm({ ...form, ambulanciaId: e.target.value })}>
              <option value="">Asignar después...</option>
              {ambulancias.map((a: any) => <option key={a.id} value={a.id}>{a.placa} - {a.tipo}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>APH / Auxiliar Asignado</label>
            <select style={inputStyle} value={form.asignadoA} onChange={e => setForm({ ...form, asignadoA: e.target.value })}>
              <option value="">Asignar después...</option>
              {aphs.map((u: any) => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Motivo Principal</label>
            <input style={inputStyle} placeholder="Ej. Traslado a cita médica" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Radiooperador (Registra)</label>
            <input style={{ ...inputStyle, background: '#e2e8f0', color: '#666' }} readOnly value={form.radioperador} />
          </div>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Indicaciones para el APH (piso, acompañante, oxígeno, aislamiento…)</label>
        <textarea
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
          placeholder="Escriba aquí cualquier detalle adicional..."
          value={form.observaciones}
          onChange={e => setForm({ ...form, observaciones: e.target.value })}
        />
      </div>

      <div className="toolbar" style={{ marginTop: '25px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn-primary" onClick={guardar} disabled={guardando} style={{ padding: '12px 20px', fontSize: '15px', flex: '1 1 auto', maxWidth: '300px' }}>
          {guardando ? 'Guardando...' : 'Registrar llamada'}
        </button>
        <button onClick={onCancel} disabled={guardando} style={{ padding: '12px 20px', fontSize: '15px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto', maxWidth: '150px' }}>Cancelar</button>
      </div>
    </div>
  );
}
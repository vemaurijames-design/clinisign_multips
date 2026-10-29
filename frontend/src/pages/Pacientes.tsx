import { useEffect, useState } from 'react';
import { pacienteService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

function formatearFecha(fechaString: string) {
  if (!fechaString) return '—';
  try {
    return new Date(fechaString).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return '—'; }
}

function formatearFechaNacimiento(fechaString: string) {
  if (!fechaString) return '—';
  try {
    return new Date(fechaString).toLocaleDateString('es-CO', { timeZone: 'UTC' });
  } catch { return '—'; }
}

export default function Pacientes() {
  const { rol } = useAuth();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const [buscado, setBuscado] = useState('');
  const [detalle, setDetalle] = useState<any>(null);

  const puedeAdministrar = ['SUPERADMIN', 'ADMINIPS', 'RADIOPERADOR'].includes(rol || '');

  const cargar = () => {
    pacienteService.listar().then(r => {
      const listaOrdenada = (r.data || []).sort((a: any, b: any) => {
        const fechaA = new Date(a.fechaCreacion || 0).getTime();
        const fechaB = new Date(b.fechaCreacion || 0).getTime();
        return fechaA - fechaB;
      });
      setPacientes(listaOrdenada);
    });
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (data: any) => {
    try {
      if (!navigator.onLine) {
        const key = 'borrador_paciente_' + (data.documento || Date.now());
        localStorage.setItem(key, JSON.stringify(data));
        alert('⚠ Sin conexión\n\nLos datos se guardaron localmente.\nSe enviarán automáticamente cuando haya internet.');
        setShowForm(false); setEditing(null);
        return;
      }
      if (editing) await pacienteService.actualizar(editing.id, data);
      else await pacienteService.crear(data);
      alert('✓ Paciente guardado correctamente');
      setShowForm(false); setEditing(null); cargar();
    } catch (e: any) {
      alert('✗ Error al guardar\n\n' + (e.response?.data?.message || 'Intente nuevamente'));
    }
  };

  const exportExcel = async () => {
    const res = await pacienteService.exportExcel();
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = 'pacientes.xlsx'; a.click();
  };

  const indexOfLastItem = page * perPage;
  const indexOfFirstItem = indexOfLastItem - perPage;

  const pacientesFiltrados = pacientes.filter(p =>
    !buscado || `${p.nombre} ${p.apellido} ${p.documento} ${p.telefono}`.toLowerCase().includes(buscado.toLowerCase())
  );

  const itemsActuales = pacientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div style={{ padding: '10px' }}>
      <div className="page-head" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Pacientes</h2>
        </div>
        <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }} style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>+ Nuevo</button>
          {puedeAdministrar && (
            <>
              <button style={{ background: '#fff', border: '1px solid #ccc', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }} onClick={exportExcel}>Exportar Excel</button>
              <label style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #ccc', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                Importar Excel
                <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={async e => {
                  if (!e.target.files?.[0]) return;
                  await pacienteService.importExcel(e.target.files[0]);
                  cargar();
                }} />
              </label>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          placeholder="Buscar cédula o nombre..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setBuscado(q); setPage(1); } }}
          style={{ flex: 1, padding: '10px 15px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
        />
        <button type="button" className="btn-primary" onClick={() => { setBuscado(q); setPage(1); }} style={{ padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Buscar</button>
      </div>

      {detalle && <DetallePaciente p={detalle} onClose={() => setDetalle(null)} />}
      {showForm && <PacienteForm paciente={editing} onSave={guardar} onCancel={() => setShowForm(false)} />}

      <div className="table-wrap" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table className="data-table" style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0b63c8', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Documento</th>
              <th style={{ padding: '12px' }}>Nombre</th>
              <th style={{ padding: '12px' }}>Apellido</th>
              <th style={{ padding: '12px' }}>Edad</th>
              <th style={{ padding: '12px' }}>Teléfono</th>
              <th style={{ padding: '12px' }}>EPS</th>
              <th style={{ padding: '12px' }}>Fecha Creación</th>
              <th style={{ padding: '12px' }}>Estado</th>
              <th style={{ padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {itemsActuales.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron pacientes.</td></tr>
            ) : (
              itemsActuales.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', opacity: p.activo === false ? 0.6 : 1 }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{p.documento}</td>
                  <td style={{ padding: '12px' }}>{p.nombre}</td>
                  <td style={{ padding: '12px' }}>{p.apellido}</td>
                  <td style={{ padding: '12px' }}>{p.edad}</td>
                  <td style={{ padding: '12px' }}>{p.telefono}</td>
                  <td style={{ padding: '12px' }}>{p.eps}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#555' }}>
                    {formatearFecha(p.fechaCreacion)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: p.activo === false ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                      {p.activo === false ? 'Anulado' : 'Activo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button onClick={() => setDetalle(p)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #0b63c8', background: '#0b63c8', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Ver detalle</button>
                      {puedeAdministrar && (
                        <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Editar</button>
                      )}
                      {puedeAdministrar && p.activo !== false && (
                        <button onClick={async () => { if (confirm('¿Anular paciente? Quedará en bitácora.')) { await pacienteService.eliminar(p.id); cargar(); } }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#EF4444', cursor: 'pointer' }}>Anular</button>
                      )}
                      {puedeAdministrar && p.activo === false && (
                        <button onClick={async () => { if (confirm('¿Activar?')) { await pacienteService.activar(p.id); cargar(); } }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #86efac', background: '#f0fdf4', color: '#10B981', cursor: 'pointer' }}>Activar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8f9fa', borderTop: '1px solid #e9ecef', marginTop: '10px', borderRadius: '0 0 8px 8px', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
          {pacientesFiltrados.length} registros en total
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            {(indexOfFirstItem + 1) > pacientesFiltrados.length ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, pacientesFiltrados.length)} de {pacientesFiltrados.length}
          </span>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: page === 1 ? '#f3f4f6' : '#ffffff', color: page === 1 ? '#9ca3af' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>‹</button>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>Página {page} de {Math.ceil(pacientesFiltrados.length / perPage) || 1}</span>
          <button disabled={page * perPage >= pacientesFiltrados.length} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: page * perPage >= pacientesFiltrados.length ? '#f3f4f6' : '#ffffff', color: page * perPage >= pacientesFiltrados.length ? '#9ca3af' : '#374151', cursor: page * perPage >= pacientesFiltrados.length ? 'not-allowed' : 'pointer' }}>›</button>
        </div>
      </div>
    </div>
  );
}

function DetallePaciente({ p, onClose }: any) {
  const gridResponsive = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' };

  return (
    <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0b63c8', paddingBottom: '10px', marginBottom: '20px', gap: '10px' }}>
        <h3 style={{ color: '#0b63c8', margin: 0, fontSize: '20px' }}>Historial del Paciente: {p.nombre} {p.apellido}</h3>
        <button onClick={onClose} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar</button>
      </div>

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Datos Personales</h4>
        <div style={gridResponsive}>
          <p style={{ margin: 0 }}><b>Documento:</b> {p.tipoDocumento} {p.documento}</p>
          <p style={{ margin: 0 }}><b>Nombre completo:</b> {p.nombre} {p.apellido}</p>
          <p style={{ margin: 0 }}><b>Fecha de Nacimiento:</b> {formatearFechaNacimiento(p.fechaNacimiento)}</p>
          <p style={{ margin: 0 }}><b>Edad:</b> {p.edad || '—'}</p>
          <p style={{ margin: 0 }}><b>Género:</b> {p.genero || '—'}</p>
          <p style={{ margin: 0 }}><b>Estado Civil:</b> {p.estadoCivil || '—'}</p>
          <p style={{ margin: 0 }}><b>Ocupación:</b> {p.ocupacion || '—'}</p>
          <p style={{ margin: 0 }}><b>RH:</b> {p.rh || '—'}</p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Contacto y Ubicación</h4>
        <div style={gridResponsive}>
          <p style={{ margin: 0 }}><b>Teléfono:</b> {p.telefono || '—'}</p>
          <p style={{ margin: 0 }}><b>Dirección:</b> {p.direccion || '—'}</p>
          <p style={{ margin: 0 }}><b>Ciudad:</b> {p.ciudad || '—'}</p>
          <p style={{ margin: 0 }}><b>EPS:</b> {p.eps || '—'}</p>
          <p style={{ margin: 0, gridColumn: '1 / -1', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
            <b>Contacto de Emergencia:</b> {p.contactoNombre || '—'} (Tel: {p.contactoTelefono || '—'})
          </p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>Información Médica Relevante</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <b style={{ color: '#475569', display: 'block', marginBottom: '5px' }}>Antecedentes:</b>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{p.antecedentes || 'Ninguno registrado.'}</p>
          </div>

          <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #fecaca' }}>
            <b style={{ color: '#b91c1c', display: 'block', marginBottom: '5px' }}>Alergias:</b>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{p.alergias || 'Ninguna registrada.'}</p>
          </div>

          <div style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <b style={{ color: '#475569', display: 'block', marginBottom: '5px' }}>Medicamentos Actuales:</b>
            <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>{p.medicamentos || 'Ninguno registrado.'}</p>
          </div>

        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
        Fecha de registro en el sistema: {formatearFecha(p.fechaCreacion)}
      </div>
    </div>
  );
}

function PacienteForm({ paciente, onSave, onCancel }: any) {
  const [form, setForm] = useState({
    documento: paciente?.documento ?? '',
    nombre: paciente?.nombre ?? '',
    apellido: paciente?.apellido ?? '',
    fechaNacimiento: paciente?.fechaNacimiento ? paciente.fechaNacimiento.split('T')[0] : '',
    edad: paciente?.edad ?? '',
    genero: paciente?.genero ?? '',
    telefono: paciente?.telefono ?? '',
    direccion: paciente?.direccion ?? '',
    ciudad: paciente?.ciudad ?? '',
    eps: paciente?.eps ?? '',
    rh: paciente?.rh ?? '',
    ocupacion: paciente?.ocupacion ?? '',
    estadoCivil: paciente?.estadoCivil ?? '',
    contactoNombre: paciente?.contactoNombre ?? '',
    contactoTelefono: paciente?.contactoTelefono ?? '',
    antecedentes: paciente?.antecedentes ?? '',
    alergias: paciente?.alergias ?? '',
    medicamentos: paciente?.medicamentos ?? '',
  });

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' as const, fontSize: '14px' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#444', marginBottom: '5px' };
  const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' };

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ color: '#0b63c8', marginTop: 0, marginBottom: '20px' }}>{paciente ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>

      <div style={formGrid}>
        <div><label style={labelStyle}>Documento *</label><input style={inputStyle} value={form.documento} onChange={e => set('documento', e.target.value)} /></div>
        <div><label style={labelStyle}>Nombre *</label><input style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
        <div><label style={labelStyle}>Apellido *</label><input style={inputStyle} value={form.apellido} onChange={e => set('apellido', e.target.value)} /></div>

        <div><label style={labelStyle}>Fecha de nacimiento</label><input type="date" style={inputStyle} value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} /></div>
        <div><label style={labelStyle}>Edad</label><input type="number" style={inputStyle} value={form.edad} onChange={e => set('edad', e.target.value)} /></div>
        <div><label style={labelStyle}>Género</label><input style={inputStyle} value={form.genero} onChange={e => set('genero', e.target.value)} /></div>

        <div><label style={labelStyle}>Teléfono</label><input style={inputStyle} value={form.telefono} onChange={e => set('telefono', e.target.value)} /></div>
        <div><label style={labelStyle}>Dirección</label><input style={inputStyle} value={form.direccion} onChange={e => set('direccion', e.target.value)} /></div>
        <div><label style={labelStyle}>Ciudad</label><input style={inputStyle} value={form.ciudad} onChange={e => set('ciudad', e.target.value)} /></div>

        <div><label style={labelStyle}>EPS</label><input style={inputStyle} value={form.eps} onChange={e => set('eps', e.target.value)} /></div>
        <div><label style={labelStyle}>RH</label><input style={inputStyle} value={form.rh} onChange={e => set('rh', e.target.value)} /></div>
        <div><label style={labelStyle}>Ocupación</label><input style={inputStyle} value={form.ocupacion} onChange={e => set('ocupacion', e.target.value)} /></div>

        <div><label style={labelStyle}>Estado civil</label><input style={inputStyle} value={form.estadoCivil} onChange={e => set('estadoCivil', e.target.value)} /></div>
        <div><label style={labelStyle}>Contacto</label><input style={inputStyle} placeholder="Nombre del contacto" value={form.contactoNombre} onChange={e => set('contactoNombre', e.target.value)} /></div>
        <div><label style={labelStyle}>Tel. contacto</label><input style={inputStyle} placeholder="Teléfono del contacto" value={form.contactoTelefono} onChange={e => set('contactoTelefono', e.target.value)} /></div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label style={labelStyle}>Antecedentes</label>
        <textarea style={{ ...inputStyle, minHeight: '60px', marginBottom: '15px' }} value={form.antecedentes} onChange={e => set('antecedentes', e.target.value)} />

        <label style={labelStyle}>Alergias</label>
        <textarea style={{ ...inputStyle, minHeight: '60px', marginBottom: '15px' }} value={form.alergias} onChange={e => set('alergias', e.target.value)} />

        <label style={labelStyle}>Medicamentos</label>
        <textarea style={{ ...inputStyle, minHeight: '60px' }} value={form.medicamentos} onChange={e => set('medicamentos', e.target.value)} />
      </div>

      <div className="toolbar" style={{ marginTop: '25px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn-primary" onClick={() => onSave(form)} style={{ padding: '10px 20px', fontSize: '15px', flex: '1 1 auto', maxWidth: '200px', borderRadius: '6px', fontWeight: 'bold' }}>Guardar Paciente</button>
        <button onClick={onCancel} style={{ padding: '10px 20px', fontSize: '15px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: '1 1 auto', maxWidth: '120px' }}>Cancelar</button>
      </div>
    </div>
  );
}
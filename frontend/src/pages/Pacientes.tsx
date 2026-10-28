import { useEffect, useState } from 'react';
import { pacienteService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function Pacientes() {
  const { rol } = useAuth();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const [buscado, setBuscado] = useState('');
  const cargar = () => pacienteService.listar().then(r => setPacientes(r.data));
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

  return (
    <div>
      <div className="page-head">
        <h2>Pacientes</h2>
        <div className="toolbar">
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>Nuevo</button>
          <button onClick={exportExcel}>Exportar Excel</button>
          <label>
            Importar Excel
            <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={async e => {
              if (!e.target.files?.[0]) return;
              await pacienteService.importExcel(e.target.files[0]);
              cargar();
            }} />
          </label>
        </div>
      </div>
      <div className="toolbar">
        <input placeholder="Buscar cédula o nombre" value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') setBuscado(q); }} />
        <button type="button" className="btn-primary" onClick={() => setBuscado(q)}>Buscar</button>
      </div>
      {showForm && <PacienteForm paciente={editing} onSave={guardar} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Documento</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>Teléfono</th><th>EPS</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {pacientes.filter(p => !buscado || `${p.nombre} ${p.apellido} ${p.documento} ${p.telefono}`.toLowerCase().includes(buscado.toLowerCase())).slice((page - 1) * perPage, page * perPage).map(p => (
              <tr key={p.id}>
                <td>{p.documento}</td><td>{p.nombre}</td><td>{p.apellido}</td>
                <td>{p.edad}</td><td>{p.telefono}</td><td>{p.eps}</td><td style={{color: p.activo === false ? 'red' : 'green'}}>{p.activo === false ? 'Anulado' : 'Activo'}</td>
                <td>
                  <button onClick={() => { setEditing(p); setShowForm(true); }}>Editar</button>
                  {['SUPERADMIN','ADMINIPS','RADIOPERADOR'].includes(rol) && p.activo !== false && <button onClick={async () => { if (confirm('¿Anular paciente? Quedará en bitácora.')) { await pacienteService.eliminar(p.id); cargar(); } }}>Anular</button>}
                  {['SUPERADMIN','ADMINIPS','RADIOPERADOR'].includes(rol) && p.activo === false && <button onClick={async () => { if (confirm('¿Activar?')) { await pacienteService.activar(p.id); cargar(); } }} style={{background:'#1a9f5c',color:'#fff'}}>Activar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 12, padding: '8px 0', borderTop: '1px solid #e0e0e0' }}>
          <span style={{ color: '#666', fontSize: 13 }}>{((page - 1) * perPage) + 1} a {Math.min(page * perPage, pacientes.length)} de {pacientes.length}</span>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 12px', border: '1px solid #ccc', borderRadius: 4, background: page === 1 ? '#f5f5f5' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>‹</button>
          <span style={{ fontSize: 13 }}>Página {page} de {Math.ceil(pacientes.length / perPage) || 1}</span>
          <button disabled={page * perPage >= pacientes.length} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 12px', border: '1px solid #ccc', borderRadius: 4, background: page * perPage >= pacientes.length ? '#f5f5f5' : '#fff', cursor: page * perPage >= pacientes.length ? 'not-allowed' : 'pointer' }}>›</button>
        </div>
      </div>
    </div>
  );
}

function PacienteForm({ paciente, onSave, onCancel }: any) {
  const [form, setForm] = useState({
    documento: paciente?.documento ?? '', nombre: paciente?.nombre ?? '', apellido: paciente?.apellido ?? '',
    edad: paciente?.edad ?? '', genero: paciente?.genero ?? '', telefono: paciente?.telefono ?? '',
    direccion: paciente?.direccion ?? '', ciudad: paciente?.ciudad ?? '', eps: paciente?.eps ?? '',
    rh: paciente?.rh ?? '', contactoNombre: paciente?.contactoNombre ?? '', contactoTelefono: paciente?.contactoTelefono ?? '',
    antecedentes: paciente?.antecedentes ?? '', alergias: paciente?.alergias ?? '', medicamentos: paciente?.medicamentos ?? '',
  });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  return (
    <div className="card">
      <h3>{paciente ? 'Editar' : 'Nuevo'} paciente</h3>
      <div className="form-grid">
        <label>Documento *<input value={form.documento} onChange={e => set('documento', e.target.value)} /></label>
        <label>Nombre *<input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></label>
        <label>Apellido *<input value={form.apellido} onChange={e => set('apellido', e.target.value)} /></label>
        <label>Fecha de nacimiento<input type="date" value={form.fechaNacimiento || ''} onChange={e => set('fechaNacimiento', e.target.value)} /></label>
        <label>Edad<input type="number" value={form.edad} onChange={e => set('edad', e.target.value)} /></label>
        <label>Género<input value={form.genero} onChange={e => set('genero', e.target.value)} /></label>
        <label>Teléfono<input value={form.telefono} onChange={e => set('telefono', e.target.value)} /></label>
        <label>Dirección<input value={form.direccion} onChange={e => set('direccion', e.target.value)} /></label>
        <label>Ciudad<input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} /></label>
        <label>EPS<input value={form.eps} onChange={e => set('eps', e.target.value)} /></label>
        <label>RH<input value={form.rh} onChange={e => set('rh', e.target.value)} /></label>
        <label>Ocupación<input value={form.ocupacion || ''} onChange={e => set('ocupacion', e.target.value)} /></label>
        <label>Estado civil<input value={form.estadoCivil || ''} onChange={e => set('estadoCivil', e.target.value)} /></label>
        <input placeholder="Contacto" value={form.contactoNombre} onChange={e => set('contactoNombre', e.target.value)} />
        <input placeholder="Tel. contacto" value={form.contactoTelefono} onChange={e => set('contactoTelefono', e.target.value)} />
      </div>
      <textarea placeholder="Antecedentes" value={form.antecedentes} onChange={e => set('antecedentes', e.target.value)} />
      <textarea placeholder="Alergias" value={form.alergias} onChange={e => set('alergias', e.target.value)} />
      <textarea placeholder="Medicamentos" value={form.medicamentos} onChange={e => set('medicamentos', e.target.value)} />
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={() => onSave(form)}>Guardar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
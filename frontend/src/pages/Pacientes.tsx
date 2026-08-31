import { useEffect, useState } from 'react';
import { pacienteService } from '../services/rest';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const cargar = () => pacienteService.listar().then(r => setPacientes(r.data));
  useEffect(() => { cargar(); }, []);

  const guardar = async (data: any) => {
    if (editing) await pacienteService.actualizar(editing.id, data);
    else await pacienteService.crear(data);
    setShowForm(false); setEditing(null); cargar();
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
      {showForm && <PacienteForm paciente={editing} onSave={guardar} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Documento</th><th>Nombre</th><th>Apellido</th><th>Edad</th><th>Teléfono</th><th>EPS</th><th></th></tr></thead>
          <tbody>
            {pacientes.map(p => (
              <tr key={p.id}>
                <td>{p.documento}</td><td>{p.nombre}</td><td>{p.apellido}</td>
                <td>{p.edad}</td><td>{p.telefono}</td><td>{p.eps}</td>
                <td>
                  <button onClick={() => { setEditing(p); setShowForm(true); }}>Editar</button>
                  <button onClick={async () => { if (confirm('¿Eliminar?')) { await pacienteService.eliminar(p.id); cargar(); } }}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <input placeholder="Documento" value={form.documento} onChange={e => set('documento', e.target.value)} />
        <input placeholder="Nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
        <input placeholder="Apellido" value={form.apellido} onChange={e => set('apellido', e.target.value)} />
        <input placeholder="Edad" type="number" value={form.edad} onChange={e => set('edad', e.target.value)} />
        <input placeholder="Género" value={form.genero} onChange={e => set('genero', e.target.value)} />
        <input placeholder="Teléfono" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
        <input placeholder="Dirección" value={form.direccion} onChange={e => set('direccion', e.target.value)} />
        <input placeholder="Ciudad" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} />
        <input placeholder="EPS" value={form.eps} onChange={e => set('eps', e.target.value)} />
        <input placeholder="RH" value={form.rh} onChange={e => set('rh', e.target.value)} />
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

import { useEffect, useState } from 'react';
import { ambulanciaService } from '../services/rest';

export default function Ambulancias() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const cargar = () => ambulanciaService.listar().then(r => setItems(r.data));
  useEffect(() => { cargar(); }, []);

  return (
    <div>
      <div className="page-head">
        <h2>Ambulancias</h2>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>Nueva</button>
      </div>
      {showForm && <Form ambulancia={editing} onSave={async (data: any) => {
        if (editing) await ambulanciaService.actualizar(editing.id, data);
        else await ambulanciaService.crear(data);
        setShowForm(false); setEditing(null); cargar();
      }} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Placa</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Tipo</th><th>Estado</th><th>Km</th><th></th></tr></thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id}>
                <td>{a.placa}</td><td>{a.marca}</td><td>{a.modelo}</td><td>{a.ano}</td>
                <td>{a.tipo === 'MV' ? 'Medicalizada' : 'Transporte'}</td>
                <td>{a.estado}</td><td>{a.kilometraje}</td>
                <td>
                  <button onClick={() => { setEditing(a); setShowForm(true); }}>Editar</button>
                  <button onClick={async () => { if (confirm('¿Eliminar?')) { await ambulanciaService.eliminar(a.id); cargar(); } }}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Form({ ambulancia, onSave, onCancel }: any) {
  const [form, setForm] = useState({
    placa: ambulancia?.placa ?? '', marca: ambulancia?.marca ?? '', modelo: ambulancia?.modelo ?? '',
    ano: ambulancia?.ano ?? '', tipo: ambulancia?.tipo ?? 'MV', estado: ambulancia?.estado ?? 'DISPONIBLE',
    kilometraje: ambulancia?.kilometraje ?? 0,
  });
  return (
    <div className="card">
      <h3>{ambulancia ? 'Editar' : 'Nueva'} ambulancia</h3>
      <div className="form-grid">
        <input placeholder="Placa" value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value })} />
        <input placeholder="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} />
        <input placeholder="Modelo" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} />
        <input placeholder="Año" type="number" value={form.ano} onChange={e => setForm({ ...form, ano: e.target.value })} />
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
          <option value="MV">Medicalizada</option>
          <option value="TV">Transporte</option>
        </select>
        <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
          <option value="DISPONIBLE">Disponible</option>
          <option value="EN_SERVICIO">En servicio</option>
          <option value="MANTENIMIENTO">Mantenimiento</option>
        </select>
        <input placeholder="Kilometraje" type="number" value={form.kilometraje} onChange={e => setForm({ ...form, kilometraje: Number(e.target.value) })} />
      </div>
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={() => onSave(form)}>Guardar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

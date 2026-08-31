import { useEffect, useState } from 'react';
import { superadminService, usuarioService } from '../services/rest';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ROLES = ['ADMINIPS', 'AUXILIAR', 'RADIOPERADOR', 'TECNICO', 'CALIDAD'];

export default function Usuarios() {
  const { rol, ipsId, ipsNombre } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [error, setError] = useState('');

  const esSuper = rol === 'SUPERADMIN';
  const tenantId = ipsId && ipsId !== 'null' ? Number(ipsId) : null;

  const cargar = async () => {
    setError('');
    if (esSuper && !tenantId) return;
    try {
      const r = esSuper && tenantId
        ? await superadminService.usuarios(tenantId)
        : await usuarioService.listar();
      setUsuarios(r.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'No se pudieron cargar los usuarios');
    }
  };

  useEffect(() => { cargar(); }, [ipsId, rol]);

  if (esSuper && !tenantId) {
    return (
      <div className="card">
        <h2>Staff por IPS</h2>
        <p className="hint">Seleccione una IPS en la barra o ábrala desde Gestión de IPS.</p>
        <Link to="/ips"><button className="btn-primary">Ver IPS</button></Link>
      </div>
    );
  }

  const guardar = async (data: any) => {
    if (esSuper && tenantId) {
      if (editing) await superadminService.actualizarUsuario(tenantId, editing.id, data);
      else await superadminService.crearUsuario(tenantId, data);
    } else {
      if (editing) await usuarioService.actualizar(editing.id, data);
      else await usuarioService.crear(data);
    }
    setShowForm(false); setEditing(null); cargar();
  };

  const toggle = async (u: any) => {
    if (esSuper && tenantId) await superadminService.toggleUsuario(tenantId, u.id, !u.activo);
    else await usuarioService.toggleActivo(u.id, !u.activo);
    cargar();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Staff de {ipsNombre || 'la IPS'}</h2>
          <p className="hint">
            {esSuper
              ? 'El SUPERADMIN da de alta ADMINIPS, auxiliares, radioperadores, técnicos y calidad sobre la BD de esta IPS.'
              : 'El ADMINIPS ve y gestiona el staff de su propia IPS.'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>Nuevo usuario</button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {showForm && <UsuarioForm usuario={editing} onSave={guardar} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Documento</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>{u.nombre} {u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.documento}</td>
                <td>{u.rol?.nombre}</td>
                <td className={u.activo ? 'badge-ok' : 'badge-no'}>{u.activo ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button onClick={() => { setEditing(u); setShowForm(true); }}>Editar</button>
                  <button onClick={() => toggle(u)}>{u.activo ? 'Deshabilitar' : 'Habilitar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsuarioForm({ usuario, onSave, onCancel }: any) {
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '', apellido: usuario?.apellido ?? '', email: usuario?.email ?? '',
    documento: usuario?.documento ?? '', telefono: usuario?.telefono ?? '',
    rol: usuario?.rol?.nombre ?? 'AUXILIAR', password: '',
  });
  return (
    <div className="card">
      <h3>{usuario ? 'Editar' : 'Registrar'} usuario</h3>
      <div className="form-grid">
        <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        <input placeholder="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} />
        <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input placeholder="Contraseña" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      </div>
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={() => {
          const data: any = { ...form };
          if (!data.password) delete data.password;
          onSave(data);
        }}>Guardar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { superadminService, usuarioService } from '../services/rest';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Usuarios() {
  const { rol, ipsId, ipsNombre } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
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
        <p className="hint">Seleccione una IPS. Solo el SUPERADMIN crea, edita o deshabilita usuarios.</p>
        <Link to="/ips"><button className="btn-primary">Ver IPS</button></Link>
      </div>
    );
  }

  const guardar = async (data: any) => {
    if (!esSuper || !tenantId) return;
    if (editing) await superadminService.actualizarUsuario(tenantId, editing.id, data);
    else await superadminService.crearUsuario(tenantId, data);
    setShowForm(false); setEditing(null); cargar();
  };

  const eliminarPermanente = async (id: number) => {
    if (!confirm('¿ELIMINAR permanentemente este usuario de la base de datos?\n\nEsta acción no se puede deshacer.')) return;
    try {
      await usuarioService.eliminar(id);
      alert('✓ Usuario eliminado de la base de datos');
      cargar();
    } catch (e: any) {
      alert('✗ Error: ' + (e.response?.data?.message || 'No se pudo eliminar'));
    }
  };
  const toggle = async (u: any) => {
    if (!esSuper || !tenantId) return;
    await superadminService.toggleUsuario(tenantId, u.id, !u.activo);
    cargar();
  };

  const filtrados = usuarios.filter(u =>
    !q || `${u.nombre} ${u.apellido} ${u.email} ${u.documento}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Staff de {ipsNombre || 'la IPS'}</h2>
          <p className="hint">
            {esSuper
              ? 'Solo el SUPERADMIN puede crear, editar o deshabilitar. El ADMINIPS solo consulta.'
              : 'Consulta de staff. Altas, ediciones y deshabilitar: únicamente SUPERADMIN.'}
          </p>
        </div>
        {esSuper && (
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>Nuevo usuario</button>
        )}
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="toolbar">
        <input placeholder="Nombre, correo o cédula" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" onClick={() => cargar()}>Buscar</button>
      </div>
      {showForm && esSuper && <UsuarioForm usuario={editing} onSave={guardar} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Documento</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {filtrados.map(u => (
              <tr key={u.id}>
                <td>{u.nombre} {u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.documento}</td>
                <td>{u.rol?.nombre}</td>
                <td className={u.activo ? 'badge-ok' : 'badge-no'}>{u.activo ? 'Activo' : 'Inactivo'}</td>
                <td>
                  {esSuper ? (
                    <>
                      <button onClick={() => { setEditing(u); setShowForm(true); }}>Editar</button>
                      <button onClick={() => toggle(u)}>{u.activo ? 'Deshabilitar' : 'Habilitar'}</button>
                      {rol === 'SUPERADMIN' && <button onClick={() => eliminarPermanente(u.id)} style={{background:'#dc3545',color:'#fff',marginLeft:4}}>Eliminar</button>}
                    </>
                  ) : <span className="hint">Solo lectura</span>}
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
          {['ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD','MEDICO'].map(r => <option key={r}>{r}</option>)}
        </select>
        <input type="password" placeholder={usuario ? 'Nueva clave (opcional)' : 'Contraseña'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      </div>
      <div className="toolbar"><button className="btn-primary" onClick={() => onSave(form)}>Guardar</button><button onClick={onCancel}>Cancelar</button></div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipsService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function CreateIps() {
  const navigate = useNavigate();
  const { seleccionarIps } = useAuth();
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    nombre: '', nit: '', dv: '', direccion: '', ciudad: 'Medellín',
    telefono: '', correo: '', representante: '', ccRepresentante: '',
    suplente: '', ccSuplente: '', logoUrl: '',
    adminEmail: '', adminPassword: 'adminips123456', adminNombre: '', adminDocumento: '',
  });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const llenarSian = () => setForm({
    ...form,
    nombre: 'AMBULANCIAS SIAN SALUD S.A.S.',
    nit: '9018065095', dv: '12', direccion: 'CR 71 17 03', ciudad: 'Medellín',
    telefono: '3113172171', correo: 'SIANSALUDMEDELLIN@GMAIL.COM',
    representante: 'WILSON DANOBIS SIERRA MEJIA', ccRepresentante: '1128422718',
    suplente: 'YERALDÍN GARAY CHICA', ccSuplente: '1020441463',
    adminEmail: 'siansalud2024@hotmail.com', adminNombre: 'Wilson Sierra', adminDocumento: '1128422718',
  });

  const handleSubmit = async () => {
    if (!form.nombre || !form.nit || !form.adminEmail || !form.adminPassword) {
      setMsg('Nombre, NIT, email y contraseña del ADMINIPS son obligatorios.');
      return;
    }
    setMsg('El backend está creando la BD de la IPS y el usuario ADMINIPS...');
    try {
      const { data } = await ipsService.crear(form);
      seleccionarIps(String(data.id), data.nombre);
      setMsg('IPS creada. ADMINIPS registrado. Ya puede cargar el resto del staff.');
      setTimeout(() => navigate('/usuarios'), 900);
    } catch (err: any) {
      setMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <h2>Registrar IPS desde el front</h2>
      <p className="hint">
        Usted no crea la base a mano. El formulario ordena al backend maestro:
        guardar la IPS, crear `ips_&lt;nit&gt;` y dejar el primer ADMINIPS listo para login.
      </p>
      <button onClick={llenarSian}>Ejemplo SIAN SALUD</button>
      {msg && <div className="card">{msg}</div>}
      <div className="card">
        <h3>1. Datos de la IPS</h3>
        <div className="form-grid">
          <input placeholder="Nombre *" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          <input placeholder="NIT *" value={form.nit} onChange={e => set('nit', e.target.value)} />
          <input placeholder="DV" value={form.dv} onChange={e => set('dv', e.target.value)} />
          <input placeholder="Dirección" value={form.direccion} onChange={e => set('direccion', e.target.value)} />
          <input placeholder="Ciudad" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} />
          <input placeholder="Teléfono" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
          <input placeholder="Correo" value={form.correo} onChange={e => set('correo', e.target.value)} />
          <input placeholder="Representante" value={form.representante} onChange={e => set('representante', e.target.value)} />
          <input placeholder="CC representante" value={form.ccRepresentante} onChange={e => set('ccRepresentante', e.target.value)} />
        </div>
        <h3 style={{ marginTop: 16 }}>2. ADMINIPS inicial (lo registra el SUPERADMIN)</h3>
        <div className="form-grid-2">
          <input placeholder="Nombre admin *" value={form.adminNombre} onChange={e => set('adminNombre', e.target.value)} />
          <input placeholder="Email admin *" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} />
          <input placeholder="Documento admin" value={form.adminDocumento} onChange={e => set('adminDocumento', e.target.value)} />
          <input placeholder="Contraseña admin *" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} />
        </div>
        <div className="toolbar" style={{ marginTop: 16 }}>
          <button className="btn-primary" onClick={handleSubmit}>Registrar IPS</button>
          <button onClick={() => navigate('/ips')}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

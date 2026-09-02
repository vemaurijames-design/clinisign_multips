import { useEffect, useState } from 'react';
import { ipsService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function ConfigCorreo() {
  const { ipsId, ipsNombre, rol, seleccionarIps } = useAuth();
  const tenantId = ipsId && ipsId !== 'null' ? Number(ipsId) : null;
  const [ips, setIps] = useState<any>({});
  const [form, setForm] = useState<any>({
    smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpUsername: '', smtpPassword: '',
    correoFrom: '', whatsappEnabled: false, whatsappToken: '', whatsappPhoneNumberId: '',
  });
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const cargar = async () => {
    if (!tenantId) return;
    const [cfg, data] = await Promise.all([ipsService.config(tenantId), ipsService.obtener(tenantId)]);
    setForm({ ...form, ...cfg.data, smtpPassword: '' });
    setIps(data.data);
    setPreview(data.data.logoUrl || null);
  };

  useEffect(() => { cargar().catch(() => {}); }, [tenantId]);

  if (!tenantId) return <div className="card">Seleccione una IPS para configurar logo, datos y correo.</div>;

  const guardarDatos = async () => {
    const saved = await ipsService.actualizar(tenantId, ips);
    seleccionarIps(String(tenantId), saved.data.nombre || ipsNombre || '');
    setMsg('Datos de la IPS guardados.');
  };

  const guardarSmtp = async () => {
    await ipsService.guardarConfig(tenantId, form);
    setMsg('SMTP / WhatsApp guardados. Use clave de aplicación, no la contraseña normal.');
  };

  const subirLogo = async (file?: File) => {
    if (!file) return;
    const { data } = await ipsService.subirLogo(tenantId, file);
    setIps(data);
    setPreview(data.logoUrl);
    setMsg('Logo actualizado. Se usará en el panel y en los PDF.');
  };

  return (
    <div>
      <h2>Configuración de {ips.nombre || ipsNombre}</h2>
      <p className="hint">Logo, datos institucionales, correo y WhatsApp de esta IPS.</p>
      {msg && <div className="card">{msg}</div>}
      <div className="card">
        <h3>Logo de la IPS</h3>
        {preview && <img src={preview} alt="Logo IPS" style={{ maxHeight: 80, marginBottom: 12 }} />}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => subirLogo(e.target.files?.[0])} />
      </div>
      <div className="card">
        <h3>Datos institucionales</h3>
        <div className="form-grid">
          <input placeholder="Nombre" value={ips.nombre || ''} onChange={e => setIps({ ...ips, nombre: e.target.value })} />
          <input placeholder="Dirección" value={ips.direccion || ''} onChange={e => setIps({ ...ips, direccion: e.target.value })} />
          <input placeholder="Ciudad" value={ips.ciudad || ''} onChange={e => setIps({ ...ips, ciudad: e.target.value })} />
          <input placeholder="Teléfono" value={ips.telefono || ''} onChange={e => setIps({ ...ips, telefono: e.target.value })} />
          <input placeholder="Correo institucional" value={ips.correo || ''} onChange={e => setIps({ ...ips, correo: e.target.value })} />
          <input placeholder="Representante" value={ips.representante || ''} onChange={e => setIps({ ...ips, representante: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={guardarDatos}>Guardar datos</button>
      </div>
      <div className="card">
        <h3>SMTP</h3>
        <div className="form-grid">
          <input placeholder="Host smtp.gmail.com" value={form.smtpHost || ''} onChange={e => setForm({ ...form, smtpHost: e.target.value })} />
          <input placeholder="Puerto 587" value={form.smtpPort || ''} onChange={e => setForm({ ...form, smtpPort: Number(e.target.value) })} />
          <input placeholder="Usuario Gmail" value={form.smtpUsername || ''} onChange={e => setForm({ ...form, smtpUsername: e.target.value })} />
          <input type="password" placeholder="Clave de aplicación" value={form.smtpPassword || ''} onChange={e => setForm({ ...form, smtpPassword: e.target.value })} />
          <input placeholder="From" value={form.correoFrom || ''} onChange={e => setForm({ ...form, correoFrom: e.target.value })} />
        </div>
        <button className="btn-primary" onClick={guardarSmtp}>Guardar correo / WhatsApp</button>
      </div>
    </div>
  );
}
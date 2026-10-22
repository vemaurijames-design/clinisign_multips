import { useEffect, useState } from 'react';
import { ipsService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function ConfigCorreo() {
  const { ipsId, ipsNombre, rol, seleccionarIps } = useAuth();
  const tenantId = ipsId && ipsId !== 'null' ? Number(ipsId) : null;
  const [ips, setIps] = useState<any>({});
  const [form, setForm] = useState<any>({
    smtpHost: 'smtp-mail.outlook.com', smtpPort: 587, smtpUsername: 'notificacionesclinisign@hotmail.com', smtpPassword: '',
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
      <p className="hint">Logo, datos institucionales, correo y WhatsApp de esta IPS. Quedan en la BD maestra y se aplican a PDF y panel.</p>
      {msg && <div className="card">{msg}</div>}

      <div className="card">
        <h3>Logo de la IPS</h3>
        {preview && <img src={preview} alt="Logo IPS" style={{ maxHeight: 80, marginBottom: 12, background: '#061433', borderRadius: 8 }} />}
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
        <p className="hint">NIT {ips.nit}{ips.dv ? `-${ips.dv}` : ''} · BD {ips.bdNombre} (no se cambia desde aquí)</p>
        <button className="btn-primary" onClick={guardarDatos}>Guardar datos</button>
      </div>

      <div className="card">
        <h3>SMTP (correo de la IPS)</h3>
        <ol className="hint">
          <li>Gmail: host <b>smtp.gmail.com</b> · Puerto <b>587</b>.</li>
          <li>Hotmail: host <b>smtp-mail.outlook.com</b> · Puerto <b>587</b>.</li>
          <li>Usuario y From deben ser el mismo correo.</li>
          <li>Use la clave de aplicación (no la contraseña normal). Sin espacios ni guiones.</li>
          <li>Guarde y pulse <b>Probar SMTP</b>.</li>
        </ol>
        <div className="form-grid">
          <input placeholder="Host smtp.gmail.com" value={form.smtpHost || ''} onChange={e => setForm({ ...form, smtpHost: e.target.value })} />
          <input placeholder="Puerto 587" value={form.smtpPort || ''} onChange={e => setForm({ ...form, smtpPort: Number(e.target.value) })} />
          <input placeholder="Usuario Gmail" value={form.smtpUsername || ''} onChange={e => setForm({ ...form, smtpUsername: e.target.value })} />
          <input type="password" placeholder="Clave de aplicación" value={form.smtpPassword || ''} onChange={e => setForm({ ...form, smtpPassword: e.target.value })} />
          <input placeholder="From" value={form.correoFrom || ''} onChange={e => setForm({ ...form, correoFrom: e.target.value })} />
        </div>
        <h3 style={{ marginTop: 16 }}>WhatsApp Cloud API (opcional)</h3>
        <div className="form-grid">
          <input placeholder="Phone number ID" value={form.whatsappPhoneNumberId || ''} onChange={e => setForm({ ...form, whatsappPhoneNumberId: e.target.value })} />
          <input placeholder="Token Meta" value={form.whatsappToken || ''} onChange={e => setForm({ ...form, whatsappToken: e.target.value })} />
        </div>
        <label className="hint"><input type="checkbox" checked={!!form.whatsappEnabled} onChange={e => setForm({ ...form, whatsappEnabled: e.target.checked })} /> Activar envío automático</label>
        <div className="toolbar" style={{ marginTop: 16 }}>
          <button className="btn-primary" onClick={guardarSmtp}>Guardar correo / WhatsApp</button>
        <button type="button" onClick={async () => {
          try {
            const dest = form.correoFrom || form.smtpUsername;
            await ipsService.probarCorreo(dest);
            setMsg('Prueba enviada a ' + dest);
          } catch (e: any) {
            setMsg(e.response?.data?.message || 'SMTP Authentication failed. Usuario y clave de aplicación deben ser del MISMO correo.');
          }
        }}>Probar SMTP</button>
        </div>
      </div>
    </div>
  );
}

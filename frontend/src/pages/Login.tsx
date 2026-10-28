import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { ipsService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modo, setModo] = useState<'superadmin' | 'ips'>('ips');
  const [ipsList, setIpsList] = useState<any[]>([]);
  const [ipsId, setIpsId] = useState('');
  const [nitInput, setNitInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ipsService.listar().then(r => setIpsList(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (modo === 'ips' && !nitInput) {
      setError('Ingrese el NIT de su IPS.');
      return;
    }
    setLoading(true);
    try {
      const ipsFound = ipsList.find((i: any) => i.nit?.replace(/[^0-9]/g, '') === nitInput.replace(/[^0-9]/g, ''));
      if (modo === 'ips' && !ipsFound) { setError('Credenciales inválidas'); setLoading(false); return; }
      const resp = await authService.login({
        email,
        password,
        ipsId: modo === 'superadmin' ? null : (ipsFound?.id ?? null),
      });
      if (resp.rol !== 'SUPERADMIN' && !resp.ipsId) {
        setError('Este usuario no está registrado en una IPS por el SUPERADMIN.');
        return;
      }
      setAuth({
        token: resp.token, rol: resp.rol, email: resp.email, nombre: resp.nombre,
        ipsId: resp.ipsId?.toString() ?? 'null', ipsNombre: resp.ipsNombre ?? null,
      });
    } catch (err: any) {
      const raw = err.response?.data?.message || '';
      if (modo === 'ips') {
        setError('Credenciales inválidas. Verifique el correo, la contraseña y el NIT. Si la cuenta está inactiva, contacte al administrador de CliniSign.');
      } else {
        setError(raw || 'Credenciales de SUPERADMIN no válidas.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-shell">
        <aside className="login-brand">
          <img src="/logo-clinisign.png" alt="CliniSign" className="login-logo" />
          <p className="login-brand-tag">Historia clínica · Consentimiento · Traslado</p>
          {modo === 'ips' && ipsId && ipsList.find((i: any) => String(i.id) === String(ipsId))?.logoUrl && (
            <img
              src={String(ipsList.find((i: any) => String(i.id) === String(ipsId)).logoUrl).startsWith('http')
                ? ipsList.find((i: any) => String(i.id) === String(ipsId)).logoUrl
                : `http://localhost:8080${ipsList.find((i: any) => String(i.id) === String(ipsId)).logoUrl}`}
              alt="Logo IPS"
              style={{ marginTop: 18, maxHeight: 64, maxWidth: 180, background: '#fff', padding: 8, borderRadius: 12 }}
            />
          )}
          <p className="login-brand-tag" style={{ textTransform: 'none', letterSpacing: 0 }}>
            {modo === 'ips' && ipsId
              ? ipsList.find((i: any) => String(i.id) === String(ipsId))?.nombre
              : 'Seleccione su IPS o entre como SUPERADMIN'}
          </p>
        </aside>
        <div className="login-card">
          <h1>Bienvenido a CliniSign</h1>
          <p className="login-welcome">
            Inicia sesión para continuar brindando atención médica de excelencia.
          </p>
          <p className="login-sub">
            Acceso exclusivo para personal registrado por el SUPERADMIN.
          </p>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleSubmit} className="stack">
            <label className="login-label">Tipo de acceso</label>
            <select value={modo} onChange={e => setModo(e.target.value as 'superadmin' | 'ips')}>
              <option value="ips">Usuario de una IPS</option>
              <option value="superadmin">SUPERADMIN</option>
            </select>
            {modo === 'ips' && (
              <>
                <label className="login-label">NIT de su IPS (sin dígito de verificación)</label>
                <input placeholder="Ej: 901806509" value={nitInput} onChange={e => setNitInput(e.target.value)} required />
              </>
            )}
            <label className="login-label">Correo</label>
            <input type="email" placeholder="correo@institucion.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <label className="login-label">Contraseña</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Validando…' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="login-foot">CliniSign © {new Date().getFullYear()} · JM Ingeniero · Medellín, Colombia</p>
        </div>
      </div>
    </div>
  );
}
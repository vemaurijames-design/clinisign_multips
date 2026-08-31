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
  const [error, setError] = useState('');

  useEffect(() => {
    ipsService.listar().then(r => setIpsList(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const resp = await authService.login({
        email,
        password,
        ipsId: modo === 'superadmin' ? null : (ipsId ? Number(ipsId) : null),
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
      setError(err.response?.data?.message || 'Solo ingresan usuarios creados por el SUPERADMIN.');
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>CliniSign</h1>
        <p className="hint" style={{ textAlign: 'center' }}>
          Acceso solo para usuarios registrados por el SUPERADMIN.<br />
          No hay auto-registro.
        </p>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit} className="stack">
          <select value={modo} onChange={e => setModo(e.target.value as 'superadmin' | 'ips')}>
            <option value="ips">Usuario de una IPS</option>
            <option value="superadmin">SUPERADMIN</option>
          </select>
          {modo === 'ips' && (
            <select value={ipsId} onChange={e => setIpsId(e.target.value)} required>
              <option value="">Seleccione su IPS</option>
              {ipsList.map((ips: any) => (
                <option key={ips.id} value={ips.id}>{ips.nombre} (NIT {ips.nit})</option>
              ))}
            </select>
          )}
          <input type="email" placeholder="Email registrado" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="btn-primary" type="submit">Iniciar sesión</button>
        </form>
      </div>
    </div>
  );
}

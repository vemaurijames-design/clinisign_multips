import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ipsService } from '../services/rest';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { nombre, rol, ipsId, ipsNombre, seleccionarIps, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [ipsList, setIpsList] = useState<any[]>([]);

  useEffect(() => {
    if (rol === 'SUPERADMIN') {
      ipsService.listarAdmin().then(r => setIpsList(r.data)).catch(() => {
        ipsService.listar().then(r => setIpsList(r.data)).catch(() => {});
      });
    }
  }, [rol]);

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <div className="content">
        <nav className="navbar">
          <div className="navbar-left">
            <button className="menu-btn btn-ghost" onClick={() => setOpen(v => !v)}>☰</button>
            <strong>CliniSign</strong>
            {rol === 'SUPERADMIN' ? (
              <select
                value={ipsId && ipsId !== 'null' ? ipsId : ''}
                onChange={e => {
                  const found = ipsList.find((i: any) => String(i.id) === e.target.value);
                  if (found) seleccionarIps(String(found.id), found.nombre);
                }}
                style={{ maxWidth: 260 }}
              >
                <option value="">Seleccionar IPS de trabajo</option>
                {ipsList.map((ips: any) => (
                  <option key={ips.id} value={ips.id}>{ips.nombre}</option>
                ))}
              </select>
            ) : (
              ipsNombre && <span>{ipsNombre}</span>
            )}
          </div>
          <div className="navbar-right">
            <span>{nombre} ({rol})</span>
            <button className="btn-ghost" onClick={() => { logout(); window.location.reload(); }}>Salir</button>
          </div>
        </nav>
        <main className="main">{children}</main>
        <footer className="footer">CliniSign — El SUPERADMIN crea IPS y usuarios. Cada IPS llena sus módulos.</footer>
      </div>
    </div>
  );
}

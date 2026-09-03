import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ipsService, notificacionService } from '../services/rest';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { nombre, rol, ipsId, ipsNombre, seleccionarIps, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [ipsList, setIpsList] = useState<any[]>([]);
  const [notis, setNotis] = useState<any[]>([]);
  const [showNotis, setShowNotis] = useState(false);

  useEffect(() => {
    if (rol === 'SUPERADMIN') {
      ipsService.listarAdmin().then(r => setIpsList(r.data)).catch(() => {
        ipsService.listar().then(r => setIpsList(r.data)).catch(() => {});
      });
    } else if (ipsId && ipsId !== 'null') {
      ipsService.obtener(Number(ipsId)).then(r => setIpsList([r.data])).catch(() => {});
    }
  }, [rol]);

  useEffect(() => {
    const load = () => {
      if (!ipsId || ipsId === 'null') return;
      notificacionService.listar().then(r => setNotis(r.data || [])).catch(() => {});
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [ipsId]);

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <div className="content">
        <nav className="navbar">
          <div className="navbar-left">
            <button className="menu-btn btn-ghost" onClick={() => setOpen(v => !v)}>☰</button>
            <strong>CliniSign</strong>
            {ipsList.find((i: any) => String(i.id) === String(ipsId))?.logoUrl && (
              <img src={ipsList.find((i: any) => String(i.id) === String(ipsId)).logoUrl} alt="" style={{ height: 28, borderRadius: 6, background: '#fff' }} />
            )}
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
            <a href="/notificaciones" style={{color:'inherit',textDecoration:'none'}}>
              <button className="btn-ghost" type="button">Avisos {notis.filter((n: any) => !n.leida).length || ''}</button>
            </a>
            <span>{nombre} ({rol})</span>
            <button className="btn-ghost" onClick={() => { logout(); window.location.reload(); }}>Salir</button>
          </div>
        </nav>
        {showNotis && (
          <div className="card" style={{ margin: '8px 16px' }}>
            <strong>Notificaciones</strong>
            {(notis || []).length === 0 && <p className="hint">Sin avisos en esta IPS.</p>}
            {(notis || []).slice(0, 8).map((n: any) => (
              <p key={n.id} className="hint">{n.titulo}: {n.mensaje}</p>
            ))}
          </div>
        )}
        <main className="main">{children}</main>
        <footer className="footer">
          CliniSign © {new Date().getFullYear()} — Diseño y desarrollo: JM Ingeniero, Medellín, Colombia. Todos los derechos reservados.
          Historia clínica y consentimientos según Ley 23 de 1981, Res. 1995 de 1999 y Res. 3100 de 2019.
        </footer>
      </div>
    </div>
  );
}

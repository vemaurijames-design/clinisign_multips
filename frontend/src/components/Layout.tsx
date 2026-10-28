import { useEffect, useState } from 'react';
import { historiaClinicaService, consentimientoService } from '../services/rest';
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
    const retryPending = async () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('hc_pending_') || k.startsWith('consent_pending_'));
      if (keys.length === 0) return;
      for (const key of keys) {
        try {
          const draft = JSON.parse(localStorage.getItem(key) || '{}');
          if (key.startsWith('hc_pending_') && draft.form && draft.pacId) {
            await historiaClinicaService.crear({ ...draft.form, pacienteId: draft.pacId });
            localStorage.removeItem(key);
            alert('Historia clínica pendiente enviada a CliniSign. Revise el módulo de historias.');
          }
          if (key.startsWith('consent_pending_') && draft.pac) {
            await consentimientoService.crear(draft);
            localStorage.removeItem(key);
            alert('Consentimiento pendiente enviado a CliniSign. Revise el módulo de consentimientos.');
          }
        } catch (e) {
          console.warn('No se pudo enviar pendiente:', key);
        }
      }
    };
    window.addEventListener('online', retryPending);
    retryPending();
    return () => window.removeEventListener('online', retryPending);
  }, []);

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
          <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="menu-btn btn-ghost" onClick={() => setOpen(v => !v)}>☰</button>

            {/* ICONO Y TEXTO EN LA BARRA SUPERIOR */}
            <img src="/logo-clinisign.png" alt="Icon" style={{ height: '28px', width: '28px', objectFit: 'cover', borderRadius: '5px' }} />
            <strong style={{ fontSize: '18px' }}>CliniSign</strong>

            {ipsList.find((i: any) => String(i.id) === String(ipsId))?.logoUrl && (
              <img src={ipsList.find((i: any) => String(i.id) === String(ipsId)).logoUrl} alt="" style={{ height: 28, borderRadius: 6, background: '#fff', marginLeft: '10px' }} />
            )}

            {rol === 'SUPERADMIN' ? (
              <select
                value={ipsId && ipsId !== 'null' ? ipsId : ''}
                onChange={e => {
                  const found = ipsList.find((i: any) => String(i.id) === e.target.value);
                  if (found) seleccionarIps(String(found.id), found.nombre);
                }}
                style={{ maxWidth: 260, marginLeft: '10px' }}
              >
                <option value="">Seleccionar IPS de trabajo</option>
                {ipsList.map((ips: any) => (
                  <option key={ips.id} value={ips.id}>{ips.nombre}</option>
                ))}
              </select>
            ) : (
              ipsNombre && <span style={{ marginLeft: '10px' }}>{ipsNombre}</span>
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
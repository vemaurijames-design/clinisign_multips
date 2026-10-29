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

  const cargarAvisos = () => {
    if (!ipsId || ipsId === 'null') return;
    notificacionService.listar().then(r => setNotis(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    cargarAvisos();
    const interval = setInterval(cargarAvisos, 15000); // Actualiza cada 15s
    return () => clearInterval(interval);
  }, [ipsId]);

  useEffect(() => {
    if (rol === 'SUPERADMIN') {
      ipsService.listarAdmin().then(r => setIpsList(r.data)).catch(() => {
        ipsService.listar().then(r => setIpsList(r.data)).catch(() => {});
      });
    } else if (ipsId && ipsId !== 'null') {
      ipsService.obtener(Number(ipsId)).then(r => setIpsList([r.data])).catch(() => {});
    }
  }, [rol, ipsId]);

  // Filtro estricto para el contador
  const avisosPendientes = notis.filter(n => {
    if (n.leida) return false;
    const texto = `${n.titulo || ''} ${n.mensaje || ''}`.toLowerCase();
    if (texto.includes('cerrado') || texto.includes('completad') || texto.includes('cancelad')) return false;
    return texto.includes('traslado') || texto.includes('llamada') || texto.includes('asignado');
  });

  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <div className="content">
        <nav className="navbar">
          <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="menu-btn btn-ghost" onClick={() => setOpen(v => !v)}>☰</button>
            <img src="/logo-clinisign.png" alt="CliniSign" style={{ height: '30px', objectFit: 'contain' }} />
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
                style={{ maxWidth: 260, marginLeft: '10px', padding: '5px', borderRadius: '4px', border: 'none' }}
              >
                <option value="">Seleccionar IPS de trabajo</option>
                {ipsList.map((ips: any) => (
                  <option key={ips.id} value={ips.id}>{ips.nombre}</option>
                ))}
              </select>
            ) : (
              ipsNombre && <span style={{ marginLeft: '10px', fontWeight: '500' }}>{ipsNombre}</span>
            )}
          </div>

          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <a href="/notificaciones" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" type="button" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                Avisos {avisosPendientes.length > 0 ? avisosPendientes.length : ''}
              </button>
            </a>
            <span style={{ fontSize: '14px' }}>{nombre} ({rol})</span>
            <button className="btn-ghost" onClick={() => { logout(); window.location.reload(); }} style={{ background: '#fff', color: '#333', padding: '6px 16px', borderRadius: '6px', fontWeight: 'bold' }}>Salir</button>
          </div>
        </nav>

        <main className="main">{children}</main>

        <footer className="footer">
          CliniSign © {new Date().getFullYear()} — Diseño y desarrollo: JM Ingeniero.
        </footer>
      </div>
    </div>
  );
}
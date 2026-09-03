import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { path: '/', label: 'Dashboard', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD'] },
  { path: '/notificaciones', label: 'Notificaciones', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD'] },
  { path: '/ips', label: 'IPS (maestro)', roles: ['SUPERADMIN'] },
  { path: '/ips/create', label: 'Registrar IPS', roles: ['SUPERADMIN'] },
  { path: '/usuarios', label: 'Staff / Usuarios', roles: ['SUPERADMIN','ADMINIPS'] },
  { path: '/agenda', label: 'Agenda / Citas', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR'] },
  { path: '/pacientes', label: 'Pacientes', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR'] },
  { path: '/ambulancias', label: 'Ambulancias', roles: ['SUPERADMIN','ADMINIPS','TECNICO','RADIOPERADOR'] },
  { path: '/solicitudes', label: 'Solicitudes / Traslados', roles: ['SUPERADMIN','ADMINIPS','RADIOPERADOR','AUXILIAR'] },
  { path: '/historias-clinicas', label: 'Historias clínicas', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR'] },
  { path: '/consentimientos', label: 'Consentimientos', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR'] },
  { path: '/plantillas', label: 'Plantillas de la IPS', roles: ['SUPERADMIN'] },
  { path: '/reportes', label: 'Reportes', roles: ['SUPERADMIN','ADMINIPS','CALIDAD'] },
  { path: '/config', label: 'Configuración IPS', roles: ['SUPERADMIN','ADMINIPS'] },
  { path: '/auditoria', label: 'Bitácora', roles: ['SUPERADMIN','ADMINIPS','CALIDAD'] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { rol } = useAuth();
  const location = useLocation();
  const items = MENU.filter(m => rol && m.roles.includes(rol));

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/logo-clinisign.png" alt="CliniSign" />
        <h1>CliniSign</h1>
      </div>
      <nav>
        {items.map(item => (
          <Link key={item.path} to={item.path} className={location.pathname === item.path ? 'active' : ''} onClick={onClose}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { path: '/', label: 'Dashboard', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD'] },
  { path: '/ips', label: 'IPS (maestro)', roles: ['SUPERADMIN'] },
  { path: '/ips/create', label: 'Registrar IPS', roles: ['SUPERADMIN'] },
  { path: '/usuarios', label: 'Staff / Usuarios', roles: ['SUPERADMIN','ADMINIPS'] },
  { path: '/agenda', label: 'Agenda / Citas', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR'] },
  { path: '/pacientes', label: 'Pacientes', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR'] },
  { path: '/ambulancias', label: 'Ambulancias', roles: ['SUPERADMIN','ADMINIPS','TECNICO'] },
  { path: '/solicitudes', label: 'Solicitudes', roles: ['SUPERADMIN','ADMINIPS','RADIOPERADOR'] },
  { path: '/historias-clinicas', label: 'Historias clínicas', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR'] },
  { path: '/consentimientos', label: 'Consentimientos', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR'] },
  { path: '/reportes', label: 'Reportes', roles: ['SUPERADMIN','ADMINIPS','CALIDAD'] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { rol } = useAuth();
  const location = useLocation();
  const items = MENU.filter(m => rol && m.roles.includes(rol));

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <h1>CliniSign</h1>
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

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { path: '/', label: 'Dashboard', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD','MEDICO'] },
  { path: '/notificaciones', label: 'Notificaciones', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD','MEDICO'] },
  { path: '/ips', label: 'IPS (maestro)', roles: ['SUPERADMIN'] },
  { path: '/ips/create', label: 'Registrar IPS', roles: ['SUPERADMIN'] },
  { path: '/usuarios', label: 'Staff / Usuarios', roles: ['SUPERADMIN','ADMINIPS','RADIOPERADOR'] },
  { path: '/agenda', label: 'Agenda / Citas', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','MEDICO'] },
  { path: '/pacientes', label: 'Pacientes', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','MEDICO'] },
  { path: '/ambulancias', label: 'Ambulancias', roles: ['SUPERADMIN','ADMINIPS','TECNICO','RADIOPERADOR'] },
  { path: '/solicitudes', label: 'Solicitudes / Traslados', roles: ['SUPERADMIN','ADMINIPS','RADIOPERADOR','AUXILIAR','MEDICO'] },
  { path: '/historias-clinicas', label: 'Historias clínicas', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','MEDICO','RADIOPERADOR','CALIDAD'] },
  { path: '/consentimientos', label: 'Consentimientos', roles: ['SUPERADMIN','ADMINIPS','AUXILIAR','MEDICO','RADIOPERADOR','CALIDAD'] },
  { path: '/plantillas', label: 'Plantillas de la IPS', roles: ['SUPERADMIN'] },
  { path: '/reportes', label: 'Reportes', roles: ['SUPERADMIN','ADMINIPS','CALIDAD','RADIOPERADOR'] },
  { path: '/config', label: 'Configuración IPS', roles: ['SUPERADMIN','ADMINIPS','RADIOPERADOR'] },
  { path: '/auditoria', label: 'Bitácora', roles: ['SUPERADMIN','ADMINIPS','CALIDAD','MEDICO','RADIOPERADOR'] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { rol } = useAuth();
  const location = useLocation();
  const items = MENU.filter(m => rol && m.roles.includes(rol));

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>

      {/* LOGO Y TEXTO ALINEADOS */}
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', gap: '10px' }}>
        <img src="/logo-clinisign.png" alt="CliniSign Icon" style={{ height: '30px', width: '30px', objectFit: 'cover', borderRadius: '5px' }} />
        <h1 style={{ margin: 0, fontSize: '20px' }}>CliniSign</h1>
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
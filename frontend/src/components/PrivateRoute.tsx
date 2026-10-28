
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { rol } = useAuth();
  const rolNorm = (rol || '').toUpperCase().trim();
  const permitidos = (roles && roles.length
    ? roles
    : ['SUPERADMIN','ADMINIPS','AUXILIAR','RADIOPERADOR','TECNICO','CALIDAD','MEDICO']
  ).map(r => r.toUpperCase());
  if (!rolNorm) return <div className="card">No autenticado</div>;
  if (!permitidos.includes(rolNorm)) {
    window.location.href = '/';
    return null;
  }
  return <>{children}</>;
}
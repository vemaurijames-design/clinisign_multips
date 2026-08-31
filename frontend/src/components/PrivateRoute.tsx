import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { rol } = useAuth();
  if (!rol) return <div className="card">No autenticado</div>;
  if (!roles.includes(rol)) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <h2>Acceso denegado</h2>
        <p className="hint">No tiene permisos para esta sección. Rol actual: {rol}</p>
      </div>
    );
  }
  return <>{children}</>;
}

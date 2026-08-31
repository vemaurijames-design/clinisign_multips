import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function RequireIps({ children }: { children: React.ReactNode }) {
  const { rol, ipsId } = useAuth();
  if (rol === 'SUPERADMIN' && (!ipsId || ipsId === 'null')) {
    return (
      <div className="card">
        <h2>Seleccione una IPS</h2>
        <p className="hint">
          El SUPERADMIN trabaja sobre la base de una IPS. Elija la IPS en la barra superior
          o regístrela primero.
        </p>
        <Link to="/ips"><button className="btn-primary">Ir a gestión de IPS</button></Link>
      </div>
    );
  }
  return <>{children}</>;
}

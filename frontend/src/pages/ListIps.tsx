import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ipsService, superadminService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function ListIps() {
  const [ipsList, setIpsList] = useState<any[]>([]);
  const [resumen, setResumen] = useState<Record<number, any>>({});
  const { seleccionarIps } = useAuth();
  const navigate = useNavigate();

  const cargar = async () => {
    const r = await ipsService.listarAdmin();
    setIpsList(r.data);
    const map: Record<number, any> = {};
    for (const ips of r.data) {
      try {
        const res = await superadminService.resumen(ips.id);
        map[ips.id] = res.data;
      } catch {
        map[ips.id] = null;
      }
    }
    setResumen(map);
  };

  useEffect(() => { cargar().catch(() => {}); }, []);

  const entrar = (ips: any) => {
    seleccionarIps(String(ips.id), ips.nombre);
    navigate('/');
  };

  const staff = (ips: any) => {
    seleccionarIps(String(ips.id), ips.nombre);
    navigate('/usuarios');
  };

  const toggle = async (ips: any) => {
    await ipsService.actualizar(ips.id, { ...ips, activo: !ips.activo });
    cargar();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>IPS — panel maestro</h2>
          <p className="hint">El SUPERADMIN registra cada IPS desde el front. El backend crea la BD y el ADMINIPS inicial.</p>
        </div>
        <Link to="/ips/create"><button className="btn-primary">Registrar IPS</button></Link>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th><th>NIT</th><th>BD</th><th>Usuarios</th><th>Pacientes</th>
              <th>Ambulancias</th><th>Solicitudes</th><th>HC</th><th>Citas</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {ipsList.map(ips => {
              const r = resumen[ips.id];
              return (
                <tr key={ips.id}>
                  <td>{ips.nombre}</td>
                  <td>{ips.nit}{ips.dv ? `-${ips.dv}` : ''}</td>
                  <td>{ips.bdNombre}</td>
                  <td>{r?.usuarios ?? '—'}</td>
                  <td>{r?.pacientes ?? '—'}</td>
                  <td>{r?.ambulancias ?? '—'}</td>
                  <td>{r?.solicitudes ?? '—'}</td>
                  <td>{r?.historiasClinicas ?? '—'}</td>
                  <td>{r?.citas ?? '—'}</td>
                  <td className={ips.activo ? 'badge-ok' : 'badge-no'}>{ips.activo ? 'Activa' : 'Inactiva'}</td>
                  <td>
                    <button onClick={() => entrar(ips)}>Entrar</button>
                    <button onClick={() => staff(ips)}>Staff</button>
                    <button onClick={() => toggle(ips)}>{ips.activo ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

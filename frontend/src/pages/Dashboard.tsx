import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { citaService, reporteService, superadminService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { rol, ipsId, ipsNombre } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [agenda, setAgenda] = useState<any>({ agendaHoy: [], agendaProximas: [] });
  const tenantId = ipsId && ipsId !== 'null' ? Number(ipsId) : null;

  useEffect(() => {
    if (rol === 'SUPERADMIN' && tenantId) {
      superadminService.resumen(tenantId).then(res => setStats(res.data)).catch(() => setStats({}));
    } else if (rol !== 'SUPERADMIN') {
      reporteService.estadisticas().then(res => setStats(res.data)).catch(() => {});
    }
    if (tenantId || rol !== 'SUPERADMIN') {
      citaService.resumen().then(res => setAgenda(res.data)).catch(() => {});
    }
  }, [rol, ipsId]);

  if (rol === 'SUPERADMIN' && !tenantId) {
    return (
      <div className="card">
        <h2>Panel SUPERADMIN</h2>
        <p className="hint">Seleccione o registre una IPS para ver módulos, staff, agenda y tablas de esa BD.</p>
        <div className="toolbar">
          <Link to="/ips"><button className="btn-primary">Gestionar IPS</button></Link>
          <Link to="/ips/create"><button>Registrar IPS</button></Link>
        </div>
      </div>
    );
  }

  const cards = rol === 'SUPERADMIN'
    ? [
        ['usuarios', 'Usuarios / staff'],
        ['pacientes', 'Pacientes'],
        ['citas', 'Citas'],
        ['ambulancias', 'Ambulancias'],
        ['solicitudes', 'Solicitudes'],
        ['historiasClinicas', 'Historias clínicas'],
      ]
    : [
        ['totalPacientes', 'Pacientes'],
        ['totalCitas', 'Citas'],
        ['citasProgramadas', 'Citas programadas'],
        ['solicitudesPendientes', 'Solicitudes pendientes'],
        ['solicitudesCompletadas', 'Servicios completados'],
        ['ambulanciasDisponibles', 'Ambulancias disponibles'],
      ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p className="hint">{ipsNombre || 'Panel'} — agenda del día y módulos de esta IPS.</p>
        </div>
        <Link to="/agenda"><button className="btn-primary">Abrir agenda</button></Link>
      </div>
      <div className="grid-stats">
        {cards.map(([k, label]) => (
          <div className="card-stat" key={k}>
            <h3>{stats[k] ?? agenda[k] ?? '—'}</h3>
            <p>{label}</p>
          </div>
        ))}
      </div>

      <h3>Citas de hoy</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Hora</th><th>Paciente</th><th>Motivo</th><th>WhatsApp</th><th>Estado</th></tr></thead>
          <tbody>
            {(agenda.agendaHoy || []).length === 0 && (
              <tr><td colSpan={5}>No hay citas para hoy.</td></tr>
            )}
            {(agenda.agendaHoy || []).map((c: any) => (
              <tr key={c.id}>
                <td>{c.fechaHora ? new Date(c.fechaHora).toLocaleTimeString() : ''}</td>
                <td>{c.paciente?.nombre} {c.paciente?.apellido}</td>
                <td>{c.motivo}</td>
                <td>{c.telefonoWhatsapp || '—'}</td>
                <td>{c.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 20 }}>Próximos 7 días</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Paciente</th><th>Tipo</th><th>Recordatorio</th></tr></thead>
          <tbody>
            {(agenda.agendaProximas || []).map((c: any) => (
              <tr key={c.id}>
                <td>{c.fechaHora ? new Date(c.fechaHora).toLocaleString() : ''}</td>
                <td>{c.paciente?.nombre} {c.paciente?.apellido}</td>
                <td>{c.tipo}</td>
                <td>{c.recordatorioEnviado ? 'Enviado' : 'Pendiente'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

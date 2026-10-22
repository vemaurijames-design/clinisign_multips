import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { citaService, consentimientoService, historiaClinicaService, notificacionService, reporteService, solicitudService, superadminService } from '../services/rest';
import BuscadorPaciente from '../components/BuscadorPaciente';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { rol, ipsId, ipsNombre } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [agenda, setAgenda] = useState<any>({ agendaHoy: [], agendaProximas: [] });
  const [exp, setExp] = useState<any>(null);
  const [expHc, setExpHc] = useState<any[]>([]);
  const [expCons, setExpCons] = useState<any[]>([]);
  const [notis, setNotis] = useState<any[]>([]);
  const [showNotis, setShowNotis] = useState(true);
  const [sols, setSols] = useState<any[]>([]);
  const tenantId = ipsId && ipsId !== 'null' ? Number(ipsId) : null;

  useEffect(() => {
    if (rol === 'SUPERADMIN' && tenantId) {
      superadminService.resumen(tenantId).then(res => setStats(res.data)).catch(() => setStats({}));
    } else if (rol !== 'SUPERADMIN') {
      reporteService.estadisticas().then(res => setStats(res.data)).catch(() => {});
    }
    if (tenantId || rol !== 'SUPERADMIN') {
      citaService.resumen().then(res => setAgenda(res.data)).catch(() => {});
      notificacionService.listar().then(r => setNotis(r.data || [])).catch(() => {});
      solicitudService.listar().then(r => setSols((r.data || []).filter((s: any) =>
        ['PENDIENTE', 'ASIGNADA', 'EN_CURSO'].includes(String(s.estado || '').toUpperCase())
      ))).catch(() => {});
    }
  }, [rol, ipsId]);

  if (rol === 'SUPERADMIN' && !tenantId) {
    return (
      <div className="card">
        <h2>Panel SUPERADMIN</h2>
        <p className="hint">Seleccione una IPS en la barra para ver cifras reales de esa BD.</p>
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

  const max = Math.max(1, ...cards.map(([k]) => Number(stats[k] ?? agenda[k] ?? 0)));

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p className="hint">{ipsNombre || 'Panel'} — cifras tomadas de la BD de esta IPS.</p>
        </div>
        <div className="toolbar">
          <Link to="/agenda"><button className="btn-primary">Agenda</button></Link>
          <Link to="/historias-clinicas"><button>Historias</button></Link>
          <Link to="/consentimientos"><button>Consentimientos PDF</button></Link>
          <Link to="/pacientes"><button>Pacientes</button></Link>
        </div>
      </div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3>Avisos del radiooperador</h3>
          <button type="button" onClick={() => setShowNotis(!showNotis)}>{showNotis ? "Ocultar" : "Mostrar"}</button>
        </div>
        {showNotis && <>
        {(notis || []).length === 0 && <p className="hint">Sin notificaciones nuevas en esta IPS.</p>}
        {(notis || []).slice(0, 8).map((n: any) => (
          <div key={n.id} style={{ padding: '8px 12px', marginBottom: 6, background: '#e8f4fd', borderRadius: 6, borderLeft: '3px solid #0b63c8' }}>
            <strong style={{ color: '#0b63c8' }}>{n.titulo || 'Aviso'}</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>{n.mensaje}</p>
          </div>
        ))}
        <h4>Solicitudes activas</h4>
        {(sols || []).length === 0 && <p className="hint">No hay solicitudes pendientes o en curso.</p>}
        {(sols || []).slice(0, 8).map((s: any) => (
          <p key={s.id} style={{ padding: '6px 10px', marginBottom: 4, background: s.prioridad === 'URGENTE' ? '#ffebee' : s.prioridad === 'ALTA' ? '#fff3e0' : '#f5f5f5', borderRadius: 4, borderLeft: `3px solid ${s.prioridad === 'URGENTE' ? 'red' : s.prioridad === 'ALTA' ? 'orange' : '#0b63c8'}` }}>
            <span style={{ color: s.prioridad === 'URGENTE' ? 'red' : s.prioridad === 'ALTA' ? 'orange' : '#333', fontWeight: s.prioridad === 'URGENTE' ? 'bold' : 'normal' }}>{s.prioridad || 'NORMAL'}</span>
            · {s.estado} · {s.direccionOrigen || s.origen || ''}
            <Link to="/solicitudes" style={{ background: '#0b63c8', color: '#fff', padding: '4px 12px', borderRadius: 4, textDecoration: 'none', fontSize: 12, marginLeft: 8 }}>Abrir</Link>
          </p>
        ))}
      </>}
      </div>
      <div className="grid-stats">
        {cards.map(([k, label], i) => {
          const val = Number(stats[k] ?? agenda[k] ?? 0);
          const colors = ['#0b63c8', '#1a9f5c', '#e67e22', '#8e44ad', '#c0392b', '#2980b9'];
          const color = colors[i % colors.length];
          const pct = Math.round((val / max) * 100);
          return (
            <div className="card-stat" key={k} style={{ borderLeft: `4px solid ${color}` }}>
              <h3 style={{ color }}>{val}</h3>
              <p>{label}</p>
              <div style={{ height: 10, background: '#e6eef8', borderRadius: 6, marginTop: 10 }}>
                <div style={{ width: `${pct}%`, height: 10, background: color, borderRadius: 6, transition: 'width .3s' }} />
              </div>
              <small className="hint">{pct}% del máximo</small>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3>Historial del paciente</h3>
        <p className="hint">Busque por cédula o nombre. Verá HC y consentimientos con PDF.</p>
        <BuscadorPaciente onElegir={async (p: any) => {
          setExp(p);
          const [hc, cons] = await Promise.all([
            historiaClinicaService.porPaciente(p.id).catch(() => ({ data: [] })),
            consentimientoService.porDocumento(p.documento).catch(() => ({ data: [] })),
          ]);
          setExpHc(hc.data || []);
          setExpCons(cons.data || []);
        }} />
        {exp && (
          <div>
            <p><strong>{exp.nombre} {exp.apellido}</strong> · {exp.documento} · {exp.telefono}</p>
            <p className="hint">Historias: {expHc.length} · Consentimientos: {expCons.length}</p>
            {expHc.map((h: any) => (
              <p key={'h'+h.id}><a href={historiaClinicaService.pdfUrl(h.id)} target="_blank" rel="noreferrer">HC #{h.id} PDF</a></p>
            ))}
            {expCons.map((c: any) => (
              <p key={'c'+c.id}><a href={consentimientoService.pdfUrl(c.id)} target="_blank" rel="noreferrer">{c.codigo}-{String(c.consecutivo || c.id).padStart(4,'0')} {c.tipo} PDF</a></p>
            ))}
          </div>
        )}
      </div>
      <h3>Citas de hoy</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Hora</th><th>Paciente</th><th>Motivo</th><th>WhatsApp</th><th>Estado</th></tr></thead>
          <tbody>
            {(agenda.agendaHoy || []).length === 0 && (
              <tr><td colSpan={5}>No hay citas para hoy. Créelas en Agenda.</td></tr>
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

import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { citaService, consentimientoService, historiaClinicaService, notificacionService, reporteService, solicitudService, superadminService } from '../services/rest';
import BuscadorPaciente from '../components/BuscadorPaciente';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { rol, ipsId, ipsNombre } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [agenda, setAgenda] = useState<any>({ agendaHoy: [], agendaProximas: [] });
  const [exp, setExp] = useState<any>(null);
  const [expHc, setExpHc] = useState<any[]>([]);
  const [expCons, setExpCons] = useState<any[]>([]);
  const [notis, setNotis] = useState<any[]>([]);
  const [showNotis, setShowNotis] = useState(true);
  const [sols, setSols] = useState<any[]>([]);
  const tenantId = ipsId && ipsId !== 'null' ? Number(ipsId) : null;

  const cargarDatos = useCallback(() => {
    if (rol === 'SUPERADMIN' && tenantId) {
      superadminService.resumen(tenantId).then(res => setStats(res.data)).catch(() => setStats({}));
    } else if (rol !== 'SUPERADMIN') {
      reporteService.estadisticas().then(res => setStats(res.data)).catch(() => {});
    }

    if (tenantId || rol !== 'SUPERADMIN') {
      citaService.resumen().then(res => setAgenda(res.data)).catch(() => {});
      notificacionService.listar().then(r => setNotis(r.data || [])).catch(() => {});

      // Filtro de solicitudes: Muestra solo las que NO estén completadas/canceladas
      solicitudService.listar().then(r => {
        const activas = (r.data || []).filter((s: any) =>
          ['PENDIENTE', 'ASIGNADA', 'EN_RUTA'].includes(String(s.estado || '').toUpperCase())
        );
        setSols(activas);
      }).catch(() => {});
    }
  }, [rol, tenantId]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 15000); // Sincronización universal
    return () => clearInterval(interval);
  }, [cargarDatos]);

  const notisPendientes = notis.filter(n => {
    if (n.leida) return false;
    const texto = `${n.titulo || ''} ${n.mensaje || ''}`.toLowerCase();
    if (texto.includes('cerrado') || texto.includes('completad') || texto.includes('cancelad')) return false;
    return texto.includes('traslado') || texto.includes('llamada') || texto.includes('asignado');
  });

  const handleNotiClick = async (id: number) => {
    try {
      await notificacionService.marcarLeida(id);
      setNotis(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      navigate('/solicitudes');
    } catch (error) {
      console.error("Error al marcar notificación:", error);
      navigate('/solicitudes');
    }
  };

  if (rol === 'SUPERADMIN' && !tenantId) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '50px', margin: '20px auto', maxWidth: '600px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#0b63c8', margin: 0 }}>Panel SUPERADMIN</h2>
        <p className="hint" style={{ marginBottom: '25px', fontSize: '15px' }}>Seleccione una IPS en la barra superior para ver las cifras reales.</p>
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <Link to="/ips"><button style={{ background: '#0b63c8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>Gestionar IPS</button></Link>
          <Link to="/ips/create"><button style={{ background: '#fff', border: '1px solid #ccc', color: '#374151', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>Registrar IPS</button></Link>
        </div>
      </div>
    );
  }

  const cards = rol === 'SUPERADMIN'
    ? [
        ['usuarios', 'Usuarios'], ['pacientes', 'Pacientes'], ['citas', 'Citas'],
        ['ambulancias', 'Ambulancias'], ['solicitudes', 'Solicitudes'], ['historiasClinicas', 'Historias'],
      ]
    : [
        ['totalPacientes', 'Pacientes'], ['totalCitas', 'Citas'], ['citasProgramadas', 'Citas Program.'],
        ['solicitudesPendientes', 'Pendientes'], ['solicitudesCompletadas', 'Completados'], ['ambulanciasDisponibles', 'Ambulancias'],
      ];

  const max = Math.max(1, ...cards.map(([k]) => Number(stats[k] ?? agenda[k] ?? 0)));

  const btnStyle = { padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold' as const, fontSize: '14px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' };
  const btnPrimary = { ...btnStyle, background: '#0b63c8', color: '#fff', border: 'none' };
  const btnSecondary = { ...btnStyle, background: '#fff', border: '1px solid #ccc', color: '#374151' };

  return (
    <div style={{ padding: '10px', paddingBottom: '30px' }}>
      <div className="page-head" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <p className="hint" style={{ margin: '5px 0 0 0' }}>{ipsNombre || 'Panel'} — Actualización automática cada 15s.</p>
        </div>
        <div className="toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/agenda"><button style={btnPrimary}>Agenda</button></Link>
          <Link to="/historias-clinicas"><button style={btnSecondary}>Historias</button></Link>
          <Link to="/consentimientos"><button style={btnSecondary}>Consentimientos</button></Link>
          <Link to="/pacientes"><button style={btnSecondary}>Pacientes</button></Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#0b63c8', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              Avisos Recientes
              {notisPendientes.length > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{notisPendientes.length} nuevos</span>
              )}
            </h3>
            <button type="button" onClick={() => setShowNotis(!showNotis)} style={{ background: 'transparent', border: 'none', color: '#0b63c8', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              {showNotis ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {showNotis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '5px' }}>
              {notisPendientes.length === 0 ? (
                <p className="hint" style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '6px' }}>No hay avisos nuevos pendientes.</p>
              ) : (
                notisPendientes.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotiClick(n.id)}
                    style={{ padding: '12px 15px', background: '#e0f2fe', borderRadius: '6px', borderLeft: '4px solid #0ea5e9', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#0369a1', fontSize: '14px' }}>{n.titulo || 'Aviso'}</strong>
                      <span style={{ fontSize: '10px', background: '#bae6fd', color: '#0c4a6e', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Abrir solicitud</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', lineHeight: '1.4' }}>{n.mensaje}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0b63c8', fontSize: '18px' }}>Servicios Activos (En Calle)</h3>
          {sols.length === 0 ? (
            <p className="hint" style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '6px' }}>No hay solicitudes en curso en este momento.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sols.slice(0, 4).map((s: any) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: s.prioridad === 'URGENTE' ? '#fef2f2' : s.prioridad === 'ALTA' ? '#fffbeb' : '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ color: s.prioridad === 'URGENTE' ? '#EF4444' : s.prioridad === 'ALTA' ? '#F59E0B' : '#0b63c8', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>{s.prioridad}</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{s.paciente?.nombre || s.direccionOrigen || 'Paciente'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{s.estado}</span>
                    <Link to="/solicitudes" style={{ background: '#0b63c8', color: '#fff', padding: '5px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>Ir</Link>
                  </div>
                </div>
              ))}
              {sols.length > 4 && (
                <Link to="/solicitudes" style={{ textAlign: 'center', fontSize: '13px', color: '#0b63c8', marginTop: '5px', fontWeight: 'bold', textDecoration: 'none' }}>Ver todas las {sols.length} solicitudes...</Link>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', marginBottom: '25px' }}>
        {cards.map(([k, label], i) => {
          const val = Number(stats[k] ?? agenda[k] ?? 0);
          const pct = Math.round((val / max) * 100);
          const colors = ['#0b63c8', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
          const color = colors[i % colors.length];

          const radius = 30;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;

          return (
            <div key={k} style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
                <svg width="70" height="70" viewBox="0 0 70 70">
                  <circle cx="35" cy="35" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle cx="35" cy="35" r={radius} fill="transparent" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: '#334155' }}>
                  {val}
                </div>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={label}>{label}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: color, fontWeight: 'bold' }}>{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0b63c8', fontSize: '18px' }}>Búsqueda de Historial Clínico</h3>
          <p className="hint" style={{ marginBottom: '15px' }}>Ingrese cédula o nombre para ver los PDFs generados del paciente.</p>

          <div style={{ marginBottom: '15px' }}>
            <BuscadorPaciente onElegir={async (p: any) => {
              setExp(p);
              const [hc, cons] = await Promise.all([
                historiaClinicaService.porPaciente(p.id).catch(() => ({ data: [] })),
                consentimientoService.porDocumento(p.documento).catch(() => ({ data: [] })),
              ]);
              setExpHc(hc.data || []);
              setExpCons(cons.data || []);
            }} />
          </div>

          {exp && (
            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>{exp.nombre} {exp.apellido}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Doc: {exp.documento} · Tel: {exp.telefono || '—'}</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#0b63c8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📂 Historias Clínicas ({expHc.length})
                  </h4>
                  {expHc.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>No registra.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {expHc.map((h: any) => (
                        <a key={'h'+h.id} href={historiaClinicaService.pdfUrl(h.id)} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', color: '#334155', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e0f2fe'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                          <span>HC #{h.id}</span>
                          <span style={{ color: '#0b63c8', fontWeight: 'bold' }}>Ver PDF →</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ flex: '1 1 200px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#be185d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📄 Consentimientos ({expCons.length})
                  </h4>
                  {expCons.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>No registra.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {expCons.map((c: any) => (
                        <a key={'c'+c.id} href={consentimientoService.pdfUrl(c.id)} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', color: '#334155', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fce7f3'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                          <span>{c.codigo}-{String(c.consecutivo || c.id).padStart(4,'0')}</span>
                          <span style={{ color: '#be185d', fontWeight: 'bold' }}>Ver PDF →</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0b63c8', fontSize: '18px' }}>Citas de Hoy</h3>
          <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', minWidth: '350px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Hora</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Paciente</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(agenda.agendaHoy || []).length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: '#666' }}>No hay citas para hoy.</td></tr>
                )}
                {(agenda.agendaHoy || []).map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}>
                      {c.fechaHora ? new Date(c.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#475569' }}>{c.paciente?.nombre} {c.paciente?.apellido}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{c.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
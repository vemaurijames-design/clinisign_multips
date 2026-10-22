import { useEffect, useState } from 'react';
import { notificacionService } from '../services/rest';

export default function Notificaciones() {
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const cargar = () => notificacionService.listar()
    .then(r => setItems(Array.isArray(r.data) ? r.data : []))
    .catch(e => { setItems([]); setMsg(e.response?.data?.message || 'No se pudieron leer avisos. Elija la IPS en la barra y reinicie el backend.'); });
  useEffect(() => { cargar(); }, []);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Notificaciones de esta IPS</h2>
          <p className="hint">Avisos del radiooperador y asignaciones. Solo de la IPS seleccionada.</p>
        </div>
        <button onClick={cargar}>Actualizar</button>
      </div>
      {msg && <div className="card">{msg}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && <div className="card">Sin avisos. Cree una solicitud desde el radiooperador.</div>}
        {items.map((n: any) => (
          <div key={n.id} style={{ padding: 12, background: n.leida ? '#f5f5f5' : '#e8f4fd', borderRadius: 8, borderLeft: `4px solid ${n.titulo?.includes('URGENTE') ? 'red' : '#0b63c8'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#0b63c8' }}>{n.titulo}</strong>
              <span style={{ fontSize: 12, color: '#666' }}>{n.fechaCreacion ? new Date(n.fechaCreacion).toLocaleString() : ''}</span>
            </div>
            <p style={{ margin: '6px 0', fontSize: 14 }}>{n.mensaje}</p>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#666' }}>
              <span>Para: {n.rolDestino}</span>
              <span>Módulo: {n.modulo}</span>
              {!n.leida && (
                <button onClick={async () => {
                  await notificacionService.leida(n.id);
                  setMsg('Marcada como leída');
                  cargar();
                }} style={{ background: '#0b63c8', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Marcar leída</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
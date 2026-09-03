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
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Para</th><th>Título</th><th>Mensaje</th><th>Módulo</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6}>Sin avisos. Cree una solicitud desde el radiooperador.</td></tr>}
            {items.map((n: any) => (
              <tr key={n.id}>
                <td>{n.fechaCreacion ? new Date(n.fechaCreacion).toLocaleString() : ''}</td>
                <td>{n.rolDestino}</td>
                <td>{n.titulo}</td>
                <td>{n.mensaje}</td>
                <td>{n.modulo}</td>
                <td>
                  {!n.leida && (
                    <button onClick={async () => {
                      await notificacionService.leida(n.id);
                      setMsg('Marcada como leída');
                      cargar();
                    }}>Marcar leída</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

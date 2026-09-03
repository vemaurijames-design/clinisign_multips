import { useEffect, useState, useRef } from 'react';
import { notificacionService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { rol } = useAuth();
  const [notis, setNotis] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const cargar = async () => {
    try {
      const [r1, r2] = await Promise.all([
        notificacionService.listar(),
        notificacionService.count ? notificacionService.count() : Promise.resolve({ data: { count: 0 } }),
      ]);
      const list = r1.data || [];
      setNotis(list);
      setCount(list.filter((n: any) => !n.leida).length);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, 30000);
    return () => clearInterval(timer);
  }, [rol]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const marcarLeida = async (id: number) => {
    try {
      await notificacionService.marcarLeida(id);
      cargar();
    } catch (e) { /* ignore */ }
  };

  const leerTodas = async () => {
    try {
      await notificacionService.leerTodas();
      cargar();
    } catch (e) { /* ignore */ }
  };

  const fmtFecha = (f: string) => {
    try {
      const d = new Date(f);
      return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen(v => !v)} title="Notificaciones">
        🔔
        {count > 0 && <span className="bell-badge">{count}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <strong>Notificaciones</strong>
            {count > 0 && <button className="notif-read-all" onClick={leerTodas}>Marcar todas leídas</button>}
          </div>
          <div className="notif-list">
            {notis.length === 0 && <p className="notif-empty">Sin notificaciones</p>}
            {notis.slice(0, 20).map((n: any) => (
              <div key={n.id} className={`notif-item ${n.leida ? 'read' : 'unread'}`}
                   onClick={() => !n.leida && marcarLeida(n.id)}>
                <div className="notif-tipo">{n.tipo}</div>
                <div className="notif-msg">{n.mensaje}</div>
                <div className="notif-date">{fmtFecha(n.fecha)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
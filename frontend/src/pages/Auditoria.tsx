import { useEffect, useState } from 'react';
import { auditoriaService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function Auditoria() {
  const { rol } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    auditoriaService.listar().then(r => setRows(r.data || [])).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <h2>Bitácora de la IPS</h2>
      <p className="hint">Quién (usuario y rol) creó o modificó cada registro en esta base. Control interno por IPS.</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Módulo</th><th>Acción</th><th>Detalle</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6}>Aún no hay movimientos, o entre como SUPERADMIN / ADMINIPS / CALIDAD.</td></tr>}
            {rows.filter((a: any) => rol === 'SUPERADMIN' || a.rol !== 'SUPERADMIN').map((a: any) => (
              <tr key={a.id}>
                <td>{a.fecha ? new Date(a.fecha).toLocaleString() : ''}</td>
                <td>{a.usuarioNombre || a.usuarioEmail}</td>
                <td>{a.rol}</td>
                <td>{a.modulo}</td>
                <td style={{ color: a.accion === 'ELIMINAR' ? 'red' : a.accion === 'CREAR' ? 'green' : '#0b63c8', fontWeight: 'bold' }}>{a.accion}</td>
                <td>{a.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

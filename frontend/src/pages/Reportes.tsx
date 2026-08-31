import { useEffect, useState } from 'react';
import { reporteService } from '../services/rest';

export default function Reportes() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    reporteService.estadisticas().then(res => setStats(res.data)).catch(() => {});
  }, []);
  const cards = [
    ['totalPacientes', 'Pacientes'], ['totalAmbulancias', 'Ambulancias'],
    ['totalHistoriasClinicas', 'Historias'], ['solicitudesCompletadas', 'Completados'],
    ['solicitudesPendientes', 'Pendientes'], ['ambulanciasDisponibles', 'Disponibles'],
    ['ambulanciasEnServicio', 'En servicio'], ['ambulanciasMantenimiento', 'Mantenimiento'],
  ];
  return (
    <div>
      <h2>Reportes</h2>
      <div className="grid-stats">
        {cards.map(([k, label]) => (
          <div className="card-stat" key={k}><h3>{stats[k] ?? '—'}</h3><p>{label}</p></div>
        ))}
      </div>
      <iframe className="pdf-frame" src={reporteService.pdfUrl()} title="Reporte PDF" />
    </div>
  );
}

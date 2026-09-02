import { useEffect, useState } from 'react';
import { reporteService } from '../services/rest';

export default function Reportes() {
  const [stats, setStats] = useState<any>({});
  const [url, setUrl] = useState('');
  useEffect(() => {
    reporteService.estadisticas().then(res => setStats(res.data)).catch(() => {});
    setUrl(reporteService.pdfUrl());
  }, []);
  const cards = [
    ['totalPacientes', 'Pacientes'], ['totalAmbulancias', 'Ambulancias'],
    ['totalHistoriasClinicas', 'Historias'], ['solicitudesCompletadas', 'Completados'],
    ['solicitudesPendientes', 'Pendientes'], ['ambulanciasDisponibles', 'Disponibles'],
    ['ambulanciasEnServicio', 'En servicio'], ['ambulanciasMantenimiento', 'Mantenimiento'],
  ];
  return (
    <div>
      <div className="page-head">
        <h2>Reportes</h2>
        <div className="toolbar">
          <a href={url} target="_blank" rel="noreferrer"><button className="btn-primary">Abrir PDF</button></a>
          <button onClick={() => window.open(url)}>Imprimir / ver</button>
        </div>
      </div>
      <div className="grid-stats">
        {cards.map(([k, label]) => (
          <div className="card-stat" key={k}><h3>{stats[k] ?? '—'}</h3><p>{label}</p></div>
        ))}
      </div>
      {url && <iframe className="pdf-frame" src={url} title="Reporte PDF" />}
    </div>
  );
}

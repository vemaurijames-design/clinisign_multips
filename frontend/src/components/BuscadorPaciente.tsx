import { useState } from 'react';
import { pacienteService } from '../services/rest';

export default function BuscadorPaciente({
  onElegir,
  placeholder = 'Cédula o nombre del paciente',
}: {
  onElegir: (p: any) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  const buscar = async () => {
    setMsg('');
    try {
      const { data } = await pacienteService.buscar(q);
      setHits(data || []);
      if (!data || data.length === 0) setMsg('No hay paciente con ese dato en esta IPS. Regístrelo en Pacientes.');
    } catch {
      setMsg('No se pudo buscar');
    }
  };

  return (
    <div className="card">
      <div className="toolbar">
        <input placeholder={placeholder} value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }} />
        <button type="button" className="btn-primary" onClick={buscar}>Buscar</button>
      </div>
      {msg && <p className="hint">{msg}</p>}
      {hits.map(p => (
        <button key={p.id} type="button" onClick={() => { onElegir(p); setHits([]); }}>
          {p.nombre} {p.apellido} — {p.documento} {p.telefono ? `· ${p.telefono}` : ''}
        </button>
      ))}
    </div>
  );
}

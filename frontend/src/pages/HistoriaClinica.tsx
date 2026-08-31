import { useEffect, useState } from 'react';
import { historiaClinicaService, pacienteService } from '../services/rest';

export default function HistoriaClinica() {
  const [historias, setHistorias] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const cargar = async () => {
    const [hcs, pacs] = await Promise.all([historiaClinicaService.listar(), pacienteService.listar()]);
    setHistorias(hcs.data); setPacientes(pacs.data);
  };
  useEffect(() => { cargar(); }, []);

  return (
    <div>
      <div className="page-head">
        <h2>Historias clínicas HC-FM-05</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Nueva</button>
      </div>
      {showForm && <HCForm pacientes={pacientes} onSave={async (data: any) => {
        await historiaClinicaService.crear(data); setShowForm(false); cargar();
      }} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Paciente</th><th>Tipo</th><th>Motivo</th><th>CIE-10</th><th></th></tr></thead>
          <tbody>
            {historias.map(hc => (
              <tr key={hc.id}>
                <td>{hc.fechaAtencion ? new Date(hc.fechaAtencion).toLocaleDateString() : ''}</td>
                <td>{hc.paciente?.nombre} {hc.paciente?.apellido}</td>
                <td>{hc.tipoAtencion}</td>
                <td>{hc.motivoConsulta?.substring(0, 50)}</td>
                <td>{hc.cie10Principal}</td>
                <td><button onClick={async () => { if (confirm('¿Eliminar?')) { await historiaClinicaService.eliminar(hc.id); cargar(); } }}>Borrar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HCForm({ pacientes, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>({
    pacienteId: '', tipoAtencion: 'URGENCIAS', lugarAtencion: '', horaAtencion: '',
    motivoConsulta: '', enfermedadActual: '', ta: '', fc: '', fr: '', temp: '', spo2: '', glasgow: '',
    viaAerea: '', respiracion: '', circulacion: '', discapacidad: '', exposicion: '',
    cie10Principal: '', cie10Descripcion: '', tratamiento: '', evolucion: '', destinoPaciente: '',
    nombreProfesional: '', registroProfesional: '',
  });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  return (
    <div className="card">
      <h3>Nueva historia clínica</h3>
      <div className="form-grid">
        <select value={form.pacienteId} onChange={e => set('pacienteId', e.target.value)}>
          <option value="">Paciente...</option>
          {pacientes.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
        </select>
        <select value={form.tipoAtencion} onChange={e => set('tipoAtencion', e.target.value)}>
          <option value="URGENCIAS">Urgencias</option>
          <option value="EMERGENCIA">Emergencia</option>
          <option value="TRASLADO">Traslado</option>
        </select>
        <input placeholder="Lugar de atención" value={form.lugarAtencion} onChange={e => set('lugarAtencion', e.target.value)} />
        <input placeholder="Hora" value={form.horaAtencion} onChange={e => set('horaAtencion', e.target.value)} />
        <input placeholder="TA" value={form.ta} onChange={e => set('ta', e.target.value)} />
        <input placeholder="FC" value={form.fc} onChange={e => set('fc', e.target.value)} />
        <input placeholder="FR" value={form.fr} onChange={e => set('fr', e.target.value)} />
        <input placeholder="Temp" value={form.temp} onChange={e => set('temp', e.target.value)} />
        <input placeholder="SpO2" value={form.spo2} onChange={e => set('spo2', e.target.value)} />
        <input placeholder="Glasgow" value={form.glasgow} onChange={e => set('glasgow', e.target.value)} />
        <input placeholder="Vía aérea" value={form.viaAerea} onChange={e => set('viaAerea', e.target.value)} />
        <input placeholder="Respiración" value={form.respiracion} onChange={e => set('respiracion', e.target.value)} />
        <input placeholder="Circulación" value={form.circulacion} onChange={e => set('circulacion', e.target.value)} />
        <input placeholder="Discapacidad" value={form.discapacidad} onChange={e => set('discapacidad', e.target.value)} />
        <input placeholder="Exposición" value={form.exposicion} onChange={e => set('exposicion', e.target.value)} />
        <input placeholder="CIE-10" value={form.cie10Principal} onChange={e => set('cie10Principal', e.target.value)} />
        <input placeholder="Descripción CIE-10" value={form.cie10Descripcion} onChange={e => set('cie10Descripcion', e.target.value)} />
        <input placeholder="Profesional" value={form.nombreProfesional} onChange={e => set('nombreProfesional', e.target.value)} />
        <input placeholder="Registro" value={form.registroProfesional} onChange={e => set('registroProfesional', e.target.value)} />
      </div>
      <textarea placeholder="Motivo de consulta" value={form.motivoConsulta} onChange={e => set('motivoConsulta', e.target.value)} />
      <textarea placeholder="Enfermedad actual" value={form.enfermedadActual} onChange={e => set('enfermedadActual', e.target.value)} />
      <textarea placeholder="Tratamiento" value={form.tratamiento} onChange={e => set('tratamiento', e.target.value)} />
      <textarea placeholder="Evolución" value={form.evolucion} onChange={e => set('evolucion', e.target.value)} />
      <input placeholder="Destino del paciente" value={form.destinoPaciente} onChange={e => set('destinoPaciente', e.target.value)} />
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={() => onSave(form)}>Guardar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

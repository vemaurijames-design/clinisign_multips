import { useEffect, useRef, useState } from 'react';
import { historiaClinicaService, pacienteService } from '../services/rest';
import { useAuth } from '../context/AuthContext';
import BuscadorPaciente from '../components/BuscadorPaciente';
import SignaturePad from '../components/SignaturePad';

const EVENTOS = ['Arrollamiento','Acc. trabajo','Acc. químico','Atrapamiento','Agresión','Autoinfligido','Caída','Ambiental','Cuerpo extraño','Electrocución','Explosión','Incendio','Enfermedad común','Golpe / impacto','Acc. tránsito'];
const MOT_MED = ['P. cardiorespiratoria','Org. sentidos','Cardiovascular','Respiratorio','Gastrointestinal','Genitourinario','Gineco-obstétrica','Osteomuscular','Piel y anexos','Metabólica','Reacción alérgica','Obstrucción vía aérea','Psiquiátrica','Envenenamiento','Calor / frío'];
const MOT_TRA = ['Politrauma','Encefalocraneal','Maxilofacial','Org. sentidos','Raquimedular','Tórax','Abdominal','Pelvis / genital','Tejidos blandos','Osteomuscular','Inhalación','Intoxicación'];
const CUIDADOS = ['Ciudadano','Empleado','Socorrista','Médico','Enfermera','Nadie','Policía','Seguridad','Familiar'];

export default function HistoriaClinica() {
  const [historias, setHistorias] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const { rol } = useAuth();
  const cargar = async () => {
    const [hcs, pacs] = await Promise.all([historiaClinicaService.listar(), pacienteService.listar()]);
    setHistorias(hcs.data); setPacientes(pacs.data);
  };
  useEffect(() => { cargar(); }, []);
  const vis = historias.filter(hc => !q || `${hc.paciente?.nombre} ${hc.paciente?.apellido} ${hc.paciente?.documento}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Historia clínica HC-FM-05</h2>
          <p className="hint">Formato SIAN. Un registro por atención. Profesional = usuario logueado.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Nueva HC</button>
      </div>
      <div className="toolbar">
        <input placeholder="Buscar paciente o cédula" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" className="btn-primary">Buscar</button>
      </div>
      {showForm && <HCForm pacientes={pacientes} onSave={async (data: any) => {
        await historiaClinicaService.crear(data); setShowForm(false); cargar();
      }} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Paciente</th><th>Clasificación</th><th>Motivo</th><th>Profesional</th><th></th></tr></thead>
          <tbody>
            {vis.map(hc => (
              <tr key={hc.id}>
                <td>{hc.fechaAtencion ? new Date(hc.fechaAtencion).toLocaleString() : ''}</td>
                <td>{hc.paciente?.nombre} {hc.paciente?.apellido} {hc.paciente?.documento}</td>
                <td>{hc.tipoAtencion}</td>
                <td>{hc.motivoConsulta?.substring(0, 60)}</td>
                <td>{hc.nombreProfesional}</td>
                <td>
                  <a href={historiaClinicaService.pdfUrl(hc.id)} target="_blank" rel="noreferrer"><button>PDF</button></a>
                  {rol === 'SUPERADMIN'
                    ? <button onClick={async () => { if (confirm('Anular?')) { await historiaClinicaService.eliminar(hc.id); cargar(); } }}>Anular</button>
                    : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function chips(list: string[], selected: string[], setSel: (v: string[]) => void) {
  return (
    <div className="toolbar">
      {list.map(x => (
        <label key={x} className="hint">
          <input type="checkbox" checked={selected.includes(x)} onChange={e => {
            setSel(e.target.checked ? [...selected, x] : selected.filter(i => i !== x));
          }} /> {x}
        </label>
      ))}
    </div>
  );
}

function HCForm({ onSave, onCancel }: any) {
  const { nombre, email } = useAuth();
  const now = new Date();
  const [pac, setPac] = useState<any>(null);
  const [form, setForm] = useState<any>({
    fechaAtencion: now.toISOString().slice(0, 10),
    horaAtencion: now.toTimeString().slice(0, 5),
    horaDespacho: '', horaLlegada: '', horaSalida: '',
    placaMovil: '', origen: '', destino1: '', destino2: '',
    tipoAtencion: 'URGENCIAS',
    conductor: '', tripulante: '',
    ta: '', fc: '', fr: '', temp: '', spo2: '', glasgow: '',
    viaAerea: 'Permeable', respiracion: 'Normal', circulacion: 'Estable',
    piel: 'Normal', hemo: 'Estable', peso: '', talla: '',
    alergias: 'NO', medicamentosActuales: 'NO', antecedentesPersonales: 'NO',
    antecedentesQuirurgicos: 'NO', fumador: 'NO', alcohol: 'NO', spa: 'NO',
    cie10Principal: '', tratamiento: '', evolucion: '', destinoPaciente: 'IPS receptora',
    nombreProfesional: nombre || email || '', registroProfesional: '',
  });
  const [eventos, setEventos] = useState<string[]>([]);
  const [motMed, setMotMed] = useState<string[]>([]);
  const [motTra, setMotTra] = useState<string[]>([]);
  const [cuidados, setCuidados] = useState<string[]>([]);
  const firmaP = useRef<any>(null);
  const firmaA = useRef<any>(null);
  const firmaH = useRef<any>(null);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const validar = () => {
    if (!pac?.id) return alert('Busque y elija el paciente');
    if (!form.ta || !form.fc) return alert('TA y FC obligatorios');
    onSave({
      ...form,
      pacienteId: pac.id,
      motivoConsulta: [...motMed, ...motTra].join('; ') || form.tipoAtencion,
      enfermedadActual: `Eventos: ${eventos.join(', ')}. Cuidados: ${cuidados.join(', ')}. Piel ${form.piel}. Hemo ${form.hemo}. Placa ${form.placaMovil} Origen ${form.origen} Destino ${form.destino1}`,
      detalleJson: JSON.stringify({ eventos, motMed, motTra, cuidados, placa: form.placaMovil, origen: form.origen }),
      firmaPaciente: firmaP.current?.toDataURL?.(),
      firmaAcompanante: firmaA.current?.toDataURL?.(),
      firmaProfesional: firmaH.current?.toDataURL?.(),
    });
  };
  return (
    <div className="card">
      <h3>HC-FM-05 · Versión 01</h3>
      <BuscadorPaciente onElegir={setPac} />
      {pac && <p className="hint">Paciente: {pac.nombre} {pac.apellido} · {pac.documento} · {pac.eps}</p>}
      <h4>1. Información general</h4>
      <div className="form-grid">
        <input type="date" value={form.fechaAtencion} onChange={e => set('fechaAtencion', e.target.value)} />
        <input type="time" value={form.horaAtencion} onChange={e => set('horaAtencion', e.target.value)} />
        <input placeholder="Placa móvil" value={form.placaMovil} onChange={e => set('placaMovil', e.target.value)} />
        <input type="time" value={form.horaDespacho} onChange={e => set('horaDespacho', e.target.value)} />
        <input type="time" value={form.horaLlegada} onChange={e => set('horaLlegada', e.target.value)} />
        <input type="time" value={form.horaSalida} onChange={e => set('horaSalida', e.target.value)} />
        <input placeholder="Origen" value={form.origen} onChange={e => set('origen', e.target.value)} />
        <input placeholder="Destino 1" value={form.destino1} onChange={e => set('destino1', e.target.value)} />
        <select value={form.tipoAtencion} onChange={e => set('tipoAtencion', e.target.value)}>
          <option value="TRASLADO">Traslado</option>
          <option value="EMERGENCIA">Emergencia</option>
          <option value="URGENCIAS">Urgencia</option>
          <option value="CONSULTA">Consulta</option>
        </select>
        <input placeholder="Conductor" value={form.conductor} onChange={e => set('conductor', e.target.value)} />
        <input placeholder="Tripulante / APH" value={form.tripulante} onChange={e => set('tripulante', e.target.value)} />
        <input readOnly value={form.nombreProfesional} />
        <input placeholder="Registro" value={form.registroProfesional} onChange={e => set('registroProfesional', e.target.value)} />
      </div>
      <h4>3. Cuidados anteriores</h4>{chips(CUIDADOS, cuidados, setCuidados)}
      <h4>4. Tipo de evento</h4>{chips(EVENTOS, eventos, setEventos)}
      <h4>5.1 Urgencia médica</h4>{chips(MOT_MED, motMed, setMotMed)}
      <h4>5.2 Urgencia traumática</h4>{chips(MOT_TRA, motTra, setMotTra)}
      <h4>6. Antecedentes</h4>
      <div className="form-grid">
        {[['antecedentesPersonales','Patologías'],['antecedentesQuirurgicos','Cirugías'],['medicamentosActuales','Medicamentos'],['alergias','Alergias'],['fumador','Fumador'],['alcohol','Alcohol'],['spa','SPA']].map(([k,l]) => (
          <select key={k} value={form[k]} onChange={e => set(k, e.target.value)}>
            <option value="NO">{l}: NO</option>
            <option value="SI">{l}: SÍ</option>
          </select>
        ))}
      </div>
      <h4>7. Examen físico</h4>
      <div className="form-grid">
        <input placeholder="TA *" value={form.ta} onChange={e => set('ta', e.target.value)} />
        <input placeholder="FC *" value={form.fc} onChange={e => set('fc', e.target.value)} />
        <input placeholder="FR" value={form.fr} onChange={e => set('fr', e.target.value)} />
        <input placeholder="Sat O2" value={form.spo2} onChange={e => set('spo2', e.target.value)} />
        <input placeholder="Temp" value={form.temp} onChange={e => set('temp', e.target.value)} />
        <select value={form.glasgow} onChange={e => set('glasgow', e.target.value)}>
          <option value="">Glasgow</option>
          {[...Array(13)].map((_, i) => <option key={i+3}>{i+3}</option>)}
        </select>
        <select value={form.piel} onChange={e => set('piel', e.target.value)}>
          {['Normal','Pálida','Fría','Caliente','Seca','Húmeda','Enrojecida','Ictérica','Cianótica'].map(x => <option key={x}>{x}</option>)}
        </select>
        <select value={form.hemo} onChange={e => set('hemo', e.target.value)}>
          {['Estable','Inestable','Paro respiratorio','Paro cardiorespiratorio'].map(x => <option key={x}>{x}</option>)}
        </select>
        <input placeholder="CIE-10" value={form.cie10Principal} onChange={e => set('cie10Principal', e.target.value)} />
      </div>
      <textarea placeholder="Tratamiento" value={form.tratamiento} onChange={e => set('tratamiento', e.target.value)} />
      <h4>Página 2 HC-FM-05 — Evolución, procedimientos y entrega</h4>
      <textarea placeholder="Evolución" value={form.evolucion} onChange={e => set('evolucion', e.target.value)} />
      <textarea placeholder="8. Tratamiento / procedimientos (compresas, O2, collar, RCP, líquidos…)" value={form.tratamiento} onChange={e => set('tratamiento', e.target.value)} />
      <input placeholder="CIE-10" value={form.cie10Principal} onChange={e => set('cie10Principal', e.target.value)} />
      <input placeholder="13. Institución que recibe" value={form.destinoPaciente} onChange={e => set('destinoPaciente', e.target.value)} />
      <SignaturePad ref={firmaP} label="Firma del paciente" />
      <SignaturePad ref={firmaA} label="Firma del acompañante / responsable" />
      <SignaturePad ref={firmaH} label="Firma APH / talento humano que traslada" />
      <div className="toolbar">
        <button className="btn-primary" onClick={validar}>Guardar HC y generar PDF</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

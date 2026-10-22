import { useEffect, useRef, useState } from 'react';
import { ambulanciaService, historiaClinicaService, pacienteService } from '../services/rest';
import { useAuth } from '../context/AuthContext';
import BuscadorPaciente from '../components/BuscadorPaciente';
import SignaturePad from '../components/SignaturePad';

const EVENTOS = ['Arrollamiento','Acc. trabajo','Acc. químico','Atrapamiento','Agresión','Autoinfligido','Caída','Ambiental','Cuerpo extraño','Electrocución','Explosión','Incendio','Enfermedad común','Golpe / impacto','Acc. tránsito'];
const MOT_MED = ['P. cardiorespiratoria','Org. sentidos','Cardiovascular','Respiratorio','Gastrointestinal','Genitourinario','Gineco-obstétrica','Osteomuscular','Piel y anexos','Metabólica','Reacción alérgica','Obstrucción vía aérea','Psiquiátrica','Envenenamiento','Calor / frío'];
const MOT_TRA = ['Politrauma','Encefalocraneal','Maxilofacial','Org. sentidos','Raquimedular','Tórax','Abdominal','Pelvis / genital','Tejidos blandos','Osteomuscular','Inhalación','Intoxicación'];
const CUIDADOS = ['Ciudadano','Empleado','Socorrista','Médico','Enfermera','Nadie','Policía','Seguridad','Familiar'];
const LESIONES = ['1 Fractura abierta','2 Fractura cerrada','3 Luxación','4 Traumapenetrante','5 Electrocución','6 Quemadura','7 Trauma cerrado','8 Desgarro','9 Esguince','10 Aplastamiento','11 Contusión','12 Incisión','13','14 Picadura','15 Herida abierta','16 Laceración','17 Abrasión','18 Avulsión','19 Punción','20 Amputación','21 Mordedura','22 Hemorragia','23 Cuerpo extraño','24 Hematoma'];
const TRAT_X = ['Compresas','Hemostáticos','Compresión arterial','Torniquete de control','Desfibrilación'];
const TRAT_A = ['Evaluación','Despeje vía aérea','Cánula orofaríngea','Aspiración secreciones','Collar cervical','Movimiento en bloque'];
const TRAT_B = ['Respiración asistida','Oxígeno','1. Cánula nasal','2. Máscara simple','3. Másc. no reinhalación'];
const TRAT_C = ['RCP','Control hemorragia','Manta térmica','Posición'];
const TRAT_D = ['Tabla espina larga','Inmovilizador dorsal','Extracción'];
const TRAT_E = ['Exponer','Cuidar privacidad','Prevenir hipotermia'];
const TRAT_AV = ['Máscara laríngea','Tubo laríngeo','Combitubo','Acceso venoso periférico','Líquidos EV Hartman','Solución salina','Dextrosa 5%','Dextrosa 10%'];
const OTROS = ['Monitoreo signos vitales','Lavado / Curación','Atención parto','Inmovilización férulas'];

function chips(list: string[], selected: string[], setSel: (v: string[]) => void) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      {list.map(x => (
        <label key={x} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: selected.includes(x) ? '#0b63c8' : '#f0f0f0', color: selected.includes(x) ? '#fff' : '#333', borderRadius: 16, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={selected.includes(x)} onChange={e => {
            setSel(e.target.checked ? [...selected, x] : selected.filter(i => i !== x));
          }} style={{ display: 'none' }} /> {x}
        </label>
      ))}
    </div>
  );
}

export default function HistoriaClinica() {
  const [historias, setHistorias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const [buscado, setBuscado] = useState('');
  const { rol } = useAuth();
  const cargar = async () => {
    const hcs = await historiaClinicaService.listar();
    setHistorias(hcs.data || []);
  };
  useEffect(() => { cargar(); }, []);
  const vis = historias.filter(hc => !buscado || `${hc.paciente?.nombre} ${hc.paciente?.apellido} ${hc.paciente?.documento}`.toLowerCase().includes(buscado.toLowerCase()));
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Historia clínica HC-FM-05</h2>
          <p className="hint">Formato SIAN páginas 1 y 2. Llene por módulos. El PDF sale con los mismos bloques.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Nueva HC</button>
      </div>
      <div className="toolbar">
        <input placeholder="Buscar paciente o cédula" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" className="btn-primary" onClick={() => setBuscado(q)}>Buscar</button>
      </div>
      {showForm && <HCForm onSave={async (data: any) => {
        await historiaClinicaService.crear(data); localStorage.removeItem('hc_borrador'); setShowForm(false); cargar();
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
                  {rol === 'SUPERADMIN' ? <button onClick={async () => { if (confirm('Anular?')) { await historiaClinicaService.eliminar(hc.id); cargar(); } }}>Anular</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HCForm({ onSave, onCancel }: any) {
  const { nombre, email } = useAuth();
  const now = new Date();
  const [pac, setPac] = useState<any>(null);
  const [alta, setAlta] = useState({ nombre: '', apellido: '', documento: '', telefono: '', tipoDocumento: 'CC', direccion: '', eps: '', genero: 'M', edad: '' });

  const [form, setForm] = useState<any>({
    fechaAtencion: now.toISOString().slice(0, 10),
    horaAtencion: now.toTimeString().slice(0, 5),
    horaDespacho: now.toTimeString().slice(0, 5),
    horaLlegada: now.toTimeString().slice(0, 5),
    horaSalida: now.toTimeString().slice(0, 5),
    placaMovil: '', origen: '', destino1: '', destino2: '',
    tipoAtencion: 'Urgencia', conductor: '', tripulante: '',
    ta: '', fc: '', fr: '', temp: '', spo2: '', glasgow: '', glucometria: '',
    ta2: '', fc2: '', fr2: '', temp2: '', spo2b: '', glasgow2: '',
    viaAerea: 'Permeable', respiracion: 'Normal', circulacion: 'Estable',
    piel: 'Normal', hemo: 'Estable', peso: '', talla: '',
    alergias: 'NO', medicamentosActuales: 'NO', antecedentesPersonales: 'NO',
    antecedentesQuirurgicos: 'NO', fumador: 'NO', alcohol: 'NO', spa: 'NO',
    cie10Principal: '', tratamiento: '', evolucion: '', destinoPaciente: '',
    instruccion: '', resultado: '', docAcompanante: '', nombreAcompanante: '', complicaciones: '', asignaTraslado: '',
    nombreProfesional: nombre || email || '', registroProfesional: '',
  });
    // Auto-save draft
  useEffect(() => {
    const saved = localStorage.getItem('historiaClinicaDraft');
    if (saved) {
      try { setForm(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('historiaClinicaDraft', JSON.stringify(form));
  }, [form]);
  const limpiarBorrador = () => {
    localStorage.removeItem('historiaClinicaDraft');
    alert('Borrador eliminado. Recargue para empezar de nuevo.');
  };

  const [eventos, setEventos] = useState<string[]>([]);
  const [motMed, setMotMed] = useState<string[]>([]);
  const [motTra, setMotTra] = useState<string[]>([]);
  const [cuidados, setCuidados] = useState<string[]>([]);
  const [lesiones, setLesiones] = useState<string[]>([]);
  const [trat, setTrat] = useState<string[]>([]);
  const [moviles, setMoviles] = useState<any[]>([]);
  useEffect(() => { ambulanciaService.listar().then(r => setMoviles(r.data || [])).catch(() => {}); }, []);
  const firmaP = useRef<any>(null);
  const firmaA = useRef<any>(null);
  const firmaH = useRef<any>(null);
  const set = (k: string, v: string) => {
    const next = { ...form, [k]: v };
    setForm(next);
    try { localStorage.setItem('hc_borrador', JSON.stringify(next)); } catch {}
  };
  // Restaurar borrador al cargar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hc_borrador');
      if (saved) setForm(JSON.parse(saved));
    } catch {}
  }, []);
  const validar = () => {
    if (!pac?.id) return alert('Busque y elija el paciente');
    if (!form.ta || !form.fc) return alert('TA y FC del examen físico son obligatorios');
    onSave({
      ...form,
      pacienteId: pac.id,
      motivoConsulta: [...motMed, ...motTra].join('; ') || form.tipoAtencion,
      procedimientosRealizados: trat.join('; '),
      enfermedadActual: `Eventos: ${eventos.join(', ')}. Cuidados: ${cuidados.join(', ')}. Lesiones: ${lesiones.join(', ')}.`,
      detalleJson: JSON.stringify({ eventos, motMed, motTra, cuidados, lesiones, trat, placa: form.placaMovil, origen: form.origen, instruccion: form.instruccion, resultado: form.resultado, complicaciones: form.complicaciones, docAcompanante: form.docAcompanante, nombreAcompanante: form.nombreAcompanante || pac?.contactoNombre }),
      firmaPaciente: firmaP.current?.toDataURL?.() || firmaP.current?.getBase64?.(),
      firmaAcompanante: firmaA.current?.toDataURL?.() || firmaA.current?.getBase64?.(),
      firmaProfesional: firmaH.current?.toDataURL?.() || firmaH.current?.getBase64?.(),
    });
  };
  return (
    <div className="card">
      <h3>HC-FM-05 · Versión 01 · Enero 2024</h3>
      <BuscadorPaciente onElegir={setPac} />
      {!pac && (
        <div className="card">
          <p className="hint">Si no existe, créelo aquí. Queda en la BD de esta IPS y sale en el PDF.</p>
          <div className="form-grid">
            <select value={alta.tipoDocumento} onChange={e => setAlta({ ...alta, tipoDocumento: e.target.value })}>
              <option>RC</option><option>TI</option><option>CC</option><option>CE</option><option>PE</option>
            </select>
            <input placeholder="Documento *" value={alta.documento} onChange={e => setAlta({ ...alta, documento: e.target.value })} />
            <input placeholder="Nombre *" value={alta.nombre} onChange={e => setAlta({ ...alta, nombre: e.target.value })} />
            <input placeholder="Apellido" value={alta.apellido} onChange={e => setAlta({ ...alta, apellido: e.target.value })} />
            <input placeholder="Teléfono" value={alta.telefono} onChange={e => setAlta({ ...alta, telefono: e.target.value })} />
            <input placeholder="Dirección" value={alta.direccion} onChange={e => setAlta({ ...alta, direccion: e.target.value })} />
            <input placeholder="EPS / aseguramiento" value={alta.eps} onChange={e => setAlta({ ...alta, eps: e.target.value })} />
            <select value={alta.genero} onChange={e => setAlta({ ...alta, genero: e.target.value })}><option>M</option><option>F</option></select>
            <input placeholder="Edad" value={alta.edad} onChange={e => setAlta({ ...alta, edad: e.target.value })} />
          </div>
          <button type="button" onClick={async () => {
            if (!alta.nombre || !alta.documento) return alert('Nombre y documento obligatorios');
            const { data } = await pacienteService.crear({ ...alta, edad: alta.edad ? Number(alta.edad) : null });
            setPac(data);
          }}>Registrar paciente y usarlo en la HC</button>
        </div>
      )}
      {pac && (
        <div className="card">
          <h4 style={{ background: '#edf2f7', color: '#1a365d', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>2. Identificación del paciente (se carga al buscar)</h4>
          <p><strong>{pac.nombre} {pac.apellido}</strong></p>
          <p className="hint">Tipo {pac.tipoDocumento} · No. {pac.documento} · Edad {pac.edad} · Género {pac.genero}</p>
          <p className="hint">Dir {pac.direccion} · Ciudad {pac.ciudad} · Tel {pac.telefono} · Nacimiento {pac.fechaNacimiento ? new Date(pac.fechaNacimiento).toLocaleDateString() : '—'}</p>
          <p className="hint">Aseguramiento / EPS: {pac.eps} · Acompañante {pac.contactoNombre} {pac.contactoTelefono}</p>
          <p className="hint">Ocupación {pac.ocupacion || '—'} · Estado civil {pac.estadoCivil || '—'}</p>
        </div>
      )}

      <h4 style={{ background: '#1a365d', color: '#fff', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>1. Información general</h4>
      <div className="form-grid" style={{ gap: 16, marginBottom: 16 }}>
        <label>Fecha de atención<input type="date" value={form.fechaAtencion} onChange={e => set('fechaAtencion', e.target.value)} /></label>
        <select value={form.placaMovil} onChange={e => set('placaMovil', e.target.value)}>
          <option value="">Placa móvil (ambulancias)</option>
          {moviles.map((a: any) => <option key={a.id} value={a.placa}>{a.placa} · {a.tipo} · {a.estado}</option>)}
        </select>
        <label>Hora despacho<input type="time" value={form.horaDespacho} onChange={e => set('horaDespacho', e.target.value)} /></label>
        <label>Hora llegada<input type="time" value={form.horaLlegada} onChange={e => set('horaLlegada', e.target.value)} /></label>
        <label>Hora salida<input type="time" value={form.horaSalida} onChange={e => set('horaSalida', e.target.value)} /></label>
        <label>Origen<input placeholder="Origen" value={form.origen} onChange={e => set('origen', e.target.value)} /></label>
        <label>Destino 1<input placeholder="Destino 1" value={form.destino1} onChange={e => set('destino1', e.target.value)} /></label>
        <label>Destino 2 / final<input placeholder="Destino 2 / final" value={form.destino2} onChange={e => set('destino2', e.target.value)} /></label>
        <div>
          {['Traslado','Emergencia','Urgencia','Consulta'].map(x => (
            <label key={x} className="hint"><input type="radio" name="clasif" checked={form.tipoAtencion===x} onChange={() => set('tipoAtencion', x)} /> {x}</label>
          ))}
        </div>
        <label>Conductor<input placeholder="Conductor" value={form.conductor} onChange={e => set('conductor', e.target.value)} /></label>
        <label>Tripulante / APH<input placeholder="Tripulante / APH" value={form.tripulante} onChange={e => set('tripulante', e.target.value)} /></label>
        <input placeholder="REG" value={form.registroProfesional} onChange={e => set('registroProfesional', e.target.value)} />
      </div>

      <h4 style={{ background: '#edf2f7', color: '#1a365d', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>3. Cuidados anteriores</h4>
      {chips(CUIDADOS, cuidados, setCuidados)}
      <h4 style={{ background: '#edf2f7', color: '#1a365d', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>4. Tipo de evento</h4>
      {chips(EVENTOS, eventos, setEventos)}
      <h4 style={{ background: '#edf2f7', color: '#1a365d', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>5.1 Urgencia médica</h4>
      {chips(MOT_MED, motMed, setMotMed)}
      <h4 style={{ background: '#edf2f7', color: '#1a365d', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>5.2 Urgencia traumática</h4>
      {chips(MOT_TRA, motTra, setMotTra)}

      <h4 style={{ background: '#edf2f7', color: '#1a365d', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>6. Antecedentes</h4>
      <div className="form-grid">
        <label>Patologías <select value={form.antecedentesPersonales} onChange={e => set('antecedentesPersonales', e.target.value)}><option>NO</option><option>SI</option></select></label>
        <label>Cirugías <select value={form.antecedentesQuirurgicos} onChange={e => set('antecedentesQuirurgicos', e.target.value)}><option>NO</option><option>SI</option></select></label>
        <label>Medicamentos <select value={form.medicamentosActuales} onChange={e => set('medicamentosActuales', e.target.value)}><option>NO</option><option>SI</option></select></label>
        <label>Alergias <select value={form.alergias} onChange={e => set('alergias', e.target.value)}><option>NO</option><option>SI</option></select></label>
        <label>Fumador <select value={form.fumador} onChange={e => set('fumador', e.target.value)}><option>NO</option><option>SI</option></select></label>
        <label>Alcohol <select value={form.alcohol} onChange={e => set('alcohol', e.target.value)}><option>NO</option><option>SI</option></select></label>
        <label>SPA <select value={form.spa} onChange={e => set('spa', e.target.value)}><option>NO</option><option>SI</option></select></label>
      </div>
      <h4>Localización de lesiones</h4>
      {chips(LESIONES, lesiones, setLesiones)}

      <h4 style={{ background: '#edf2f7', color: '#1a365d', padding: '10px 16px', borderRadius: 6, marginTop: 20, fontWeight: 600 }}>7. Examen físico (toma 1 y toma 2)</h4>
      <div className="form-grid">
        <input placeholder="TA" value={form.ta} onChange={e => set('ta', e.target.value)} />
        <input placeholder="FC" value={form.fc} onChange={e => set('fc', e.target.value)} />
        <input placeholder="FR" value={form.fr} onChange={e => set('fr', e.target.value)} />
        <input placeholder="Sat O2 %" value={form.spo2} onChange={e => set('spo2', e.target.value)} />
        <input placeholder="Temperatura" value={form.temp} onChange={e => set('temp', e.target.value)} />
        <input placeholder="Glucometría" value={form.glucometria} onChange={e => set('glucometria', e.target.value)} />
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
        <input placeholder="Peso" value={form.peso} onChange={e => set('peso', e.target.value)} />
        <input placeholder="Talla" value={form.talla} onChange={e => set('talla', e.target.value)} />
        <input placeholder="TA 2" value={form.ta2} onChange={e => set('ta2', e.target.value)} />
        <input placeholder="FC 2" value={form.fc2} onChange={e => set('fc2', e.target.value)} />
        <input placeholder="Sat 2" value={form.spo2b} onChange={e => set('spo2b', e.target.value)} />
        <input placeholder="Glasgow 2" value={form.glasgow2} onChange={e => set('glasgow2', e.target.value)} />
      </div>

      <h4>Página 2 — Evolución y procedimientos</h4>
      <textarea rows={8} style={{width:"100%",minHeight:140}} placeholder="Evolución (escribe todo el detalle de la atención)" value={form.evolucion} onChange={e => set('evolucion', e.target.value)} />
      <h4>8. Tratamiento X / A / B / C / D / E</h4>
      {chips([...TRAT_X, ...TRAT_A, ...TRAT_B, ...TRAT_C, ...TRAT_D, ...TRAT_E, ...OTROS], trat, setTrat)}
      <h4>9. Tratamiento avanzado</h4>
      {chips(TRAT_AV, trat, setTrat)}
      <textarea rows={6} style={{width:"100%",minHeight:100}} placeholder="Detalle de tratamiento / litros / joules / cantidad" value={form.tratamiento} onChange={e => set('tratamiento', e.target.value)} />

      <h4>10–13. Traslado, resultado, complicaciones y entrega</h4>
      <div className="form-grid">
        <select value={form.instruccion} onChange={e => set('instruccion', e.target.value)}>
          <option value="">10. Instrucción de traslado</option>
          <option>Vía radio</option><option>Vía celular</option><option>Vía telefónica</option>
          <option>Médico presente</option><option>MD no disponible</option>
          <option>TAPH presente</option><option>TPAPH presente</option>
          <option>Otro personal de salud</option><option>Protocolo</option>
        </select>
        <select value={form.resultado} onChange={e => set('resultado', e.target.value)}>
          <option value="">11. Resultado</option>
          <option>Paciente niega atención</option><option>Transporte al hospital</option>
          <option>Dado alta en sitio</option><option>Paciente niega transporte</option>
          <option>Reconocimiento/Evaluación</option><option>Reanimación exitosa</option>
          <option>Muerte durante atención</option><option>Hallado cadáver</option>
          <option>Traslado programado</option>
        </select>
        <input placeholder="Nombre quien asigna traslado" value={form.asignaTraslado} onChange={e => set('asignaTraslado', e.target.value)} />
        <input placeholder="13. Institución que recibe" value={form.destinoPaciente} onChange={e => set('destinoPaciente', e.target.value)} />
        <input placeholder="CIE-10" value={form.cie10Principal} onChange={e => set('cie10Principal', e.target.value)} />
      </div>
      <textarea rows={5} style={{width:"100%",minHeight:90}} placeholder="12. Complicaciones durante traslado" value={form.complicaciones} onChange={e => set('complicaciones', e.target.value)} />

            <h4>Acompañante / responsable</h4>
      <div className="form-grid">
        <input placeholder="Nombre del acompañante" value={form.nombreAcompanante} onChange={e => set('nombreAcompanante', e.target.value)} />
        <input placeholder="Cédula del acompañante *" value={form.docAcompanante} onChange={e => set('docAcompanante', e.target.value)} />
      </div>
      <SignaturePad ref={firmaP} label="Firma del paciente" />
      <SignaturePad ref={firmaA} label="Firma del acompañante / responsable" />
      <SignaturePad ref={firmaH} label="Talento humano que traslada" />
      <div className="toolbar">
        <button className="btn-primary" onClick={validar}>Guardar HC y generar PDF</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
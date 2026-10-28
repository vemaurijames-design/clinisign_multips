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
  const [errorLista, setErrorLista] = useState('');
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState('');
  const [buscado, setBuscado] = useState('');
  const { rol } = useAuth();
  const cargar = async () => {
    setCargando(true);
    setErrorLista('');
    try {
      const hcs = await historiaClinicaService.listar();
      const datos = Array.isArray(hcs.data) ? hcs.data : [];
      setHistorias(datos.sort((a: any, b: any) => new Date(a.fechaAtencion || 0).getTime() - new Date(b.fechaAtencion || 0).getTime()));
    } catch (error: any) {
      setHistorias([]);
      const mensaje = error?.response?.data?.message || error?.response?.data?.error;
      setErrorLista(typeof mensaje === 'string' ? mensaje : 'No se pudieron cargar las historias clínicas. Verifique la conexión y el esquema de la base de datos.');
    } finally {
      setCargando(false);
    }
  };
  const cambiarEstado = async (hc: any, activar: boolean) => {
    const accion = activar ? 'activar' : 'anular';
    const pregunta = activar
      ? '¿Activar nuevamente esta historia clínica?'
      : '¿Anular esta historia clínica? Quedará registrada en la bitácora.';
    if (!confirm(pregunta)) return;

    try {
      if (activar) {
        await historiaClinicaService.activar(hc.id);
      } else {
        await historiaClinicaService.eliminar(hc.id);
      }
      await cargar();
      alert(activar ? 'Historia clínica activada correctamente.' : 'Historia clínica anulada correctamente.');
    } catch (error: any) {
      const mensaje = error?.response?.data?.message || error?.response?.data?.error;
      alert(`No se pudo ${accion} la historia clínica. ${typeof mensaje === 'string' ? mensaje : 'Verifica tu permiso e inténtalo de nuevo.'}`);
    }
  };
  useEffect(() => { void cargar(); }, []);
  const filtrados = historias.filter(hc => !buscado || `${hc.paciente?.nombre} ${hc.paciente?.apellido} ${hc.paciente?.documento}`.toLowerCase().includes(buscado.toLowerCase()));
  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const vis = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);
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
      {errorLista && <div role="alert" style={{ margin: '12px 0', padding: 12, border: '1px solid #e59a9a', borderRadius: 8, background: '#fff1f1', color: '#8a1c1c' }}>
        <strong>No fue posible cargar las historias clínicas.</strong><br />{errorLista}{' '}
        <button type="button" onClick={() => void cargar()}>Reintentar</button>
      </div>}
      {showForm && <HCForm onSave={async (data: any) => {
        await historiaClinicaService.crear(data); localStorage.removeItem('hc_borrador'); setShowForm(false); await cargar();
      }} onCancel={() => setShowForm(false)} />}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Consec.</th><th>Fecha</th><th>Paciente</th><th>Clasificación</th><th>Motivo</th><th>Profesional</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {cargando ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Cargando historias clínicas…</td></tr>
              : errorLista ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>La lista no está disponible hasta corregir el error.</td></tr>
              : vis.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>No hay historias clínicas para mostrar.</td></tr>
              : vis.map(hc => (
              <tr key={hc.id}>
                <td style={{fontFamily:'monospace',fontWeight:500}}>{hc.codigo || 'HC-FM-05-' + String(hc.consecutivo || 0).padStart(4, '0')}</td><td>{hc.fechaAtencion ? new Date(hc.fechaAtencion).toLocaleString() : ''}</td>
                <td>{hc.paciente?.nombre} {hc.paciente?.apellido} {hc.paciente?.documento}</td>
                <td>{hc.tipoAtencion}</td>
                <td>{hc.motivoConsulta?.substring(0, 60)}</td>
                <td style={{fontWeight:500}}>
                  <div>{hc.nombreProfesional || hc.profesional || '—'}</div>
                  {hc.registroProfesional && <div style={{fontSize:11,color:'#666'}}>REG: {hc.registroProfesional}</div>}
                </td><td style={{color: hc.activo === false ? 'red' : 'green'}}>{hc.activo === false ? 'Anulado' : 'Activo'}</td>
                <td>
                  <a href={historiaClinicaService.pdfUrl(hc.id)} target="_blank" rel="noreferrer"><button>PDF</button></a>
                  {['SUPERADMIN','ADMINIPS','RADIOPERADOR'].includes(rol) && hc.activo !== false && <button type="button" onClick={() => void cambiarEstado(hc, false)}>Anular</button>}
                  {['SUPERADMIN','ADMINIPS','RADIOPERADOR'].includes(rol) && hc.activo === false && <button type="button" onClick={() => void cambiarEstado(hc, true)} style={{background:'#1a9f5c',color:'#fff'}}>Activar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{position:'fixed',bottom:40,left:260,right:0,background:'linear-gradient(180deg,#f8f9fa 0%,#fff 100%)',borderTop:'1px solid #e8e8e8',padding:'14px 24px',display:'flex',justifyContent:'center',alignItems:'center',gap:20,zIndex:100}}>
          <span style={{color:'#1a5fb4',fontSize:13,fontWeight:500}}>{errorLista ? 'Lista no disponible' : cargando ? 'Cargando…' : `${filtrados.length} registros`}</span>
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={{padding:'8px 20px',borderRadius:8,border:'none',background:pagina===1?'#e8e8e8':'#1a5fb4',color:pagina===1?'#999':'#fff',cursor:pagina===1?'not-allowed':'pointer',fontWeight:500,fontSize:13}}>← Anterior</button>
          <span style={{fontWeight:600,color:'#333',fontSize:14}}>Página {pagina} de {totalPaginas || 1}</span>
          <button disabled={pagina === totalPaginas || totalPaginas === 0} onClick={() => setPagina(p => p + 1)} style={{padding:'8px 20px',borderRadius:8,border:'none',background:(pagina===totalPaginas||totalPaginas===0)?'#e8e8e8':'#1a5fb4',color:(pagina===totalPaginas||totalPaginas===0)?'#999':'#fff',cursor:(pagina===totalPaginas||totalPaginas===0)?'not-allowed':'pointer',fontWeight:500,fontSize:13}}>Siguiente →</button>
        </div>
        <div style={{height:60}}></div>
      </div>
    </div>
  );
}

function HCForm({ onSave, onCancel }: any) {
  const { nombre, email } = useAuth();
  const now = new Date();
  const [pac, setPac] = useState<any>(null);
  const [alta, setAlta] = useState({ nombre: '', apellido: '', documento: '', telefono: '', tipoDocumento: 'CC', direccion: '', eps: '', genero: 'M', edad: '', fechaNacimiento: '', ocupacion: '', estadoCivil: '' });

  const [form, setForm] = useState<any>({
    fechaAtencion: now.toISOString().slice(0, 10),
    horaAtencion: now.toTimeString().slice(0, 5),
    horaDespacho: now.toTimeString().slice(0, 5),
    horaLlegada: now.toTimeString().slice(0, 5),
    horaSalida: now.toTimeString().slice(0, 5),
    placaMovil: '', origen: '', destino1: '', destino2: '',
    tipoAtencion: 'Urgencia', conductor: '', tripulante: '', tipoAseguramiento: '', tipoTraslado: '',
    ta: '', fc: '', fr: '', temp: '', spo2: '', glasgow: '', glucometria: '',
    ta2: '', fc2: '', fr2: '', temp2: '', spo2b: '', glasgow2: '',
    taEntrega: '', fcEntrega: '', frEntrega: '', spo2Entrega: '', tempEntrega: '', glucEntrega: '', glasgowEntrega: '',
    nombreEntrega: '', cedulaEntrega: '', nombreReceptor: '', cedulaReceptor: '',
    viaAerea: 'Permeable', respiracion: 'Normal', circulacion: 'Estable',
    piel: 'Normal', hemo: 'Estable', peso: '', talla: '',
    alergias: 'NO', medicamentosActuales: 'NO', antecedentesPersonales: 'NO',
    antecedentesQuirurgicos: 'NO', fumador: 'NO', alcohol: 'NO', spa: 'NO',
    cie10Principal: '', tratamiento: '', evolucion: '', destinoPaciente: '',
    instruccion: '', resultado: '', docAcompanante: '', nombreAcompanante: '', parentescoAcompanante: '', complicaciones: '', asignaTraslado: '',
    nombreProfesional: '', registroProfesional: '',
  });
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
    if (k === 'profesional' && !form.nombreEntrega) next.nombreEntrega = v;
    if (k === 'cedulaProfesional' && !form.cedulaEntrega) next.cedulaEntrega = v;
    setForm(next);
    try { localStorage.setItem('hc_borrador', JSON.stringify(next)); } catch {}
  };
  useEffect(() => {
    const enviarBorrador = async () => {
      const saved = localStorage.getItem('hc_borrador');
      if (saved && navigator.onLine) {
        try {
          const data = JSON.parse(saved);
          if (data.pacienteId) {
            await historiaClinicaService.crear(data);
            localStorage.removeItem('hc_borrador');
            alert('✓ Historia clínica enviada automáticamente\n\nSe restauró la conexión.');
          }
        } catch {}
      }
    };
    window.addEventListener('online', enviarBorrador);
    return () => window.removeEventListener('online', enviarBorrador);
  }, []);
  const validar = async () => {
    if (!pac?.id) return alert('Busque y elija el paciente');
    if (!form.ta || !form.fc) return alert('TA y FC del examen físico son obligatorios');
    if (!form.profesional?.trim()) return alert('El nombre del profesional es obligatorio');
    if (!form.cedulaProfesional?.trim()) return alert('La cédula del profesional es obligatoria');
    if (!form.registroProfesional?.trim()) return alert('El registro profesional es obligatorio');
    if (!confirm('Este documento contiene información confidencial del paciente conforme a la Ley 1581 de 2012 y la Resolución 1995 de 1999.\n\n¿Autoriza guardar y generar el PDF?')) return;
    const firmas = [
      firmaP.current?.toDataURL?.() || '',
      firmaA.current?.toDataURL?.() || '',
      firmaH.current?.toDataURL?.() || ''
    ];
    const totalSize = firmas.reduce((acc, f) => acc + (f.length * 0.75), 0);
    if (totalSize > 2 * 1024 * 1024) {
      return alert('Las firmas exceden 2MB. Reduzca el tamaño de las imágenes.');
    }
    if (!navigator.onLine) {
      const draft = { pac, form, timestamp: Date.now() };
      localStorage.setItem('hc_pending_' + Date.now(), JSON.stringify(draft));
      alert('No tienes internet.\n\nSe guardó la historia clínica en borrador.\nSe enviará automáticamente cuando haya conexión.');
      return;
    }
    try {
      await onSave({
        ...form,
        nombreProfesional: form.profesional,
        registroProfesional: form.registroProfesional,
        pacienteId: pac.id,
        motivoConsulta: [...motMed, ...motTra].join('; ') || form.tipoAtencion,
        procedimientosRealizados: trat.join('; '),
        enfermedadActual: `Eventos: ${eventos.join(', ')}. Cuidados: ${cuidados.join(', ')}. Lesiones: ${lesiones.join(', ')}.`,
        detalleJson: JSON.stringify({ eventos, motMed, motTra, cuidados, lesiones, trat, placa: form.placaMovil, origen: form.origen, instruccion: form.instruccion, resultado: form.resultado, complicaciones: form.complicaciones, docAcompanante: form.docAcompanante, nombreAcompanante: form.nombreAcompanante || pac?.contactoNombre, parentescoAcompanante: form.parentescoAcompanante }),
        firmaPaciente: firmaP.current?.toDataURL?.() || firmaP.current?.getBase64?.(),
        firmaAcompanante: firmaA.current?.toDataURL?.() || firmaA.current?.getBase64?.(),
        firmaProfesional: firmaH.current?.toDataURL?.() || firmaH.current?.getBase64?.(),
      });
      alert('✓ Historia clínica guardada correctamente\n\nPaciente: ' + (pac?.nombre || '') + ' ' + (pac?.apellido || '') + '\n\nEl PDF está disponible en la lista.');
    } catch (e: any) {
      alert('✗ Error al guardar\n\n' + (e.response?.data?.message || 'Intente nuevamente'));
    }
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
            <select value={alta.eps} onChange={e => setAlta({ ...alta, eps: e.target.value })}>
              <option value="">Tipo aseguramiento</option>
              <option>SISBEN</option><option>SOAT</option><option>EPS</option><option>PARTICULAR</option><option>ARL</option><option>FOSYGA</option><option>PREPAGADA</option><option>NINGUNO</option>
            </select>
            <select value={alta.genero} onChange={e => setAlta({ ...alta, genero: e.target.value })}><option>M</option><option>F</option></select>
            <input placeholder="Edad" value={alta.edad} onChange={e => setAlta({ ...alta, edad: e.target.value })} />
            <input type="date" placeholder="Fecha nacimiento" value={alta.fechaNacimiento} onChange={e => setAlta({ ...alta, fechaNacimiento: e.target.value })} />
            <input placeholder="Ocupación" value={alta.ocupacion} onChange={e => setAlta({ ...alta, ocupacion: e.target.value })} />
            <select value={alta.estadoCivil} onChange={e => setAlta({ ...alta, estadoCivil: e.target.value })}>
              <option value="">Estado civil</option>
              <option>Soltero</option><option>Casado</option><option>Unión libre</option><option>Divorciado</option><option>Viudo</option>
            </select>
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
        <label>Tipo traslado
          <select value={form.tipoTraslado} onChange={e => set('tipoTraslado', e.target.value)}>
            <option value="">Seleccione</option>
            <option>TAB-SENCILLO</option><option>TAB-DOBLE</option><option>TAM-SENCILLO</option><option>TAM-DOBLE</option>
          </select>
        </label>
        <label>Conductor<input placeholder="Conductor" value={form.conductor} onChange={e => set('conductor', e.target.value)} /></label>
        <label>Tripulante / APH<input placeholder="Tripulante / APH" value={form.tripulante} onChange={e => set('tripulante', e.target.value)} /></label>
        <label>Nombre del profesional (*)<input placeholder="Nombre completo" value={form.profesional} onChange={e => set('profesional', e.target.value)} /></label>
        <label>Cédula del profesional (*)<input placeholder="Número de cédula" value={form.cedulaProfesional} onChange={e => set('cedulaProfesional', e.target.value)} /></label>
        <label>Registro profesional (*)<input placeholder="Registro médico" value={form.registroProfesional} onChange={e => set('registroProfesional', e.target.value)} /></label>
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
      <textarea rows={12} style={{width:"100%",minHeight:200}} placeholder="Evolución (escribe todo el detalle de la atención)" value={form.evolucion} onChange={e => set('evolucion', e.target.value)} />
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

      <h4>13. Entrega del paciente</h4>
      <div className="form-grid">
        <input placeholder="Presión arterial entrega" value={form.taEntrega} onChange={e => set('taEntrega', e.target.value)} />
        <input placeholder="Frecuencia cardíaca entrega" value={form.fcEntrega} onChange={e => set('fcEntrega', e.target.value)} />
        <input placeholder="Frecuencia respiratoria entrega" value={form.frEntrega} onChange={e => set('frEntrega', e.target.value)} />
        <input placeholder="Saturación O2% entrega" value={form.spo2Entrega} onChange={e => set('spo2Entrega', e.target.value)} />
        <input placeholder="Temperatura entrega" value={form.tempEntrega} onChange={e => set('tempEntrega', e.target.value)} />
        <input placeholder="Glucometría entrega" value={form.glucEntrega} onChange={e => set('glucEntrega', e.target.value)} />
        <input placeholder="Glasgow entrega" value={form.glasgowEntrega} onChange={e => set('glasgowEntrega', e.target.value)} />
      </div>
      <h4>Personal que entrega</h4>
      <div className="form-grid">
        <input placeholder="Nombre quien entrega (*)" value={form.nombreEntrega} onChange={e => set('nombreEntrega', e.target.value)} />
        <input placeholder="Cédula quien entrega (*)" value={form.cedulaEntrega} onChange={e => set('cedulaEntrega', e.target.value)} />
      </div>
      <h4>Personal que recibe</h4>
      <div className="form-grid">
        <input placeholder="Nombre quien recibe" value={form.nombreReceptor} onChange={e => set('nombreReceptor', e.target.value)} />
        <input placeholder="Cédula quien recibe" value={form.cedulaReceptor} onChange={e => set('cedulaReceptor', e.target.value)} />
      </div>

      <h4>Acompañante / responsable</h4>
      <div className="form-grid">
        <input placeholder="Nombre del acompañante" value={form.nombreAcompanante} onChange={e => set('nombreAcompanante', e.target.value)} />
        <input placeholder="Cédula del acompañante *" value={form.docAcompanante} onChange={e => set('docAcompanante', e.target.value)} />
        <input placeholder="Parentesco" value={form.parentescoAcompanante} onChange={e => set('parentescoAcompanante', e.target.value)} />
      </div>
      <SignaturePad ref={firmaP} label="Firma del paciente" />
      <SignaturePad ref={firmaA} label="Firma del acompañante / responsable" />
      <SignaturePad ref={firmaH} label="Talento humano que traslada" />
      <div className="toolbar">
        <button className="btn-primary" onClick={validar}>Guardar HC y generar PDF</button>
        <button type="button" onClick={() => {
          if (confirm('¿Borrar todos los datos del formulario?')) {
            setForm({
              tipoAtencion: 'TAB', lugarAtencion: '', origen: '', destino1: '', destino2: '',
              horaDespacho: '', horaLlegada: '', horaSalida: '', placaMovil: '', conductor: '', tripulante: '',
              ta: '', fc: '', fr: '', temp: '', spo2: '', glasgow: '', glucometria: '',
              ta2: '', fc2: '', fr2: '', temp2: '', spo2b: '', glasgow2: '',
              taEntrega: '', fcEntrega: '', frEntrega: '', spo2Entrega: '', tempEntrega: '', glucEntrega: '', glasgowEntrega: '',
              nombreEntrega: '', cedulaEntrega: '', nombreReceptor: '', cedulaReceptor: '',
              piel: '', hemo: '', viaAerea: '', respiracion: '', circulacion: '',
              evolucion: '', tratamiento: '', medicamentosAdministrados: '',
              cie10Principal: '', destinoPaciente: '', recomendaciones: '',
              nombreProfesional: '', registroProfesional: '', profesional: '', cedulaProfesional: '',
              nombreAcompanante: '', docAcompanante: '', parentescoAcompanante: '',
              antecedentesPersonales: '', antecedentesQuirurgicos: '', medicamentosActuales: '',
              alergias: '', fumador: '', alcohol: '', spa: '',
            });
            firmaP.current?.clear?.();
            firmaA.current?.clear?.();
            firmaH.current?.clear?.();
            alert('✓ Formulario limpiado');
          }
        }} style={{marginLeft:8,background:'#dc3545',color:'#fff'}}>Limpiar formulario</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
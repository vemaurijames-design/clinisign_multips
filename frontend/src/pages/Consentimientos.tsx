import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { consentimientoService, pacienteService, plantillaService } from '../services/rest';
import SignaturePad from '../components/SignaturePad';
import BuscadorPaciente from '../components/BuscadorPaciente';
import { useAuth } from '../context/AuthContext';

const CONS = [
  'Inmovilización y traslado en camilla',
  'Administración de oxígeno',
  'Administración de medicamentos (líquidos endovenosos, entre otros)',
  'Traslado y transporte',
];
const DES = [
  'Inmovilización y traslado en camilla',
  'Administración de medicamentos',
  'Administración de oxígeno',
  'Atención y Traslado',
];

export default function Consentimientos() {
  const [params] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<'CONSENTIMIENTO' | 'DESISTIMIENTO'>('CONSENTIMIENTO');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const cargar = () => consentimientoService.listar().then(r => setItems(r.data || [])).catch(() => setItems([]));
  useEffect(() => { cargar(); }, []);
  useEffect(() => {
    const t = (params.get('tipo') || '').toUpperCase();
    if (t === 'CONSENTIMIENTO' || t === 'DESISTIMIENTO') {
      setTipoNuevo(t);
      setShow(true);
    }
  }, [params]);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Consentimiento y desistimiento</h2>
          <p className="hint">Se carga la plantilla ACTIVA de esta IPS. El auxiliar solo llena paciente y firma; el texto legal sale de esa plantilla. Luego se genera el PDF.</p>
        </div>
        <div className="toolbar">
          <button className="btn-primary" onClick={() => { setTipoNuevo('CONSENTIMIENTO'); setShow(true); }}>Consentimiento HC-FM-04</button>
          <button onClick={() => { setTipoNuevo('DESISTIMIENTO'); setShow(true); }}>Desistimiento HC-FM-06</button>
        </div>
      </div>
      {show && <DocumentoSian tipo={tipoNuevo} onDone={() => { setShow(false); cargar(); }} onCancel={() => setShow(false)} />}
      <div className="toolbar">
        <input placeholder="Buscar por cédula o tipo" value={filtro} onChange={e => setFiltro(e.target.value)} />
        <button type="button" className="btn-primary">Buscar</button>
      </div>
      {pdfUrl && (
        <div className="card">
          <iframe className="pdf-frame" src={pdfUrl} title="PDF" />
          <a href={pdfUrl} target="_blank" rel="noreferrer"><button>Abrir / imprimir</button></a>
          <button onClick={() => setPdfUrl(null)}>Cerrar</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Consecutivo</th><th>Tipo</th><th>Código</th><th>Documento</th><th>Firmado</th><th>Correo</th><th></th></tr></thead>
          <tbody>
            {items.filter(c => !filtro || JSON.stringify(c).toLowerCase().includes(filtro.toLowerCase())).map(c => (
              <tr key={c.id}>
                <td>{c.codigo}-{String(c.consecutivo || c.id).padStart(4, '0')}</td>
                <td>{c.tipo}</td><td>{c.codigo}</td><td>{c.documento}</td>
                <td>{c.firmado ? 'Sí' : 'No'}</td>
                <td>{c.correoEnviado ? c.correoDestino : '—'}</td>
                <td>
                  <button onClick={() => setPdfUrl(consentimientoService.pdfUrl(c.id))}>Ver PDF</button>
                  <button onClick={async () => {
                    const correo = prompt('Correo de la clínica (vacío = correo institucional de la IPS)') || '';
                    try {
                      await consentimientoService.enviar(c.id, correo);
                      alert('Correo enviado.');
                      cargar();
                    } catch (e: any) {
                      alert(e.response?.data?.message || 'No se envió. Revise SMTP en Configuración IPS.');
                    }
                  }}>Enviar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentoSian({ tipo, onDone, onCancel }: { tipo: string; onDone: () => void; onCancel: () => void }) {
  const { nombre, email, rol, ipsNombre } = useAuth();
  const [pac, setPac] = useState<any>(null);
  const [alta, setAlta] = useState({ nombre: '', apellido: '', documento: '', telefono: '', tipoDocumento: 'CC' });
  const [calidad, setCalidad] = useState('Paciente');
  const [responsableDe, setResponsableDe] = useState('');
  const [otro, setOtro] = useState('');
  const [procs, setProcs] = useState<string[]>([]);
  const [acomp, setAcomp] = useState('');
  const [aux, setAux] = useState(nombre || '');
  const [reg, setReg] = useState('');
  const [docAux, setDocAux] = useState('');
  const [leido, setLeido] = useState(false);
  const [hora] = useState(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
  const [fecha] = useState(new Date().toLocaleDateString('es-CO'));
  const firmaRef = useRef<any>(null);
  const huellaRef = useRef<any>(null);
  const lista = tipo === 'DESISTIMIENTO' ? DES : CONS;
  const [plantilla, setPlantilla] = useState<any>(null);
  const codigo = plantilla?.codigo || (tipo === 'DESISTIMIENTO' ? 'HC-FM-06' : 'HC-FM-04');
  useEffect(() => {
    plantillaService.porTipo(tipo).then(r => setPlantilla(r.data)).catch(() => setPlantilla(null));
  }, [tipo]);

  const crearPac = async () => {
    if (!alta.nombre || !alta.documento) return alert('Nombre y documento obligatorios');
    const { data } = await pacienteService.crear(alta);
    setPac(data);
  };

  const guardar = async () => {
    if (!pac) return alert('Busque o cree el paciente');
    if (!leido) return alert('Debe confirmar que el paciente leyó el documento');
    const firma = firmaRef.current?.toDataURL?.() || firmaRef.current?.getBase64?.();
    if (!firma || String(firma).length < 80) {
      return alert('Firme en el recuadro azul: mantenga presionado y dibuje.');
    }
    await consentimientoService.crear({
      tipo,
      codigo,
      plantillaId: plantilla?.id,
      beneficios: plantilla?.beneficios,
      riesgos: plantilla?.riesgos,
      alternativas: plantilla?.alternativas,
      observaciones: plantilla?.textoLegal,
      documento: pac.documento,
      telefono: pac.telefono,
      calidad: calidad + (responsableDe ? ' de ' + responsableDe : ''),
      procedimientos: [...procs, otro].filter(Boolean).join('; '),
      nombreAcompanante: acomp,
      nombreAuxiliar: aux,
      registroAuxiliar: reg,
      documentoAcompanante: docAux,
      firma,
      huellaDigital: huellaRef.current?.toDataURL?.() || huellaRef.current?.getBase64?.(),
      firmado: true,
    });
    onDone();
  };

  return (
    <div className="doc-sian">
      <div className="doc-sian-head">
        <div style={{ padding: 8, fontWeight: 700, color: '#0b63c8' }}>{ipsNombre || 'SIAN SALUD'}</div>
        <h2>{tipo === 'DESISTIMIENTO' ? 'DESISTIMIENTO INFORMADO' : 'CONSENTIMIENTO INFORMADO'}</h2>
        <div className="doc-sian-meta">
          CÓDIGO: {codigo}<br />VERSIÓN: {plantilla?.version || '01'}<br />
          {plantilla ? `Plantilla IPS: ${plantilla.nombre}` : 'Texto SIAN por defecto'}
        </div>
      </div>

      <BuscadorPaciente onElegir={p => setPac(p)} />
      {pac ? (
        <p><strong>Paciente cargado:</strong> {pac.nombre} {pac.apellido} · {pac.tipoDocumento} {pac.documento} · Tel {pac.telefono}</p>
      ) : (
        <>
          <p className="hint">Si no existe, créelo y queda ligado al documento.</p>
          <div className="form-grid">
            <input placeholder="Nombre *" value={alta.nombre} onChange={e => setAlta({ ...alta, nombre: e.target.value })} />
            <input placeholder="Apellido" value={alta.apellido} onChange={e => setAlta({ ...alta, apellido: e.target.value })} />
            <input placeholder="Documento *" value={alta.documento} onChange={e => setAlta({ ...alta, documento: e.target.value })} />
            <input placeholder="Teléfono" value={alta.telefono} onChange={e => setAlta({ ...alta, telefono: e.target.value })} />
          </div>
          <button type="button" onClick={crearPac}>Registrar paciente</button>
        </>
      )}

      <div className="form-grid">
        <label>Fecha<input className="linea" readOnly value={fecha} /></label>
        <label>Hora<input className="linea" readOnly value={hora} /></label>
      </div>
      <label>Yo
        <input className="linea" readOnly value={pac ? `${pac.nombre || ''} ${pac.apellido || ''}` : ''} placeholder="Nombre completo del paciente" />
      </label>
      <label>Identificado con documento de identidad número
        <input className="linea" readOnly value={pac?.documento || ''} />
      </label>
      <div className="form-grid">
        <label>En calidad de
          <select className="linea" value={calidad} onChange={e => setCalidad(e.target.value)}>
            <option>Paciente</option><option>Acompañante</option><option>Familiar</option><option>Responsable</option>
          </select>
        </label>
        <label>Responsable de
          <input className="linea" value={responsableDe} onChange={e => setResponsableDe(e.target.value)} />
        </label>
      </div>

      {tipo === 'CONSENTIMIENTO' ? (
        <>
          <p className="legal">{plantilla?.textoLegal || `Con el presente documento doy fe y declaro: que he sido informado por el Auxiliar de Enfermería/APH de ${ipsNombre || 'Sian Salud SAS'} sobre los procedimientos requeridos para mi atención:`}</p>
          <div className="checks">
            {lista.map(p => (
              <label key={p}><input type="checkbox" checked={procs.includes(p)} onChange={e => setProcs(e.target.checked ? [...procs, p] : procs.filter(x => x !== p))} /> {p}</label>
            ))}
          </div>
          <label>Otro<input className="linea" value={otro} onChange={e => setOtro(e.target.value)} /></label>
          <div className="bloque">
            <h3>Beneficios</h3>
            <p className="legal">{plantilla?.beneficios || 'El traslado se hace en ambulancia de transporte asistencial de baja complejidad, voy a estar acompañado por personal Auxiliar de enfermería/APH y un conductor debidamente entrenado. El vehículo dispone del material y medicación necesaria para atender al paciente y restablecer las funciones vitales en situaciones críticas. Puedo tener un acompañante mayor de edad. Disminución de riesgos de lesiones y de tiempos de llegada.'}</p>
          </div>
          <div className="bloque">
            <h3>Alternativas</h3>
            <p className="legal">No aceptar el traslado. Ser llevado por otro prestador. Ser llevado por un familiar en vehículo propio. Ser llevado en un medio de transporte público.</p>
          </div>
          <div className="bloque">
            <h3>Riesgos</h3>
            <p className="legal">Durante el traslado pueden surgir complicaciones que conlleven a detener la ambulancia. Riesgos del propio transporte (vibraciones, aceleración, desaceleración, accidente, avería). Caídas, traumas, mareos, vómito, agudización del diagnóstico, muerte.</p>
          </div>
          <div className="bloque">
            <h3>Implicaciones</h3>
            <p className="legal">Demora en el traslado o ubicación y tiempo prolongado en la camilla. Efecto en la salud mental por ambiente cerrado o sonidos del vehículo y la atención.</p>
          </div>
          <p className="legal">Dejo constancia de haber comprendido la información y acepto que dichos procedimientos se realicen por el personal Auxiliar de Enfermería/APH de {ipsNombre || 'Sian Salud SAS'}, acorde a la Resolución 3100 de 2019. Autorizo el traslado a un centro asistencial si fuere necesario. Historia clínica reservada (Ley 23 de 1981, Res. 1995 de 1999). Datos personales Ley 1581 de 2012.</p>
        </>
      ) : (
        <>
          <p className="legal">En el presente documento manifiesto que he sido informado por el personal Auxiliar de Enfermería/APH de {ipsNombre || 'Sian Salud SAS'} sobre mis problemas de salud o los de mi representado, alternativas, complicaciones, riesgos y beneficios, y los riesgos del no tratamiento.</p>
          <p className="legal"><strong>DECIDO CONSCIENTEMENTE NO SOMETERME</strong> a los siguientes procedimientos sugeridos:</p>
          <div className="checks">
            {lista.map(p => (
              <label key={p}><input type="checkbox" checked={procs.includes(p)} onChange={e => setProcs(e.target.checked ? [...procs, p] : procs.filter(x => x !== p))} /> {p}</label>
            ))}
          </div>
          <label>Otros<input className="linea" value={otro} onChange={e => setOtro(e.target.value)} /></label>
          <p className="legal"><strong>ASUMO LOS RIESGOS DE NO TRASLADO BAJO MI PROPIA RESPONSABILIDAD.</strong> La historia clínica es documento privado sometido a reserva. Acepto que el personal profesional y de auditoría acceda al reporte de atención TAB.</p>
        </>
      )}

      <label className="hint"><input type="checkbox" checked={leido} onChange={e => setLeido(e.target.checked)} /> El paciente leyó y comprendió este documento</label>
      <SignaturePad ref={firmaRef} label="Firma del paciente (*)" />
      <SignaturePad ref={huellaRef} label="Huella digital" />
      <label>Acompañante mayor de edad responsable (*)<input className="linea" value={acomp} onChange={e => setAcomp(e.target.value)} /></label>
      <p className="hint">Usuario que registra este documento: <strong>{nombre}</strong> · {rol} · {email}. El APH se precarga con la sesión.</p>
      <label>Auxiliar de Enfermería/APH que transporta (*)<input className="linea" value={aux} onChange={e => setAux(e.target.value)} /></label>
      <div className="form-grid">
        <input className="linea" placeholder="Documento APH" value={docAux} onChange={e => setDocAux(e.target.value)} />
        <input className="linea" placeholder="Registro" value={reg} onChange={e => setReg(e.target.value)} />
      </div>
      <div className="toolbar">
        <button className="btn-primary" onClick={guardar}>Guardar, generar PDF y almacenar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { consentimientoService, pacienteService, plantillaService } from '../services/rest';
import SignaturePad from '../components/SignaturePad';
import BuscadorPaciente from '../components/BuscadorPaciente';
import { addPending, offlineMessage } from '../utils/offlineQueue';
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
  const { rol } = useAuth();
  const [params] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;
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

  const isConsentActive = show && tipoNuevo === 'CONSENTIMIENTO';
  const isDesistActive = show && tipoNuevo === 'DESISTIMIENTO';
  const isFormClosed = !show;

  const btnBaseStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: 'bold',
    cursor: 'pointer', borderRadius: '6px', border: '1px solid #0b63c8', transition: 'all 0.2s ease-in-out'
  };

  const btnConsStyle = {
    ...btnBaseStyle,
    backgroundColor: (isFormClosed || isConsentActive) ? '#0b63c8' : '#ffffff',
    color: (isFormClosed || isConsentActive) ? '#ffffff' : '#0b63c8',
  };

  const btnDesStyle = {
    ...btnBaseStyle,
    backgroundColor: (isFormClosed || isDesistActive) ? '#0b63c8' : '#ffffff',
    color: (isFormClosed || isDesistActive) ? '#ffffff' : '#0b63c8',
  };

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Consentimiento y desistimiento</h2>
          <p className="hint" style={{ margin: '5px 0 0 0' }}>Se carga la plantilla ACTIVA de esta IPS. El auxiliar solo llena paciente y firma; el texto legal sale de esa plantilla. Luego se genera el PDF.</p>
        </div>

        <div className="toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => { setTipoNuevo('CONSENTIMIENTO'); setShow(true); }} style={btnConsStyle}>
            <span style={{ fontSize: '18px', lineHeight: '1' }}>+</span>
            Crear Consentimiento <span style={{ opacity: 0.8, fontSize: '12px', fontWeight: 'normal', marginLeft: '4px' }}>(HC-FM-04)</span>
          </button>

          <button onClick={() => { setTipoNuevo('DESISTIMIENTO'); setShow(true); }} style={btnDesStyle}>
            <span style={{ fontSize: '18px', lineHeight: '1' }}>+</span>
            Crear Desistimiento <span style={{ opacity: 0.8, fontSize: '12px', fontWeight: 'normal', marginLeft: '4px' }}>(HC-FM-06)</span>
          </button>
        </div>
      </div>

      {show && <DocumentoSian tipo={tipoNuevo} onDone={() => { setShow(false); cargar(); }} onCancel={() => setShow(false)} />}

      {!show && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            placeholder="Buscar por cédula o tipo..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
          <button type="button" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Buscar</button>
        </div>
      )}

      {pdfUrl && (
        <div className="card" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:20,width:'90%',maxWidth:900,height:'80vh',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <h3 style={{margin:0}}>Vista previa del documento</h3>
              <button onClick={() => setPdfUrl(null)} style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 12px',cursor:'pointer'}}>Cerrar</button>
            </div>
            <iframe src={pdfUrl} style={{flex:1,border:'none',borderRadius:8}} title="PDF" />
            <div style={{marginTop:10,textAlign:'right'}}>
              <a href={pdfUrl} target="_blank" rel="noreferrer"><button style={{background:'#1a5fb4',color:'#fff',border:'none',borderRadius:6,padding:'8px 16px',cursor:'pointer'}}>Descargar</button></a>
            </div>
          </div>
        </div>
      )}

      {!show && (
        <div className="table-wrap" style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#0b63c8', color: '#fff', textAlign: 'left' }}><th style={{ padding: '12px' }}>Consecutivo</th><th style={{ padding: '12px' }}>Fecha</th><th style={{ padding: '12px' }}>Tipo</th><th style={{ padding: '12px' }}>Código</th><th style={{ padding: '12px' }}>Documento</th><th style={{ padding: '12px' }}>Profesional</th><th style={{ padding: '12px' }}>Firmado</th><th style={{ padding: '12px' }}>Estado</th><th style={{ padding: '12px' }}>Correo</th><th style={{ padding: '12px' }}></th></tr></thead>
            <tbody>
              {items.filter(c => !filtro || JSON.stringify(c).toLowerCase().includes(filtro.toLowerCase())).sort((a, b) => new Date(a.fechaCreacion || 0).getTime() - new Date(b.fechaCreacion || 0).getTime()).slice((page - 1) * perPage, page * perPage).map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>{c.codigo}-{String(c.consecutivo || c.id).padStart(4, '0')}</td>
                  <td style={{ padding: '12px' }}>{c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px' }}>{c.tipo}</td><td style={{ padding: '12px' }}>{c.codigo}</td><td style={{ padding: '12px' }}>{c.documento}</td>
                  <td style={{ padding: '12px' }}>{c.nombreAuxiliar || c.nombreProfesional || c.aux || '—'}<br/><small style={{color:'#666'}}>REG: {c.registroAuxiliar || c.registroProfesional || c.reg || '—'}</small></td>
                  <td style={{ padding: '12px' }}>{c.firmado ? 'Sí' : 'No'}</td><td style={{ padding: '12px' }}><span style={{ color: c.activo === false ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{c.activo === false ? 'Anulado' : 'Activo'}</span></td>
                  <td style={{ padding: '12px' }}>{c.correoEnviado ? c.correoDestino : '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button onClick={() => setPdfUrl(consentimientoService.pdfUrl(c.id))} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #0b63c8', background: '#0b63c8', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Ver PDF</button>
                      {['SUPERADMIN','ADMINIPS','RADIOPERADOR'].includes(rol) && <a href={consentimientoService.pdfUrl(c.id)} download style={{marginLeft:4}}><button style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #10B981', background: '#f0fdf4', color: '#10B981', cursor: 'pointer' }}>Descargar</button></a>}
                      {['SUPERADMIN','ADMINIPS','RADIOPERADOR'].includes(rol) && <button onClick={async () => {
                        const correo = prompt('Correo de destino (vacío = correo de la IPS):') || '';
                        const dest = correo || 'correo institucional de la IPS';
                        if (!confirm(`¿Enviar el documento a ${dest}?\n\nEste envío cumple con la Ley 1581 de 2012 de protección de datos personales. El documento contiene información confidencial del paciente.`)) return;
                        try {
                          await consentimientoService.enviar(c.id, correo);
                          alert('✓ Correo enviado correctamente\n\nDestino: ' + dest + '\n\nEl documento fue enviado y registrado en la bitácora.');
                          cargar();
                        } catch (e: any) {
                          if (!navigator.onLine) {
                            alert('⚠ Sin conexión\n\nEl correo se enviará automáticamente cuando haya internet.');
                          } else {
                            alert('✗ No se pudo enviar\n\nVerifique la configuración de correo en Configuración IPS.');
                          }
                        }
                      }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Enviar</button>}
                      {rol === 'SUPERADMIN' && <button onClick={async () => { if (confirm('¿Eliminar permanentemente este consentimiento? El consecutivo quedará libre. Esta acción no se puede deshacer.')) { await consentimientoService.eliminar(c.id); cargar(); } }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#EF4444', cursor: 'pointer' }}>Eliminar</button>}
                      {['ADMINIPS','RADIOPERADOR'].includes(rol) && c.activo !== false && <button onClick={async () => { if (confirm('¿Anular este consentimiento? Quedará registrado en la bitácora.')) { await consentimientoService.anular(c.id); cargar(); } }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #fcd34d', background: '#fffbeb', color: '#F59E0B', cursor: 'pointer' }}>Anular</button>}
                      {['ADMINIPS','RADIOPERADOR'].includes(rol) && c.activo === false && <button onClick={async () => { if (confirm('¿Activar nuevamente este consentimiento?')) { await consentimientoService.activar(c.id); cargar(); } }} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #86efac', background: '#f0fdf4', color: '#10B981', cursor: 'pointer' }}>Activar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8f9fa', borderTop: '1px solid #e9ecef', borderRadius: '0 0 8px 8px' }}>
            <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>{items.length} registros</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: page === 1 ? '#f3f4f6' : '#ffffff', color: page === 1 ? '#9ca3af' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>← Ant</button>
              <span style={{ fontWeight: 'bold', color: '#111827', fontSize: 13 }}>Página {page} de {Math.ceil(items.length / perPage) || 1}</span>
              <button disabled={page * perPage >= items.length} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: page * perPage >= items.length ? '#f3f4f6' : '#ffffff', color: page * perPage >= items.length ? '#9ca3af' : '#374151', cursor: page * perPage >= items.length ? 'not-allowed' : 'pointer' }}>Sig →</button>
            </div>
          </div>
        </div>
      )}
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
  const [docAcomp, setDocAcomp] = useState('');
  const [parentescoAcomp, setParentescoAcomp] = useState('');
  const [aux, setAux] = useState('');
  const [cedulaAux, setCedulaAux] = useState('');
  const [reg, setReg] = useState('');
  const [leido, setLeido] = useState(false);
  const [hora] = useState(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
  const [fecha] = useState(new Date().toLocaleDateString('es-CO'));
  const firmaRef = useRef<any>(null);
  const huellaRef = useRef<any>(null);
  const firmaProfRef = useRef<any>(null);
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
    if (!confirm('Este documento contiene información confidencial del paciente conforme a la Ley 1581 de 2012.\n\n¿Confirma que desea guardar el consentimiento/desistimiento?')) return;

    if (!navigator.onLine) {
      const firma = firmaRef.current?.toDataURL?.() || firmaRef.current?.getBase64?.();
      const huella = huellaRef.current?.toDataURL?.() || huellaRef.current?.getBase64?.();
      const firmaProf = firmaProfRef.current?.toDataURL?.() || firmaProfRef.current?.getBase64?.();

      const payload = {
        tipo, codigo, plantillaId: plantilla?.id, beneficios: plantilla?.beneficios, riesgos: plantilla?.riesgos, alternativas: plantilla?.alternativas, observaciones: plantilla?.textoLegal,
        documento: pac?.documento, telefono: pac?.telefono, calidad: calidad + (responsableDe ? ' de ' + responsableDe : ''), procedimientos: [...procs, otro].filter(Boolean).join('; '),
        nombreAcompanante: acomp, nombreAuxiliar: aux, cedulaAuxiliar: cedulaAux, documentoAuxiliar: cedulaAux, registroAuxiliar: reg, firmaProfesional: firmaProf,
        documentoAcompanante: docAcomp, parentescoAcompanante: parentescoAcomp, firma, huella, huellaDigital: huella, firmado: true,
      };

      addPending('consentimiento', payload, {
        pacienteNombre: `${pac?.nombre || ''} ${pac?.apellido || ''}`.trim(), pacienteDocumento: pac?.documento || '',
        tipoDocumento: tipo === 'DESISTIMIENTO' ? 'Desistimiento' : 'Consentimiento',
      });

      alert(offlineMessage(tipo === 'DESISTIMIENTO' ? 'desistimiento' : 'consentimiento', `${pac?.nombre || ''} ${pac?.apellido || ''}`.trim() + (pac?.documento ? ` (${pac.documento})` : '')));
      onDone();
      return;
    }

    if (!pac) return alert('Busque o cree el paciente');
    if (!leido) return alert('Debe confirmar que el paciente leyó el documento');
    if (!aux?.trim()) return alert('El nombre del profesional es obligatorio');
    if (!cedulaAux?.trim()) return alert('La cédula del profesional es obligatoria');
    if (!reg?.trim()) return alert('El registro profesional es obligatorio');
    if (!acomp?.trim()) return alert('El nombre del acompañante es obligatorio');
    if (!docAcomp?.trim()) return alert('La cédula del acompañante es obligatoria');
    if (!parentescoAcomp?.trim()) return alert('El parentesco es obligatorio');

    const firma = firmaRef.current?.toDataURL?.() || firmaRef.current?.getBase64?.();
    const huella = huellaRef.current?.toDataURL?.() || huellaRef.current?.getBase64?.();
    const firmaProf = firmaProfRef.current?.toDataURL?.() || firmaProfRef.current?.getBase64?.();

    if ((!firma || String(firma).length < 80) && (!huella || String(huella).length < 80)) {
      return alert('Debe firmar o colocar la huella en el recuadro.');
    }

    try {
      await consentimientoService.crear({
        tipo, codigo, plantillaId: plantilla?.id, beneficios: plantilla?.beneficios, riesgos: plantilla?.riesgos, alternativas: plantilla?.alternativas, observaciones: plantilla?.textoLegal,
        documento: pac.documento, telefono: pac.telefono, calidad: calidad + (responsableDe ? ' de ' + responsableDe : ''), procedimientos: [...procs, otro].filter(Boolean).join('; '),
        nombreAcompanante: acomp, nombreAuxiliar: aux, cedulaAuxiliar: cedulaAux, documentoAuxiliar: cedulaAux, registroAuxiliar: reg, firmaProfesional: firmaProf,
        documentoAcompanante: docAcomp, parentescoAcompanante: parentescoAcomp, firma, huella, huellaDigital: huella, firmado: true,
      });
      onDone();
      alert('Consentimiento del paciente ' + (pac?.nombre || '') + ' ' + (pac?.apellido || '') + ' enviado a CliniSign.');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al guardar. Revise la consola del backend.');
    }
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
          <button type="button" onClick={crearPac} style={{ padding: '8px 16px', borderRadius: '6px', background: '#0b63c8', color: '#fff', border: 'none', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }}>Registrar paciente</button>
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
      <div className="form-grid">
        <label>Acompañante mayor de edad responsable (*)<input className="linea" value={acomp} onChange={e => setAcomp(e.target.value)} /></label>
        <label>Cédula del acompañante<input className="linea" value={docAcomp} onChange={e => setDocAcomp(e.target.value)} placeholder="Número de cédula" /></label>
        <label>Parentesco<input className="linea" value={parentescoAcomp} onChange={e => setParentescoAcomp(e.target.value)} placeholder="Parentesco" /></label>
      </div>
      <p className="hint">Usuario que registra este documento: <strong>{nombre}</strong> · {rol} · {email}. El APH se precarga con la sesión.</p>
      <SignaturePad ref={firmaProfRef} label="Firma del profesional / APH (*)" />
      <label>Nombre del profesional que genera el documento (*)<input className="linea" value={aux} onChange={e => setAux(e.target.value)} placeholder="Nombre completo" required /></label>
      <label>Cédula del profesional (*)<input className="linea" value={cedulaAux} onChange={e => setCedulaAux(e.target.value)} placeholder="Número de cédula" required /></label>
      <label>Registro profesional (*)<input className="linea" value={reg} onChange={e => setReg(e.target.value)} placeholder="Registro" required /></label>
      <div className="toolbar" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={guardar} style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold' }}>Guardar, generar PDF y almacenar</button>
        <button onClick={() => {
          setPac(null);
          setAlta({ nombre: '', apellido: '', documento: '', telefono: '', tipoDocumento: 'CC' });
          setAcomp(''); setDocAcomp(''); setParentescoAcomp(''); setAux(''); setCedulaAux(''); setReg(''); setProcs([]); setOtro('');
          firmaRef.current?.clear?.(); huellaRef.current?.clear?.(); firmaProfRef.current?.clear?.();
          alert('✓ Formulario limpiado');
        }} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#EF4444', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold' }}>Limpiar formulario</button>
        <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', background: '#f3f4f6', border: '1px solid #d1d5db', color: '#374151' }}>Cancelar</button>
      </div>
    </div>
  );
}
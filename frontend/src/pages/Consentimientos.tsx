import { useEffect, useRef, useState } from 'react';
import { consentimientoService, historiaClinicaService } from '../services/rest';
import SignaturePad from '../components/SignaturePad';

export default function Consentimientos() {
  const [items, setItems] = useState<any[]>([]);
  const [historias, setHistorias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const cargar = async () => {
    const [cons, hcs] = await Promise.all([consentimientoService.listar(), historiaClinicaService.listar()]);
    setItems(cons.data); setHistorias(hcs.data);
  };
  useEffect(() => { cargar(); }, []);

  return (
    <div>
      <div className="page-head">
        <h2>Consentimientos</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>Nuevo</button>
      </div>
      {showForm && <Form historias={historias} onSave={async (data: any) => {
        await consentimientoService.crear(data); setShowForm(false); cargar();
      }} onCancel={() => setShowForm(false)} />}
      {pdfUrl && (
        <div className="card">
          <iframe className="pdf-frame" src={pdfUrl} title="PDF consentimiento" />
          <button onClick={() => setPdfUrl(null)}>Cerrar PDF</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Código</th><th>Documento</th><th>Firmado</th><th>Correo</th><th></th></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id}>
                <td>{c.tipo}</td><td>{c.codigo}</td><td>{c.documento}</td>
                <td>{c.firmado ? 'Sí' : 'No'}</td>
                <td>{c.correoEnviado ? 'Sí' : 'No'}</td>
                <td>
                  <button onClick={() => setPdfUrl(consentimientoService.pdfUrl(c.id))}>Ver PDF</button>
                  <button onClick={async () => { if (confirm('¿Eliminar?')) { await consentimientoService.eliminar(c.id); cargar(); } }}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Form({ historias, onSave, onCancel }: any) {
  const firmaRef = useRef<any>(null);
  const huellaRef = useRef<any>(null);
  const [form, setForm] = useState<any>({
    historiaClinicaId: '', tipo: 'CONSENTIMIENTO', calidad: 'PACIENTE',
    procedimientos: '', observaciones: '', documento: '', telefono: '',
    nombreAuxiliar: '', registroAuxiliar: '', correoDestino: '',
  });
  return (
    <div className="card">
      <h3>Nuevo consentimiento</h3>
      <div className="form-grid">
        <select value={form.historiaClinicaId} onChange={e => setForm({ ...form, historiaClinicaId: e.target.value })}>
          <option value="">Historia clínica...</option>
          {historias.map((hc: any) => <option key={hc.id} value={hc.id}>HC #{hc.id} — {hc.paciente?.nombre}</option>)}
        </select>
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
          <option value="CONSENTIMIENTO">Consentimiento HC-FM-04</option>
          <option value="DESISTIMIENTO">Desistimiento HC-FM-06</option>
        </select>
        <select value={form.calidad} onChange={e => setForm({ ...form, calidad: e.target.value })}>
          <option value="PACIENTE">Paciente</option>
          <option value="ACUDIENTE">Acudiente</option>
          <option value="REPRESENTANTE">Representante</option>
        </select>
        <input placeholder="Documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} />
        <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
        <input placeholder="Correo destino" value={form.correoDestino} onChange={e => setForm({ ...form, correoDestino: e.target.value })} />
        <input placeholder="Nombre auxiliar" value={form.nombreAuxiliar} onChange={e => setForm({ ...form, nombreAuxiliar: e.target.value })} />
        <input placeholder="Registro auxiliar" value={form.registroAuxiliar} onChange={e => setForm({ ...form, registroAuxiliar: e.target.value })} />
      </div>
      <textarea placeholder="Procedimientos" value={form.procedimientos} onChange={e => setForm({ ...form, procedimientos: e.target.value })} />
      <textarea placeholder="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
      <div className="form-grid-2" style={{ marginTop: 12 }}>
        <div><strong>Firma</strong><SignaturePad ref={firmaRef} label="firma" /></div>
        <div><strong>Huella</strong><SignaturePad ref={huellaRef} label="huella" /></div>
      </div>
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn-primary" onClick={() => onSave({
          ...form,
          firma: firmaRef.current?.getBase64() || null,
          huellaDigital: huellaRef.current?.getBase64() || null,
        })}>Guardar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

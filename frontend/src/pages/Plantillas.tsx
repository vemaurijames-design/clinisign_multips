import { useEffect, useState } from 'react';
import { plantillaService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

export default function Plantillas() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [buscado, setBuscado] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [tipoPdf, setTipoPdf] = useState('');
  const { rol } = useAuth();
  const puedeEditar = rol === 'SUPERADMIN';

  const cargar = () => plantillaService.listar().then(r => setItems(r.data || [])).catch(() => setItems([]));
  useEffect(() => { cargar(); }, []);

  const analizarPdf = async (file?: File) => {
    if (!file) return;
    setAnalizando(true);
    try {
      const { data } = await plantillaService.desdePdf(file, tipoPdf || undefined);
      setForm(data);
      setMsg('PDF leído. Revise los textos, ajuste y guarde. El modelo queda para visualizar.');
      cargar();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'No se pudo analizar el PDF');
    } finally {
      setAnalizando(false);
    }
  };

  const guardar = async () => {
    const saved = await plantillaService.guardar(form);
    setForm(saved.data);
    setMsg('Plantilla guardada en esta IPS.');
    cargar();
  };

  const visibles = items.filter(p =>
    !buscado || `${p.nombre} ${p.tipo} ${p.codigo}`.toLowerCase().includes(buscado.toLowerCase())
  );

  return (
    <div>
      <h2>Plantillas de esta IPS</h2>
      <p className="hint">Adjunte el PDF oficial. CliniSign extrae beneficios, riesgos y texto legal. El PDF del paciente se genera después con logo y datos reales.</p>
      {msg && <div className="card">{msg}</div>}
      {!puedeEditar && <div className="card">Solo el SUPERADMIN carga plantillas de cada IPS (evita formatos cruzados). Usted puede verlas y usarlas en Consentimientos.</div>}
      {puedeEditar && <div className="card">
        <h3>1. Adjuntar PDF y analizar</h3>
        <div className="toolbar">
          <select value={tipoPdf} onChange={e => setTipoPdf(e.target.value)}>
            <option value="">Detectar tipo</option>
            <option value="CONSENTIMIENTO">Consentimiento</option>
            <option value="DESISTIMIENTO">Desistimiento</option>
          </select>
          <input type="file" accept="application/pdf" onChange={e => analizarPdf(e.target.files?.[0])} />
          {analizando && <span className="hint">Analizando PDF…</span>}
        </div>
      </div>}
      {(form.nombre || form.id) && (
        <div className="card">
          <h3>2. Textos extraídos</h3>
          <div className="form-grid">
            <select value={form.tipo || 'CONSENTIMIENTO'} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              <option value="CONSENTIMIENTO">Consentimiento</option>
              <option value="DESISTIMIENTO">Desistimiento</option>
            </select>
            <input placeholder="Nombre" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input placeholder="Código" value={form.codigo || ''} onChange={e => setForm({ ...form, codigo: e.target.value })} />
            <input placeholder="Versión" value={form.version || ''} onChange={e => setForm({ ...form, version: e.target.value })} />
          </div>
          <textarea placeholder="Procedimientos" value={form.procedimientos || ''} onChange={e => setForm({ ...form, procedimientos: e.target.value })} />
          <textarea placeholder="Beneficios" value={form.beneficios || ''} onChange={e => setForm({ ...form, beneficios: e.target.value })} />
          <textarea placeholder="Riesgos" value={form.riesgos || ''} onChange={e => setForm({ ...form, riesgos: e.target.value })} />
          <textarea placeholder="Alternativas" value={form.alternativas || ''} onChange={e => setForm({ ...form, alternativas: e.target.value })} />
          <textarea placeholder="Texto legal" value={form.textoLegal || ''} onChange={e => setForm({ ...form, textoLegal: e.target.value })} />
          <button className="btn-primary" onClick={guardar}>Guardar plantilla</button>
          {form.archivoModeloUrl && <iframe className="pdf-frame" title="Modelo" src={form.archivoModeloUrl} style={{ marginTop: 12 }} />}
        </div>
      )}
      <div className="toolbar">
        <input placeholder="Buscar plantilla por nombre o código" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" className="btn-primary" onClick={() => setBuscado(q)}>Buscar</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Tipo</th><th>Nombre</th><th>Código</th><th>PDF</th><th></th></tr></thead>
          <tbody>
            {visibles.map(p => (
              <tr key={p.id}>
                <td>{p.tipo}</td><td>{p.nombre}</td><td>{p.codigo}</td>
                <td>{p.archivoModeloUrl ? <a href={p.archivoModeloUrl} target="_blank" rel="noreferrer">Ver PDF</a> : '—'}</td>
                <td><button onClick={() => setForm(p)}>Ver / editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

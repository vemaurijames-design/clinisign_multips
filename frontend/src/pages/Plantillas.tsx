import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { plantillaService } from '../services/rest';
import { useAuth } from '../context/AuthContext';

const SLOTS = [
  { tipo: 'CONSENTIMIENTO', titulo: 'Consentimiento informado', codigo: 'HC-FM-04', ruta: '/consentimientos?tipo=CONSENTIMIENTO' },
  { tipo: 'DESISTIMIENTO', titulo: 'Desistimiento informado', codigo: 'HC-FM-06', ruta: '/consentimientos?tipo=DESISTIMIENTO' },
  { tipo: 'HISTORIA_CLINICA', titulo: 'Historia clínica', codigo: 'HC-FM-05', ruta: '/historias-clinicas' },
];

export default function Plantillas() {
  const { ipsNombre, rol } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const puede = rol === 'SUPERADMIN';

  const cargar = () => plantillaService.listar().then(r => setItems(r.data || [])).catch(() => setItems([]));
  useEffect(() => { cargar(); }, [ipsNombre]);

  const activa = (tipo: string) =>
    items.filter(p => p.tipo === tipo && p.activa !== false).sort((a, b) => (b.id || 0) - (a.id || 0))[0]
    || items.filter(p => p.tipo === tipo).sort((a, b) => (b.id || 0) - (a.id || 0))[0];

  const subir = async (tipo: string, file?: File) => {
    if (!file) return;
    try {
      const { data } = await plantillaService.desdePdf(file, tipo);
      setMsg('Plantilla ' + tipo + ' guardada solo para ' + ipsNombre + '.');
      setEdit(data);
      cargar();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'No se pudo leer el PDF');
    }
  };

  const guardar = async () => {
    const saved = await plantillaService.guardar({ ...edit, activa: true });
    setEdit(saved.data);
    setMsg('Activa en esta IPS. El auxiliar ya la verá al llenar el formulario.');
    cargar();
  };

  if (!ipsNombre) {
    return <div className="card">Seleccione la IPS en la barra superior. Las plantillas viven en la BD de esa IPS.</div>;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Plantillas de {ipsNombre}</h2>
          <p className="hint">
            Estas tres plantillas están en la base de datos de <strong>{ipsNombre}</strong>.
            Otra IPS no las ve. El auxiliar carga solo la activa de esta institución.
          </p>
        </div>
      </div>
      {msg && <div className="card">{msg}</div>}

      <div className="grid-stats">
        {SLOTS.map(slot => {
          const p = activa(slot.tipo);
          return (
            <div className="card" key={slot.tipo}>
              <h3>{slot.titulo}</h3>
              <p className="hint">Código {slot.codigo} · {slot.tipo}</p>
              {p ? (
                <>
                  <p><strong>{p.nombre || slot.titulo}</strong></p>
                  <p className="hint">{p.codigo} v{p.version || '01'} · {p.activa === false ? 'inactiva' : 'ACTIVA en esta IPS'}</p>
                  <div className="toolbar">
                    <Link to={slot.ruta}><button className="btn-primary">Llenar formulario</button></Link>
                    {puede && <button onClick={() => setEdit(p)}>Editar textos</button>}
                  </div>
                </>
              ) : (
                <p className="hint">Aún no hay plantilla de este tipo en {ipsNombre}.</p>
              )}
              {puede && (
                <div style={{ marginTop: 10 }}>
                  <label className="hint">PDF oficial de {slot.titulo}</label>
                  <input type="file" accept="application/pdf" onChange={e => subir(slot.tipo, e.target.files?.[0])} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {edit && puede && (
        <div className="card">
          <h3>Textos de {edit.tipo} — solo {ipsNombre}</h3>
          <div className="form-grid">
            <input value={edit.nombre || ''} onChange={e => setEdit({ ...edit, nombre: e.target.value })} placeholder="Nombre" />
            <input value={edit.codigo || ''} onChange={e => setEdit({ ...edit, codigo: e.target.value })} placeholder="Código" />
            <input value={edit.version || ''} onChange={e => setEdit({ ...edit, version: e.target.value })} placeholder="Versión" />
          </div>
          <textarea value={edit.procedimientos || ''} onChange={e => setEdit({ ...edit, procedimientos: e.target.value })} placeholder="Procedimientos" />
          <textarea value={edit.beneficios || ''} onChange={e => setEdit({ ...edit, beneficios: e.target.value })} placeholder="Beneficios" />
          <textarea value={edit.riesgos || ''} onChange={e => setEdit({ ...edit, riesgos: e.target.value })} placeholder="Riesgos" />
          <textarea value={edit.alternativas || ''} onChange={e => setEdit({ ...edit, alternativas: e.target.value })} placeholder="Alternativas" />
          <textarea value={edit.textoLegal || ''} onChange={e => setEdit({ ...edit, textoLegal: e.target.value })} placeholder="Texto legal que leerá el paciente" />
          <div className="toolbar">
            <button className="btn-primary" onClick={guardar}>Guardar y dejar activa</button>
            <button onClick={() => setEdit(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

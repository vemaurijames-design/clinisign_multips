/**
 * Cola offline robusta para CliniSign (móvil / baja conectividad)
 * - Guarda consentimientos e historias clínicas completas en localStorage
 * - Informa al usuario cuando no hay internet
 * - Envía automáticamente todo el payload al volver online
 * - Permite seguir trabajando y crear más documentos offline
 */

const PENDING_KEY = 'clinisign_pending_queue_v2';
const MAX_ITEMS = 50;

export type PendingType = 'historia' | 'consentimiento';

export type PendingItem = {
  id: string;
  type: PendingType;
  endpoint: string;
  payload: any;
  summary: {
    pacienteNombre?: string;
    pacienteDocumento?: string;
    tipoDocumento?: string;
  };
  createdAt: string;
  attempts: number;
};

function readQueue(): PendingItem[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingItem[]) {
  const trimmed = queue.slice(-MAX_ITEMS);
  localStorage.setItem(PENDING_KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent('clinisign-pending-changed', { detail: { count: trimmed.length } }));
}

/** Agregar un registro pendiente (cuando no hay internet) */
export function addPending(
  type: PendingType,
  payload: any,
  summary?: { pacienteNombre?: string; pacienteDocumento?: string; tipoDocumento?: string }
): string {
  const queue = readQueue();
  const item: PendingItem = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    endpoint: type === 'historia' ? '/historias-clinicas' : '/consentimientos',
    payload,
    summary: summary || {
      pacienteNombre: payload.nombrePaciente || payload.pacienteNombre || '',
      pacienteDocumento: payload.documento || payload.pacienteDocumento || '',
      tipoDocumento: type === 'historia' ? 'Historia clínica' : (payload.tipo || 'Consentimiento'),
    },
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  queue.push(item);
  writeQueue(queue);
  return item.id;
}

/** Procesar toda la cola (llamar cuando hay internet) */
export async function processPendingQueue(
  historiaCrear: (data: any) => Promise<any>,
  consentimientoCrear: (data: any) => Promise<any>
): Promise<{ enviados: number; fallidos: number }> {
  if (!navigator.onLine) return { enviados: 0, fallidos: 0 };

  const queue = readQueue();
  if (queue.length === 0) return { enviados: 0, fallidos: 0 };

  let enviados = 0;
  const restantes: PendingItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'historia') {
        await historiaCrear(item.payload);
      } else {
        await consentimientoCrear(item.payload);
      }
      enviados++;
    } catch (e) {
      item.attempts = (item.attempts || 0) + 1;
      if (item.attempts < 5) {
        restantes.push(item);
      }
    }
  }

  writeQueue(restantes);
  return { enviados, fallidos: restantes.length };
}

export function countPending(): number {
  return readQueue().length;
}

export function listPending(): PendingItem[] {
  return readQueue();
}

export function removePending(id: string) {
  const queue = readQueue().filter(i => i.id !== id);
  writeQueue(queue);
}

export function clearPending() {
  localStorage.removeItem(PENDING_KEY);
  window.dispatchEvent(new CustomEvent('clinisign-pending-changed', { detail: { count: 0 } }));
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Mensaje profesional cuando NO hay internet
 */
export function offlineMessage(tipo: string, paciente?: string): string {
  const lineaPaciente = paciente ? `\n\nPaciente: ${paciente}` : '';
  return (
    'SIN CONEXIÓN A INTERNET\n\n' +
    `El ${tipo} se ha guardado correctamente como borrador local en este dispositivo.` +
    lineaPaciente +
    '\n\n' +
    'Toda la información (datos clínicos, firmas y adjuntos) permanece segura en el equipo.\n\n' +
    'Puede cerrar este módulo y continuar trabajando con normalidad. ' +
    'Cuando el dispositivo se conecte nuevamente a una red, el documento se enviará de forma automática a CliniSign con la información completa.'
  );
}

/**
 * Mensaje profesional cuando SE RESTAURA la conexión
 */
export function onlineSuccessMessage(cantidad: number): string {
  const docs = cantidad === 1 ? '1 documento pendiente' : `${cantidad} documentos pendientes`;
  return (
    'CONEXIÓN RESTAURADA\n\n' +
    `Se enviaron correctamente ${docs} a CliniSign.\n\n` +
    'Los documentos ya se encuentran disponibles en el sistema con toda su información.'
  );
}

/** Migrar claves antiguas de versiones previas */
export function migrateOldPendingKeys() {
  try {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith('consent_pending_') ||
      k.startsWith('hc_pending_') ||
      k.startsWith('clinisign_consent_draft_') ||
      k === 'hc_borrador' ||
      k === 'historiaClinicaDraft'
    );
    if (keys.length === 0) return;
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (key.startsWith('consent') || key.includes('consent')) {
          if (data.documento || data.pacienteId || data.pac) {
            const payload = data.payload || data;
            addPending('consentimiento', payload, {
              pacienteNombre: data.pac ? `${data.pac.nombre || ''} ${data.pac.apellido || ''}`.trim() : (data.nombrePaciente || ''),
              pacienteDocumento: data.pac?.documento || data.documento || '',
              tipoDocumento: data.tipo || 'Consentimiento',
            });
          }
        } else if (data.pacienteId || data.form) {
          const payload = data.form ? { ...data.form, pacienteId: data.pacId || data.pacienteId } : data;
          addPending('historia', payload, {
            pacienteNombre: data.nombrePaciente || '',
            pacienteDocumento: data.documento || '',
            tipoDocumento: 'Historia clínica',
          });
        }
      } catch {}
      localStorage.removeItem(key);
    }
  } catch {}
}
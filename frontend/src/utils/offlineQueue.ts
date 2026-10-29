// Cola offline simple y gratuita (localStorage)
// Guarda payloads listos para enviar al backend

const PENDING_KEY = 'clinisign_pending_queue';

export type PendingItem = {
  id: string;
  type: 'historia' | 'consentimiento';
  endpoint: string;
  payload: any;
  createdAt: string;
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
  localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
}

/** Agregar un registro pendiente (cuando no hay internet) */
export function addPending(type: 'historia' | 'consentimiento', payload: any) {
  const queue = readQueue();
  const item: PendingItem = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    endpoint: type === 'historia' ? '/historias-clinicas' : '/consentimientos',
    payload,
    createdAt: new Date().toISOString(),
  };
  queue.push(item);
  writeQueue(queue);
  return item.id;
}

/** Procesar toda la cola (llamar cuando hay internet) */
export async function processPendingQueue(
  historiaCrear: (data: any) => Promise<any>,
  consentimientoCrear: (data: any) => Promise<any>
): Promise<number> {
  if (!navigator.onLine) return 0;
  const queue = readQueue();
  if (queue.length === 0) return 0;
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
      restantes.push(item);
    }
  }
  writeQueue(restantes);
  return enviados;
}

/** Contar pendientes (para mostrar indicador) */
export function countPending(): number {
  return readQueue().length;
}

/** Borrar todo (solo para pruebas) */
export function clearPending() {
  localStorage.removeItem(PENDING_KEY);
}
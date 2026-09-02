import api, { apiOrigin } from './api';

function authQs() {
  const token = localStorage.getItem('token') || '';
  const ipsId = localStorage.getItem('ipsId') || '';
  return `token=${encodeURIComponent(token)}&ipsId=${encodeURIComponent(ipsId)}`;
}

export const ipsService = {
  listar: () => api.get('/ips/list'),
  listarAdmin: () => api.get('/ips/admin'),
  obtener: (id: number) => api.get(`/ips/${id}`),
  crear: (dto: any) => api.post('/ips/create', dto),
  actualizar: (id: number, dto: any) => api.put(`/ips/${id}`, dto),
  config: (id: number) => api.get(`/ips/${id}/config`),
  guardarConfig: (id: number, dto: any) => api.put(`/ips/${id}/config`, dto),
  subirLogo: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/ips/${id}/logo`, fd);
  },
};

export const citaService = {
  listar: () => api.get('/citas'),
  porPaciente: (pacienteId: number) => api.get(`/citas/paciente/${pacienteId}`),
  hoy: () => api.get('/citas/hoy'),
  proximas: () => api.get('/citas/proximas'),
  resumen: () => api.get('/citas/resumen'),
  crear: (data: any) => api.post('/citas', data),
  actualizar: (id: number, data: any) => api.put(`/citas/${id}`, data),
  eliminar: (id: number) => api.delete(`/citas/${id}`),
  recordatorio: (id: number) => api.post(`/citas/${id}/recordatorio`),
};

export const superadminService = {
  usuarios: (ipsId: number) => api.get(`/superadmin/ips/${ipsId}/usuarios`),
  crearUsuario: (ipsId: number, data: any) => api.post(`/superadmin/ips/${ipsId}/usuarios`, data),
  actualizarUsuario: (ipsId: number, userId: number, data: any) =>
    api.put(`/superadmin/ips/${ipsId}/usuarios/${userId}`, data),
  toggleUsuario: (ipsId: number, userId: number, activo: boolean) =>
    api.put(`/superadmin/ips/${ipsId}/usuarios/${userId}/activo?activo=${activo}`),
  eliminarUsuario: (ipsId: number, userId: number) =>
    api.delete(`/superadmin/ips/${ipsId}/usuarios/${userId}`),
  resumen: (ipsId: number) => api.get(`/superadmin/ips/${ipsId}/resumen`),
};

export const pacienteService = {
  listar: () => api.get('/pacientes'),
  buscar: (q: string) => api.get('/pacientes/buscar', { params: { q } }),
  crear: (data: any) => api.post('/pacientes', data),
  actualizar: (id: number, data: any) => api.put(`/pacientes/${id}`, data),
  eliminar: (id: number) => api.delete(`/pacientes/${id}`),
  exportExcel: () => api.get('/pacientes/export/excel', { responseType: 'blob' }),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/pacientes/import/excel', formData);
  },
};

export const ambulanciaService = {
  listar: () => api.get('/ambulancias'),
  crear: (data: any) => api.post('/ambulancias', data),
  actualizar: (id: number, data: any) => api.put(`/ambulancias/${id}`, data),
  eliminar: (id: number) => api.delete(`/ambulancias/${id}`),
};

export const solicitudService = {
  listar: () => api.get('/solicitudes'),
  crear: (data: any) => api.post('/solicitudes', data),
  actualizar: (id: number, data: any) => api.put(`/solicitudes/${id}`, data),
  eliminar: (id: number) => api.delete(`/solicitudes/${id}`),
};

export const historiaClinicaService = {
  listar: () => api.get('/historias-clinicas'),
  porPaciente: (pacienteId: number) => api.get(`/historias-clinicas/paciente/${pacienteId}`),
  crear: (data: any) => api.post('/historias-clinicas', data),
  eliminar: (id: number) => api.delete(`/historias-clinicas/${id}`),
  pdfUrl: (id: number) => `${apiOrigin()}/api/historias-clinicas/${id}/pdf?${authQs()}`,
};

export const plantillaService = {
  listar: () => api.get('/plantillas'),
  activas: () => api.get('/plantillas/activas'),
  guardar: (data: any) => api.post('/plantillas', data),
  adjuntar: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/plantillas/${id}/modelo`, fd);
  },
  desdePdf: (file: File, tipo?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    const q = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    return api.post(`/plantillas/desde-pdf${q}`, fd);
  },
};

export const consentimientoService = {
  listar: () => api.get('/consentimientos'),
  porDocumento: (documento: string) => api.get(`/consentimientos/documento/${encodeURIComponent(documento)}`),
  crear: (data: any) => api.post('/consentimientos', data),
  eliminar: (id: number) => api.delete(`/consentimientos/${id}`),
  enviar: (id: number, correoDestino: string) => api.post(`/consentimientos/${id}/enviar`, { correoDestino }),
  pdfUrl: (id: number) =>
    `${apiOrigin()}/api/consentimientos/${id}/pdf?${authQs()}`,
};

export const notificacionService = {
  listar: () => api.get('/notificaciones'),
  leida: (id: number) => api.put(`/notificaciones/${id}/leida`),
};

export const auditoriaService = {
  listar: () => api.get('/auditoria'),
};

export const reporteService = {
  estadisticas: () => api.get('/reportes/estadisticas'),
  pdfUrl: () =>
    `${apiOrigin()}/api/reportes/pdf/general?${authQs()}`,
};

export const usuarioService = {
  listar: () => api.get('/usuarios'),
  crear: (data: any) => api.post('/usuarios', data),
  actualizar: (id: number, data: any) => api.put(`/usuarios/${id}`, data),
  toggleActivo: (id: number, activo: boolean) => api.put(`/usuarios/${id}/activo?activo=${activo}`),
  eliminar: (id: number) => api.delete(`/usuarios/${id}`),
};
